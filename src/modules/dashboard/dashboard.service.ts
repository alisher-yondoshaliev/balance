import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, User } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(marketId: string, currentUser: User) {
    // Market access
    if (currentUser.role === Role.OWNER) {
      const market = await this.prisma.market.findFirst({
        where: { id: marketId, ownerId: currentUser.id },
      });
      if (!market) throw new ForbiddenException("Bu marketga ruxsat yo'q");
    } else if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.MANAGER
    ) {
      if (currentUser.marketId !== marketId)
        throw new ForbiddenException("Bu marketga ruxsat yo'q");
    }

    const now = new Date();

    const [
      totalContracts,
      activeContracts,
      completedContracts,
      overdueContracts,
      totalCustomers,
      totalProducts,
      overdueInstallments,
      recentTransactions,
    ] = await Promise.all([
      // Shartnomalar soni
      this.prisma.contract.count({ where: { marketId } }),
      this.prisma.contract.count({ where: { marketId, status: 'ACTIVE' } }),
      this.prisma.contract.count({ where: { marketId, status: 'COMPLETED' } }),
      this.prisma.contract.count({ where: { marketId, status: 'OVERDUE' } }),

      // Mijozlar soni
      this.prisma.customer.count({ where: { marketId } }),

      // Mahsulotlar soni
      this.prisma.product.count({ where: { marketId, status: 'ACTIVE' } }),

      // Muddati o'tgan to'lovlar
      this.prisma.installment.count({
        where: {
          contract: { marketId },
          status: { in: ['OVERDUE', 'DUE'] },
          dueDate: { lt: now },
        },
      }),

      // So'nggi transactionlar
      this.prisma.transaction.findMany({
        where: { contract: { marketId } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            select: {
              contractNumber: true,
              customer: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

    // Umumiy summa hisoblash
    const totalAmounts = await this.prisma.contract.aggregate({
      where: { marketId },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        remainAmount: true,
      },
    });

    return {
      contracts: {
        total: totalContracts,
        active: activeContracts,
        completed: completedContracts,
        overdue: overdueContracts,
      },
      customers: { total: totalCustomers },
      products: { total: totalProducts },
      installments: { overdue: overdueInstallments },
      amounts: {
        total: totalAmounts._sum.totalAmount ?? 0,
        paid: totalAmounts._sum.paidAmount ?? 0,
        remain: totalAmounts._sum.remainAmount ?? 0,
      },
      recentTransactions,
    };
  }

  async getRevenue(marketId: string, currentUser: User) {
    if (currentUser.role === Role.OWNER) {
      const market = await this.prisma.market.findFirst({
        where: { id: marketId, ownerId: currentUser.id },
      });
      if (!market) throw new ForbiddenException("Bu marketga ruxsat yo'q");
    }

    // Oxirgi 12 oylik daromad
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const result = await this.prisma.transaction.aggregate({
        where: {
          contract: { marketId },
          type: { in: ['PAYMENT', 'DOWNPAYMENT'] },
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      months.push({
        year,
        month,
        amount: result._sum.amount ?? 0,
      });
    }

    return { revenue: months };
  }

  async getTopDebtors(marketId: string, currentUser: User) {
    if (currentUser.role === Role.OWNER) {
      const market = await this.prisma.market.findFirst({
        where: { id: marketId, ownerId: currentUser.id },
      });
      if (!market) throw new ForbiddenException("Bu marketga ruxsat yo'q");
    }

    return this.prisma.contract.findMany({
      where: {
        marketId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
        remainAmount: { gt: 0 },
      },
      select: {
        id: true,
        contractNumber: true,
        remainAmount: true,
        monthlyAmount: true,
        status: true,
        customer: {
          select: { id: true, fullName: true, phone: true },
        },
      },
      orderBy: { remainAmount: 'desc' },
      take: 10,
    });
  }

  async getOverdueInstallments(marketId: string, currentUser: User) {
    if (currentUser.role === Role.OWNER) {
      const market = await this.prisma.market.findFirst({
        where: { id: marketId, ownerId: currentUser.id },
      });
      if (!market) throw new ForbiddenException("Bu marketga ruxsat yo'q");
    }

    const now = new Date();

    return this.prisma.installment.findMany({
      where: {
        contract: { marketId },
        status: { in: ['OVERDUE', 'DUE'] },
        dueDate: { lt: now },
      },
      include: {
        contract: {
          select: {
            contractNumber: true,
            customer: { select: { fullName: true, phone: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
