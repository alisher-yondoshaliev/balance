import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Customer, Document, Prisma, Role, User } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CustomerPaymentHistoryResponseDto } from './dto/customer-payment-history-response.dto';
import { CustomerPaymentHistoryQueryDto } from './dto/customer-payment-history.query.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { ListCustomersQueryDto } from './dto/list-customers.query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(
    authUser: AuthenticatedUser,
    dto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const actor = await this.getActor(authUser.id);

    if (
      actor.role !== Role.OWNER &&
      actor.role !== Role.ADMIN &&
      actor.role !== Role.SELLER
    ) {
      throw new ForbiddenException('Bu amal uchun ruxsat yoq');
    }

    const marketId = await this.resolveTargetMarket(actor, dto.marketId);

    const existing = await this.prisma.customer.findFirst({
      where: {
        marketId,
        phone: dto.phone.replace(/\s+/g, ''),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Bu marketda ushbu telefonli mijoz mavjud');
    }

    const created = await this.prisma.customer.create({
      data: {
        marketId,
        fullName: dto.fullName.trim(),
        phone: dto.phone.replace(/\s+/g, ''),
        address: dto.address?.trim() ?? null,
        passportSeria: dto.passportSeria?.trim() ?? null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        note: dto.note?.trim() ?? null,
      },
    });

    return this.toCustomerResponse(created);
  }

  async listCustomers(
    authUser: AuthenticatedUser,
    query: ListCustomersQueryDto,
  ): Promise<CustomerResponseDto[]> {
    const actor = await this.getActor(authUser.id);
    const allowedMarketIds = await this.resolveReadableMarketIds(
      actor,
      query.marketId,
    );

    if (allowedMarketIds.length === 0) {
      return [];
    }

    const customers = await this.prisma.customer.findMany({
      where: {
        marketId: { in: allowedMarketIds },
        phone: query.phone ? query.phone.replace(/\s+/g, '') : undefined,
        fullName: query.fullName
          ? {
              contains: query.fullName.trim(),
              mode: 'insensitive',
            }
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((item) => this.toCustomerResponse(item));
  }

  async getCustomerById(
    authUser: AuthenticatedUser,
    customerId: string,
  ): Promise<CustomerResponseDto> {
    const actor = await this.getActor(authUser.id);
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    await this.assertCustomerAccess(actor, customer.marketId);

    return this.toCustomerResponse(customer);
  }

  async updateCustomer(
    authUser: AuthenticatedUser,
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const actor = await this.getActor(authUser.id);

    if (actor.role !== Role.OWNER && actor.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Faqat owner yoki admin mijozni tahrirlay oladi',
      );
    }

    const target = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!target) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    await this.assertCustomerAccess(actor, target.marketId);

    if (dto.phone) {
      const newPhone = dto.phone.replace(/\s+/g, '');
      const duplicate = await this.prisma.customer.findFirst({
        where: {
          marketId: target.marketId,
          phone: newPhone,
          NOT: { id: target.id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException('Bu marketda ushbu telefonli mijoz mavjud');
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id: target.id },
      data: {
        fullName: dto.fullName?.trim(),
        phone: dto.phone?.replace(/\s+/g, ''),
        address: dto.address?.trim(),
        passportSeria: dto.passportSeria?.trim(),
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        note: dto.note?.trim(),
      },
    });

    return this.toCustomerResponse(updated);
  }

  async createDocument(
    authUser: AuthenticatedUser,
    customerId: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const actor = await this.getActor(authUser.id);

    if (
      actor.role !== Role.OWNER &&
      actor.role !== Role.ADMIN &&
      actor.role !== Role.SELLER
    ) {
      throw new ForbiddenException('Bu amal uchun ruxsat yoq');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    await this.assertCustomerAccess(actor, customer.marketId);

    const document = await this.prisma.document.create({
      data: {
        customerId: customer.id,
        type: dto.type,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize ?? null,
        mimeType: dto.mimeType ?? null,
        uploadedById: actor.id,
      },
    });

    return this.toDocumentResponse(document);
  }

  async listDocuments(
    authUser: AuthenticatedUser,
    customerId: string,
  ): Promise<DocumentResponseDto[]> {
    const actor = await this.getActor(authUser.id);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        marketId: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    await this.assertCustomerAccess(actor, customer.marketId);

    const documents = await this.prisma.document.findMany({
      where: {
        customerId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((item) => this.toDocumentResponse(item));
  }

  async getCustomerPaymentHistory(
    authUser: AuthenticatedUser,
    customerId: string,
    query: CustomerPaymentHistoryQueryDto,
  ): Promise<CustomerPaymentHistoryResponseDto> {
    const actor = await this.getActor(authUser.id);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        marketId: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    await this.assertCustomerAccess(actor, customer.marketId);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        contract: {
          customerId: customer.id,
          marketId: customer.marketId,
        },
        createdAt: this.resolveDateRange(query.from, query.to),
      },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            status: true,
          },
        },
        installment: {
          select: {
            id: true,
            orderIndex: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalAmount = transactions.reduce(
      (acc, item) => acc.plus(item.amount),
      new Prisma.Decimal(0),
    );

    return {
      customerId: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      totalTransactions: transactions.length,
      totalAmount: totalAmount.toString(),
      items: transactions.map((item) => ({
        transactionId: item.id,
        type: item.type,
        amount: item.amount.toString(),
        note: item.note,
        createdAt: item.createdAt,
        contractId: item.contract.id,
        contractNumber: item.contract.contractNumber,
        contractStatus: item.contract.status,
        installmentId: item.installment?.id ?? null,
        installmentOrderIndex: item.installment?.orderIndex ?? null,
        installmentStatus: item.installment?.status ?? null,
      })),
    };
  }

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

  private async resolveTargetMarket(
    actor: ActorUser,
    dtoMarketId?: string,
  ): Promise<string> {
    if (actor.role === Role.OWNER) {
      if (!dtoMarketId) {
        throw new BadRequestException(
          'Owner customer yaratishda marketId yuborishi shart',
        );
      }

      await this.assertOwnerMarket(actor.id, dtoMarketId);
      return dtoMarketId;
    }

    if (actor.role !== Role.ADMIN && actor.role !== Role.SELLER) {
      throw new ForbiddenException('Bu amal uchun ruxsat yoq');
    }

    if (!actor.marketId) {
      throw new ForbiddenException('Siz marketga biriktirilmagansiz');
    }

    if (dtoMarketId && dtoMarketId !== actor.marketId) {
      throw new ForbiddenException(
        'Faqat oz marketingiz uchun customer yaratishingiz mumkin',
      );
    }

    return actor.marketId;
  }

  private async resolveReadableMarketIds(
    actor: ActorUser,
    queryMarketId?: string,
  ): Promise<string[]> {
    if (actor.role === Role.OWNER) {
      const ownerMarkets = await this.prisma.market.findMany({
        where: { ownerId: actor.id },
        select: { id: true },
      });

      const marketIds = ownerMarkets.map((item) => item.id);

      if (queryMarketId) {
        if (!marketIds.includes(queryMarketId)) {
          throw new ForbiddenException('Bu market sizga tegishli emas');
        }

        return [queryMarketId];
      }

      return marketIds;
    }

    if (
      actor.role !== Role.ADMIN &&
      actor.role !== Role.MANAGER &&
      actor.role !== Role.SELLER
    ) {
      throw new ForbiddenException('Bu amal uchun ruxsat yoq');
    }

    if (!actor.marketId) {
      return [];
    }

    if (queryMarketId && queryMarketId !== actor.marketId) {
      throw new ForbiddenException(
        'Faqat oz marketingiz customerlarini korasiz',
      );
    }

    return [actor.marketId];
  }

  private async assertOwnerMarket(
    ownerId: string,
    marketId: string,
  ): Promise<void> {
    const market = await this.prisma.market.findFirst({
      where: {
        id: marketId,
        ownerId,
      },
      select: { id: true },
    });

    if (!market) {
      throw new ForbiddenException('Bu market sizga tegishli emas');
    }
  }

  private async assertCustomerAccess(
    actor: ActorUser,
    marketId: string,
  ): Promise<void> {
    if (actor.role === Role.OWNER) {
      await this.assertOwnerMarket(actor.id, marketId);
      return;
    }

    if (
      actor.role === Role.ADMIN ||
      actor.role === Role.MANAGER ||
      actor.role === Role.SELLER
    ) {
      if (!actor.marketId || actor.marketId !== marketId) {
        throw new ForbiddenException(
          'Faqat oz marketingiz customerlarini boshqarasiz',
        );
      }

      return;
    }

    throw new ForbiddenException('Bu amal uchun ruxsat yoq');
  }

  private toCustomerResponse(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      marketId: customer.marketId,
      fullName: customer.fullName,
      phone: customer.phone,
      address: customer.address,
      passportSeria: customer.passportSeria,
      birthDate: customer.birthDate,
      note: customer.note,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  private toDocumentResponse(document: Document): DocumentResponseDto {
    return {
      id: document.id,
      customerId: document.customerId,
      type: document.type,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedById: document.uploadedById,
      createdAt: document.createdAt,
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

type ActorUser = Pick<User, 'id' | 'role' | 'marketId'>;
