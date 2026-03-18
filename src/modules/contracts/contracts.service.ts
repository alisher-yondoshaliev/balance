import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import {
  ContractStatus,
  InstallmentStatus,
  Prisma,
  Role,
  TransactionType,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivateContractDto } from './dto/activate-contract.dto';
import {
  ContractResponseDto,
  InstallmentResponseDto,
} from './dto/contract-response.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { ListContractsQueryDto } from './dto/list-contracts.query.dto';
import { PayContractDto } from './dto/pay-contract.dto';
import { IssueSignTokenDto } from './dto/issue-sign-token.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { ContractReportQueryDto } from './dto/contract-report.query.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 9 * * *')
  async handleDailyOverdueSync(): Promise<void> {
    await this.syncOverdueStatuses();
  }

  async createDraftContract(
    authUser: AuthenticatedUser,
    dto: CreateContractDto,
  ): Promise<ContractResponseDto> {
    const actor = await this.getActor(authUser.id);

    if (actor.role !== Role.ADMIN && actor.role !== Role.SELLER) {
      throw new ForbiddenException(
        'Faqat admin yoki seller contract yarata oladi',
      );
    }

    if (!actor.marketId || actor.marketId !== dto.marketId) {
      throw new ForbiddenException(
        'Faqat oz marketingiz uchun contract yarata olasiz',
      );
    }

    await this.assertCustomerInMarket(dto.customerId, dto.marketId);

    const downPayment = new Prisma.Decimal(dto.downPayment ?? 0);
    let totalAmount = new Prisma.Decimal(0);
    let monthlyAmount = new Prisma.Decimal(0);

    const itemInputs: Array<{
      productId: string;
      pricePlanId: string;
      productName: string;
      quantity: number;
      basePrice: Prisma.Decimal;
      interestRate: Prisma.Decimal;
      totalPrice: Prisma.Decimal;
      monthlyPrice: Prisma.Decimal;
    }> = [];

    for (const rawItem of dto.items) {
      const quantity = rawItem.quantity ?? 1;

      const pricePlan = await this.prisma.productPricePlan.findUnique({
        where: { id: rawItem.pricePlanId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              marketId: true,
              basePrice: true,
            },
          },
        },
      });

      if (!pricePlan) {
        throw new BadRequestException('Price plan topilmadi');
      }

      if (pricePlan.productId !== rawItem.productId) {
        throw new BadRequestException('Product va price plan mos emas');
      }

      if (pricePlan.product.marketId !== dto.marketId) {
        throw new BadRequestException(
          'Mahsulot tanlangan marketga tegishli emas',
        );
      }

      if (pricePlan.termMonths !== dto.termMonths) {
        throw new BadRequestException(
          'Tanlangan price plan termMonths contract termMonths bilan bir xil bolishi kerak',
        );
      }

      totalAmount = totalAmount.plus(
        pricePlan.totalPrice.mul(new Prisma.Decimal(quantity)),
      );
      monthlyAmount = monthlyAmount.plus(
        pricePlan.monthlyPrice.mul(new Prisma.Decimal(quantity)),
      );

      itemInputs.push({
        productId: pricePlan.productId,
        pricePlanId: pricePlan.id,
        productName: pricePlan.product.name,
        quantity,
        basePrice: pricePlan.product.basePrice,
        interestRate: pricePlan.interestRate,
        totalPrice: pricePlan.totalPrice,
        monthlyPrice: pricePlan.monthlyPrice,
      });
    }

    if (downPayment.gt(totalAmount)) {
      throw new BadRequestException(
        'Down payment total amountdan katta bolishi mumkin emas',
      );
    }

    const paidAmount = downPayment;
    const remainAmount = totalAmount.minus(paidAmount);

    const now = new Date();
    const startDate = now;
    const endDate = this.addMonths(startDate, dto.termMonths);

    const contractNumber = await this.generateContractNumber(dto.marketId);

    const created = await this.prisma.contract.create({
      data: {
        contractNumber,
        marketId: dto.marketId,
        customerId: dto.customerId,
        staffId: actor.id,
        termMonths: dto.termMonths,
        downPayment,
        totalAmount,
        monthlyAmount,
        paidAmount,
        remainAmount,
        startDate,
        endDate,
        note: dto.note?.trim() ?? null,
        items: {
          create: itemInputs,
        },
        transactions: downPayment.gt(0)
          ? {
              create: [
                {
                  staffId: actor.id,
                  type: TransactionType.DOWNPAYMENT,
                  amount: downPayment,
                  note: 'Initial down payment',
                },
              ],
            }
          : undefined,
      },
      include: this.contractInclude,
    });

    return this.toContractResponse(created);
  }

  async listContracts(
    authUser: AuthenticatedUser,
    query: ListContractsQueryDto,
  ): Promise<ContractResponseDto[]> {
    const actor = await this.getActor(authUser.id);

    const where: Prisma.ContractWhereInput = {
      status: query.status,
      customerId: query.customerId,
    };

    if (actor.role === Role.OWNER) {
      const ownerMarkets = await this.prisma.market.findMany({
        where: { ownerId: actor.id },
        select: { id: true },
      });

      const marketIds = ownerMarkets.map((item) => item.id);

      if (query.marketId) {
        if (!marketIds.includes(query.marketId)) {
          throw new ForbiddenException('Bu market sizga tegishli emas');
        }
        where.marketId = query.marketId;
      } else {
        where.marketId = { in: marketIds };
      }
    } else if ([Role.ADMIN, Role.MANAGER, Role.SELLER].includes(actor.role)) {
      if (!actor.marketId) {
        throw new ForbiddenException('Siz marketga biriktirilmagansiz');
      }

      where.marketId = actor.marketId;

      if (query.marketId && query.marketId !== actor.marketId) {
        throw new ForbiddenException(
          'Faqat oz marketingiz contractlarini korasiz',
        );
      }

      if (actor.role === Role.SELLER) {
        where.staffId = actor.id;
      }
    } else {
      throw new ForbiddenException('Bu amal uchun ruxsat yoq');
    }

    const contracts = await this.prisma.contract.findMany({
      where,
      include: this.contractInclude,
      orderBy: { createdAt: 'desc' },
    });

    return contracts.map((item) => this.toContractResponse(item));
  }

  async getContractById(
    authUser: AuthenticatedUser,
    contractId: string,
  ): Promise<ContractResponseDto> {
    const actor = await this.getActor(authUser.id);

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: this.contractInclude,
    });

    if (!contract) {
      throw new NotFoundException('Contract topilmadi');
    }

    await this.assertContractAccess(actor, contract.marketId, contract.staffId);

    return this.toContractResponse(contract);
  }

  async activateContract(
    authUser: AuthenticatedUser,
    contractId: string,
    dto: ActivateContractDto,
  ): Promise<ContractResponseDto> {
    const actor = await this.getActor(authUser.id);

    if (actor.role !== Role.ADMIN && actor.role !== Role.SELLER) {
      throw new ForbiddenException(
        'Faqat admin yoki seller contractni aktiv qila oladi',
      );
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        installments: {
          select: { id: true },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract topilmadi');
    }

    if (!actor.marketId || actor.marketId !== contract.marketId) {
      throw new ForbiddenException('Bu contractni boshqarish uchun huquq yoq');
    }

    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.PENDING
    ) {
      throw new ConflictException(
        'Faqat DRAFT yoki PENDING contract aktiv qilinadi',
      );
    }

    if (contract.installments.length > 0) {
      throw new ConflictException(
        'Bu contract uchun installmentlar allaqachon yaratilgan',
      );
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = this.addMonths(startDate, contract.termMonths);

    if (contract.remainAmount.lte(0)) {
      const completed = await this.prisma.contract.update({
        where: { id: contract.id },
        data: {
          startDate,
          endDate,
          status: ContractStatus.COMPLETED,
        },
        include: this.contractInclude,
      });

      return this.toContractResponse(completed);
    }

    const installments = Array.from(
      { length: contract.termMonths },
      (_, index) => ({
        contractId: contract.id,
        orderIndex: index + 1,
        dueDate: this.addMonths(startDate, index + 1),
        amount: contract.monthlyAmount,
        status: InstallmentStatus.PENDING,
      }),
    );

    await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id: contract.id },
        data: {
          startDate,
          endDate,
          status: ContractStatus.ACTIVE,
        },
      }),
      this.prisma.installment.createMany({
        data: installments,
      }),
    ]);

    const activated = await this.prisma.contract.findUnique({
      where: { id: contract.id },
      include: this.contractInclude,
    });

    if (!activated) {
      throw new NotFoundException('Contract topilmadi');
    }

    return this.toContractResponse(activated);
  }

  async payContract(
    authUser: AuthenticatedUser,
    contractId: string,
    dto: PayContractDto,
  ): Promise<ContractResponseDto> {
    const actor = await this.getActor(authUser.id);

    if (actor.role !== Role.ADMIN && actor.role !== Role.SELLER) {
      throw new ForbiddenException(
        'Faqat admin yoki seller tolov qabul qila oladi',
      );
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        installments: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract topilmadi');
    }

    if (!actor.marketId || actor.marketId !== contract.marketId) {
      throw new ForbiddenException(
        'Bu contractga tolov qabul qilish huquqi yoq',
      );
    }

    if (
      contract.status !== ContractStatus.ACTIVE &&
      contract.status !== ContractStatus.OVERDUE
    ) {
      throw new ConflictException(
        'Faqat ACTIVE yoki OVERDUE contractga tolov qabul qilinadi',
      );
    }

    const amount = new Prisma.Decimal(dto.amount);

    if (amount.lte(0)) {
      throw new BadRequestException('Tolov miqdori 0 dan katta bolishi kerak');
    }

    if (amount.gt(contract.remainAmount)) {
      throw new BadRequestException(
        'Tolov miqdori qolgan summadan katta bolishi mumkin emas',
      );
    }

    let leftAmount = amount;
    const now = new Date();

    const operations: Array<Prisma.PrismaPromise<unknown>> = [];

    for (const installment of contract.installments) {
      if (leftAmount.lte(0)) {
        break;
      }

      if (installment.status === InstallmentStatus.PAID) {
        continue;
      }

      const dueLeft = installment.amount.minus(installment.paidAmount);

      if (dueLeft.lte(0)) {
        continue;
      }

      const paymentChunk = leftAmount.gte(dueLeft) ? dueLeft : leftAmount;
      const nextPaidAmount = installment.paidAmount.plus(paymentChunk);
      const isFullPaid = nextPaidAmount.gte(installment.amount);

      operations.push(
        this.prisma.installment.update({
          where: { id: installment.id },
          data: {
            paidAmount: nextPaidAmount,
            status: isFullPaid
              ? InstallmentStatus.PAID
              : InstallmentStatus.PARTIAL,
            paidAt: isFullPaid ? now : null,
          },
        }),
      );

      operations.push(
        this.prisma.transaction.create({
          data: {
            contractId: contract.id,
            installmentId: installment.id,
            staffId: actor.id,
            type: TransactionType.PAYMENT,
            amount: paymentChunk,
            note: dto.note?.trim() ?? null,
          },
        }),
      );

      leftAmount = leftAmount.minus(paymentChunk);
    }

    if (leftAmount.gt(0)) {
      throw new ConflictException(
        'Tolovni taqsimlash uchun installmentlar yetarli emas',
      );
    }

    const nextPaid = contract.paidAmount.plus(amount);
    const nextRemain = contract.remainAmount.minus(amount);

    operations.push(
      this.prisma.contract.update({
        where: { id: contract.id },
        data: {
          paidAmount: nextPaid,
          remainAmount: nextRemain,
          status: nextRemain.lte(0)
            ? ContractStatus.COMPLETED
            : ContractStatus.ACTIVE,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    const updated = await this.prisma.contract.findUnique({
      where: { id: contract.id },
      include: this.contractInclude,
    });

    if (!updated) {
      throw new NotFoundException('Contract topilmadi');
    }

    return this.toContractResponse(updated);
  }

  async issueSignToken(
    authUser: AuthenticatedUser,
    contractId: string,
    dto: IssueSignTokenDto,
  ): Promise<{ contractId: string; signToken: string; expiresAt: Date }> {
    const actor = await this.getActor(authUser.id);

    if (actor.role !== Role.ADMIN && actor.role !== Role.SELLER) {
      throw new ForbiddenException(
        'Faqat admin yoki seller sign token yarata oladi',
      );
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        marketId: true,
        status: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract topilmadi');
    }

    if (!actor.marketId || actor.marketId !== contract.marketId) {
      throw new ForbiddenException(
        'Bu contract uchun token yaratish huquqi yoq',
      );
    }

    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.PENDING
    ) {
      throw new ConflictException(
        'Faqat DRAFT/PENDING contractga sign token beriladi',
      );
    }

    const expiresInHours = dto.expiresInHours ?? 24;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const signToken = randomUUID().replace(/-/g, '');

    await this.prisma.contract.update({
      where: { id: contract.id },
      data: {
        signToken,
        signTokenExpiry: expiresAt,
        status: ContractStatus.PENDING,
      },
    });

    return {
      contractId: contract.id,
      signToken,
      expiresAt,
    };
  }

  async getContractBySignToken(
    signToken: string,
  ): Promise<ContractResponseDto> {
    const contract = await this.prisma.contract.findFirst({
      where: { signToken },
      include: this.contractInclude,
    });

    if (!contract) {
      throw new NotFoundException('Sign token topilmadi');
    }

    if (!contract.signTokenExpiry || contract.signTokenExpiry < new Date()) {
      throw new ForbiddenException('Sign token muddati tugagan');
    }

    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.PENDING
    ) {
      throw new ConflictException('Bu contractni endi imzolab bolmaydi');
    }

    return this.toContractResponse(contract);
  }

  async signContractByToken(
    signToken: string,
    dto: SignContractDto,
  ): Promise<ContractResponseDto> {
    const contract = await this.prisma.contract.findFirst({
      where: { signToken },
      include: {
        installments: { select: { id: true } },
      },
    });

    if (!contract) {
      throw new NotFoundException('Sign token topilmadi');
    }

    if (!contract.signTokenExpiry || contract.signTokenExpiry < new Date()) {
      throw new ForbiddenException('Sign token muddati tugagan');
    }

    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.PENDING
    ) {
      throw new ConflictException('Bu contractni endi imzolab bolmaydi');
    }

    const startDate = new Date();
    const endDate = this.addMonths(startDate, contract.termMonths);

    const operations: Array<Prisma.PrismaPromise<unknown>> = [];

    operations.push(
      this.prisma.signature.upsert({
        where: { contractId: contract.id },
        create: {
          contractId: contract.id,
          signatureUrl: dto.signatureUrl,
          userAgent: dto.userAgent,
          ipAddress: dto.ipAddress,
          signedAt: new Date(),
        },
        update: {
          signatureUrl: dto.signatureUrl,
          userAgent: dto.userAgent,
          ipAddress: dto.ipAddress,
          signedAt: new Date(),
        },
      }),
    );

    const shouldCreateInstallments = contract.installments.length === 0;

    if (shouldCreateInstallments && contract.remainAmount.gt(0)) {
      operations.push(
        this.prisma.installment.createMany({
          data: Array.from({ length: contract.termMonths }, (_, index) => ({
            contractId: contract.id,
            orderIndex: index + 1,
            dueDate: this.addMonths(startDate, index + 1),
            amount: contract.monthlyAmount,
            status: InstallmentStatus.PENDING,
          })),
        }),
      );
    }

    operations.push(
      this.prisma.contract.update({
        where: { id: contract.id },
        data: {
          startDate,
          endDate,
          signToken: null,
          signTokenExpiry: null,
          note: dto.note
            ? `${contract.note ?? ''}\n${dto.note}`.trim()
            : contract.note,
          status: contract.remainAmount.lte(0)
            ? ContractStatus.COMPLETED
            : ContractStatus.ACTIVE,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    const updated = await this.prisma.contract.findUnique({
      where: { id: contract.id },
      include: this.contractInclude,
    });

    if (!updated) {
      throw new NotFoundException('Contract topilmadi');
    }

    return this.toContractResponse(updated);
  }

  async syncOverdueStatuses(): Promise<{
    updatedInstallments: number;
    updatedContracts: number;
  }> {
    const now = new Date();

    const overdueInstallments = await this.prisma.installment.findMany({
      where: {
        dueDate: { lt: now },
        status: {
          in: [
            InstallmentStatus.PENDING,
            InstallmentStatus.DUE,
            InstallmentStatus.PARTIAL,
          ],
        },
      },
      select: {
        id: true,
        contractId: true,
      },
    });

    if (overdueInstallments.length === 0) {
      return {
        updatedInstallments: 0,
        updatedContracts: 0,
      };
    }

    const installmentIds = overdueInstallments.map((item) => item.id);
    const contractIds = [
      ...new Set(overdueInstallments.map((item) => item.contractId)),
    ];

    const [installmentResult, contractResult] = await this.prisma.$transaction([
      this.prisma.installment.updateMany({
        where: {
          id: { in: installmentIds },
        },
        data: {
          status: InstallmentStatus.OVERDUE,
        },
      }),
      this.prisma.contract.updateMany({
        where: {
          id: { in: contractIds },
          status: { in: [ContractStatus.ACTIVE, ContractStatus.PENDING] },
          remainAmount: { gt: 0 },
        },
        data: {
          status: ContractStatus.OVERDUE,
        },
      }),
    ]);

    return {
      updatedInstallments: installmentResult.count,
      updatedContracts: contractResult.count,
    };
  }

  async getPaymentReport(
    authUser: AuthenticatedUser,
    query: ContractReportQueryDto,
  ): Promise<PaymentReportResponse> {
    const actor = await this.getActor(authUser.id);

    const where: Prisma.TransactionWhereInput = {
      createdAt: this.resolveDateRange(query.from, query.to),
      staffId: query.staffId,
    };

    if (actor.role === Role.OWNER) {
      const ownerMarkets = await this.prisma.market.findMany({
        where: { ownerId: actor.id },
        select: { id: true },
      });
      const marketIds = ownerMarkets.map((item) => item.id);

      if (query.marketId) {
        if (!marketIds.includes(query.marketId)) {
          throw new ForbiddenException('Bu market sizga tegishli emas');
        }

        where.contract = { marketId: query.marketId };
      } else {
        where.contract = { marketId: { in: marketIds } };
      }
    } else if ([Role.ADMIN, Role.MANAGER, Role.SELLER].includes(actor.role)) {
      if (!actor.marketId) {
        throw new ForbiddenException('Siz marketga biriktirilmagansiz');
      }

      if (query.marketId && query.marketId !== actor.marketId) {
        throw new ForbiddenException(
          'Faqat oz marketingiz hisobotlarini korasiz',
        );
      }

      where.contract = { marketId: actor.marketId };

      if (actor.role === Role.SELLER) {
        where.staffId = actor.id;
      }
    } else {
      throw new ForbiddenException('Bu amal uchun ruxsat yoq');
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        id: true,
        type: true,
        amount: true,
        staffId: true,
        createdAt: true,
        contract: {
          select: {
            marketId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = transactions.reduce(
      (acc, item) => acc.plus(item.amount),
      new Prisma.Decimal(0),
    );

    const groupedByType = Object.values(TransactionType).reduce(
      (acc, type) => {
        const value = transactions
          .filter((item) => item.type === type)
          .reduce((sum, item) => sum.plus(item.amount), new Prisma.Decimal(0));

        acc[type] = value.toString();
        return acc;
      },
      {} as Record<TransactionType, string>,
    );

    const byDayMap = new Map<string, Prisma.Decimal>();

    for (const transaction of transactions) {
      const dayKey = transaction.createdAt.toISOString().slice(0, 10);
      const current = byDayMap.get(dayKey) ?? new Prisma.Decimal(0);
      byDayMap.set(dayKey, current.plus(transaction.amount));
    }

    const byDay = [...byDayMap.entries()]
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, amount]) => ({
        date,
        amount: amount.toString(),
      }));

    return {
      totalTransactions: transactions.length,
      totalAmount: totalAmount.toString(),
      groupedByType,
      byDay,
    };
  }

  private readonly contractInclude = {
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
        role: true,
      },
    },
    items: {
      orderBy: { id: 'asc' as const },
    },
    installments: {
      orderBy: { orderIndex: 'asc' as const },
    },
    transactions: {
      orderBy: { createdAt: 'desc' as const },
    },
  };

  private async getActor(userId: string): Promise<ActorUser> {
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        marketId: true,
      },
    });

    if (!actor) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    return actor;
  }

  private async assertContractAccess(
    actor: ActorUser,
    marketId: string,
    staffId: string,
  ): Promise<void> {
    if (actor.role === Role.OWNER) {
      const ownerMarket = await this.prisma.market.findFirst({
        where: {
          id: marketId,
          ownerId: actor.id,
        },
        select: { id: true },
      });

      if (!ownerMarket) {
        throw new ForbiddenException(
          'Bu contract sizga tegishli marketda emas',
        );
      }

      return;
    }

    if (actor.role === Role.ADMIN || actor.role === Role.MANAGER) {
      if (!actor.marketId || actor.marketId !== marketId) {
        throw new ForbiddenException(
          'Faqat oz marketingiz contractlarini korasiz',
        );
      }

      return;
    }

    if (actor.role === Role.SELLER) {
      if (!actor.marketId || actor.marketId !== marketId) {
        throw new ForbiddenException(
          'Faqat oz marketingiz contractlarini korasiz',
        );
      }

      if (staffId !== actor.id) {
        throw new ForbiddenException(
          'Seller faqat ozi tuzgan contractlarni koradi',
        );
      }

      return;
    }

    throw new ForbiddenException('Bu amal uchun ruxsat yoq');
  }

  private async assertCustomerInMarket(
    customerId: string,
    marketId: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        marketId,
      },
      select: { id: true },
    });

    if (!customer) {
      throw new BadRequestException('Mijoz tanlangan marketga tegishli emas');
    }
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setUTCMonth(result.getUTCMonth() + months);
    return result;
  }

  private async generateContractNumber(marketId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    const prefix = `NAS-${year}-`;

    const lastContract = await this.prisma.contract.findFirst({
      where: {
        marketId,
        contractNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        contractNumber: true,
      },
    });

    const lastSequence =
      Number(lastContract?.contractNumber.split('-').at(-1)) || 0;
    const nextSequence = String(lastSequence + 1).padStart(5, '0');

    return `${prefix}${nextSequence}`;
  }

  private toContractResponse(
    contract: ContractWithRelations,
  ): ContractResponseDto {
    return {
      id: contract.id,
      contractNumber: contract.contractNumber,
      marketId: contract.marketId,
      customerId: contract.customerId,
      staffId: contract.staffId,
      termMonths: contract.termMonths,
      downPayment: contract.downPayment.toString(),
      totalAmount: contract.totalAmount.toString(),
      monthlyAmount: contract.monthlyAmount.toString(),
      paidAmount: contract.paidAmount.toString(),
      remainAmount: contract.remainAmount.toString(),
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      note: contract.note,
      signToken: contract.signToken,
      signTokenExpiry: contract.signTokenExpiry,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      customer: {
        id: contract.customer.id,
        fullName: contract.customer.fullName,
        phone: contract.customer.phone,
      },
      staff: {
        id: contract.staff.id,
        fullName: contract.staff.fullName,
        role: contract.staff.role,
      },
      items: contract.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        pricePlanId: item.pricePlanId,
        productName: item.productName,
        quantity: item.quantity,
        basePrice: item.basePrice.toString(),
        interestRate: item.interestRate.toString(),
        totalPrice: item.totalPrice.toString(),
        monthlyPrice: item.monthlyPrice.toString(),
      })),
      installments: contract.installments.map((item) =>
        this.toInstallmentResponse(item),
      ),
      transactions: contract.transactions.map((item) => ({
        id: item.id,
        installmentId: item.installmentId,
        type: item.type,
        amount: item.amount.toString(),
        note: item.note,
        createdAt: item.createdAt,
      })),
    };
  }

  private toInstallmentResponse(
    installment: ContractWithRelations['installments'][number],
  ): InstallmentResponseDto {
    return {
      id: installment.id,
      orderIndex: installment.orderIndex,
      dueDate: installment.dueDate,
      amount: installment.amount.toString(),
      paidAmount: installment.paidAmount.toString(),
      status: installment.status,
      paidAt: installment.paidAt,
    };
  }

  private resolveDateRange(
    from?: string,
    to?: string,
  ): Prisma.DateTimeFilter | undefined {
    if (!from && !to) {
      return undefined;
    }

    const filter: Prisma.DateTimeFilter = {};

    if (from) {
      filter.gte = new Date(from);
    }

    if (to) {
      filter.lte = new Date(to);
    }

    return filter;
  }
}

type ActorUser = {
  id: string;
  role: Role;
  marketId: string | null;
};

type ContractWithRelations = Prisma.ContractGetPayload<{
  include: {
    customer: {
      select: {
        id: true;
        fullName: true;
        phone: true;
      };
    };
    staff: {
      select: {
        id: true;
        fullName: true;
        role: true;
      };
    };
    items: true;
    installments: true;
    transactions: true;
  };
}>;

type PaymentReportResponse = {
  totalTransactions: number;
  totalAmount: string;
  groupedByType: Record<TransactionType, string>;
  byDay: Array<{ date: string; amount: string }>;
};
