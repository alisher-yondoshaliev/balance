import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import {
  Role,
  User,
  ContractStatus,
  InstallmentStatus,
  TransactionType,
} from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  // ── Market access tekshirish ───────────────────────
  private async checkMarketAccess(marketId: string, currentUser: User) {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) throw new NotFoundException('Market topilmadi');

    if (currentUser.role === Role.SUPERADMIN) return market;

    if (currentUser.role === Role.OWNER) {
      if (market.ownerId !== currentUser.id) {
        throw new ForbiddenException("Bu marketga ruxsat yo'q");
      }
      return market;
    }

    if (currentUser.marketId !== marketId) {
      throw new ForbiddenException("Bu marketga ruxsat yo'q");
    }

    return market;
  }

  // ── Shartnoma raqami generatsiya ───────────────────
  private async generateContractNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const count = await this.prisma.contract.count();
    const number = String(count + 1).padStart(5, '0');

    return `CNT-${year}${month}-${number}`;
  }

  // ── 1. Barcha shartnomalar ─────────────────────────
  async findAll(marketId: string, currentUser: User) {
    await this.checkMarketAccess(marketId, currentUser);

    return this.prisma.contract.findMany({
      where: { marketId },
      select: {
        id: true,
        contractNumber: true,
        totalAmount: true,
        paidAmount: true,
        remainAmount: true,
        monthlyAmount: true,
        downPayment: true,
        termMonths: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        staff: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: { items: true, installments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 2. Shartnoma yaratish ──────────────────────────
  async create(dto: CreateContractDto, currentUser: User) {
    await this.checkMarketAccess(dto.marketId, currentUser);

    // Mahsulot va narx rejalarini olish
    let totalAmount = 0;
    let monthlyAmount = 0;

    const itemsData = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product)
          throw new NotFoundException(`Mahsulot topilmadi: ${item.productId}`);

        const pricePlan = await this.prisma.productPricePlan.findUnique({
          where: { id: item.pricePlanId },
        });
        if (!pricePlan)
          throw new NotFoundException(
            `Narx rejasi topilmadi: ${item.pricePlanId}`,
          );

        if (pricePlan.termMonths !== dto.termMonths) {
          throw new BadRequestException(
            `Narx rejasi muddati (${pricePlan.termMonths} oy) shartnoma muddatiga (${dto.termMonths} oy) mos kelmaydi`,
          );
        }

        const itemTotal = Number(pricePlan.totalPrice) * item.quantity;
        const itemMonthly = Number(pricePlan.monthlyPrice) * item.quantity;

        totalAmount += itemTotal;
        monthlyAmount += itemMonthly;

        return {
          productId: item.productId,
          pricePlanId: item.pricePlanId,
          productName: product.name,
          quantity: item.quantity,
          basePrice: product.basePrice,
          interestRate: pricePlan.interestRate,
          totalPrice: pricePlan.totalPrice,
          monthlyPrice: pricePlan.monthlyPrice,
        };
      }),
    );

    const downPayment = dto.downPayment ?? 0;
    const remainAmount = totalAmount - downPayment;

    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + dto.termMonths);

    const contractNumber = await this.generateContractNumber();

    // Shartnoma va installmentlarni transaction ichida yaratish
    const contract = await this.prisma.$transaction(async (tx) => {
      // Shartnoma yaratish
      const newContract = await tx.contract.create({
        data: {
          contractNumber,
          marketId: dto.marketId,
          customerId: dto.customerId,
          staffId: currentUser.id,
          termMonths: dto.termMonths,
          downPayment,
          totalAmount,
          monthlyAmount,
          paidAmount: downPayment,
          remainAmount,
          startDate,
          endDate,
          status: ContractStatus.ACTIVE,
          note: dto.note,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
          customer: {
            select: { id: true, fullName: true, phone: true },
          },
        },
      });

      // Boshlang'ich to'lov transaction
      if (downPayment > 0) {
        await tx.transaction.create({
          data: {
            contractId: newContract.id,
            staffId: currentUser.id,
            type: 'DOWNPAYMENT',
            amount: downPayment,
            note: "Boshlang'ich to'lov",
          },
        });
      }

      // Installmentlar yaratish
      const installments = [];
      for (let i = 0; i < dto.termMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);

        installments.push({
          contractId: newContract.id,
          orderIndex: i + 1,
          dueDate,
          amount: monthlyAmount,
          status: i === 0 ? InstallmentStatus.DUE : InstallmentStatus.PENDING,
        });
      }

      await tx.installment.createMany({ data: installments });

      // Mahsulot stockini kamaytirish
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newContract;
    });

    return contract;
  }

  // ── 3. Bitta shartnoma ─────────────────────────────
  async findOne(id: string, currentUser: User) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            passportSeria: true,
          },
        },
        staff: {
          select: { id: true, fullName: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
        installments: {
          orderBy: { orderIndex: 'asc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
        signature: true,
      },
    });

    if (!contract) throw new NotFoundException('Shartnoma topilmadi');
    await this.checkMarketAccess(contract.marketId, currentUser);

    return contract;
  }

  // ── 4. Shartnoma tahrirlash ────────────────────────
  async update(id: string, dto: UpdateContractDto, currentUser: User) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Shartnoma topilmadi');

    await this.checkMarketAccess(contract.marketId, currentUser);

    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.ACTIVE
    ) {
      throw new BadRequestException('Bu shartnomani tahrirlash mumkin emas');
    }

    return this.prisma.contract.update({
      where: { id },
      data: { note: dto.note },
    });
  }

  // ── 5. Shartnoma o'chirish (faqat DRAFT) ──────────
  async remove(id: string, currentUser: User) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Shartnoma topilmadi');

    await this.checkMarketAccess(contract.marketId, currentUser);

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException(
        "Faqat DRAFT holatidagi shartnomani o'chirish mumkin",
      );
    }

    await this.prisma.contract.delete({ where: { id } });
    return { message: "Shartnoma o'chirildi" };
  }

  // ── 6. Status o'zgartirish ─────────────────────────
  async updateStatus(id: string, status: ContractStatus, currentUser: User) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Shartnoma topilmadi');

    await this.checkMarketAccess(contract.marketId, currentUser);

    return this.prisma.contract.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        contractNumber: true,
        status: true,
      },
    });
  }

  // ── 7. To'lov qabul qilish ─────────────────────────
  async pay(id: string, dto: PayInstallmentDto, currentUser: User) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { installments: true },
    });

    if (!contract) throw new NotFoundException('Shartnoma topilmadi');
    await this.checkMarketAccess(contract.marketId, currentUser);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException(
        "Faqat ACTIVE shartnomaga to'lov qabul qilinadi",
      );
    }

    const installment = await this.prisma.installment.findUnique({
      where: { id: dto.installmentId },
    });

    if (!installment) throw new NotFoundException('Installment topilmadi');
    if (installment.contractId !== id)
      throw new BadRequestException(
        'Bu installment ushbu shartnomaга tegishli emas',
      );
    if (installment.status === InstallmentStatus.PAID)
      throw new BadRequestException("Bu installment allaqachon to'langan");

    const newPaidAmount = Number(installment.paidAmount) + dto.amount;
    const installmentAmount = Number(installment.amount);

    let newStatus: InstallmentStatus = installment.status;
    if (newPaidAmount >= installmentAmount) {
      newStatus = InstallmentStatus.PAID;
    } else {
      newStatus = InstallmentStatus.PARTIAL;
    }

    await this.prisma.$transaction(async (tx) => {
      // Installment yangilash
      await tx.installment.update({
        where: { id: dto.installmentId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidAt: newStatus === InstallmentStatus.PAID ? new Date() : null,
        },
      });

      // Transaction yaratish
      await tx.transaction.create({
        data: {
          contractId: id,
          installmentId: dto.installmentId,
          staffId: currentUser.id,
          type: TransactionType.PAYMENT,
          amount: dto.amount,
          note: dto.note,
        },
      });

      // Shartnoma paidAmount va remainAmount yangilash
      await tx.contract.update({
        where: { id },
        data: {
          paidAmount: { increment: dto.amount },
          remainAmount: { decrement: dto.amount },
        },
      });

      // Barcha installmentlar to'langanmi?
      const unpaid = await tx.installment.count({
        where: {
          contractId: id,
          status: { not: 'PAID' },
        },
      });

      if (unpaid === 0) {
        await tx.contract.update({
          where: { id },
          data: { status: 'COMPLETED' },
        });
      }
    });

    return { message: "To'lov muvaffaqiyatli qabul qilindi" };
  }

  // ── 8. Installmentlar ro'yxati ─────────────────────
  async getInstallments(id: string, currentUser: User) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Shartnoma topilmadi');

    await this.checkMarketAccess(contract.marketId, currentUser);

    return this.prisma.installment.findMany({
      where: { contractId: id },
      orderBy: { orderIndex: 'asc' },
    });
  }
}
