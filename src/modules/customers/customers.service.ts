import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // ── Market tekshirish helper ────────────────────────
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

    // ADMIN, MANAGER, SELLER — o'z marketida ishlaydi
    if (currentUser.marketId !== marketId) {
      throw new ForbiddenException("Bu marketga ruxsat yo'q");
    }

    return market;
  }

  // ── 1. Barcha mijozlar ─────────────────────────────
  async findAll(marketId: string, currentUser: User) {
    await this.checkMarketAccess(marketId, currentUser);

    return this.prisma.customer.findMany({
      where: { marketId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        address: true,
        passportSeria: true,
        birthDate: true,
        note: true,
        createdAt: true,
        _count: {
          select: { contracts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 2. Mijoz qo'shish ──────────────────────────────
  async create(dto: CreateCustomerDto, currentUser: User) {
    await this.checkMarketAccess(dto.marketId, currentUser);

    // Telefon takrorlanmasin
    const existing = await this.prisma.customer.findUnique({
      where: {
        marketId_phone: {
          marketId: dto.marketId,
          phone: dto.phone,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Bu telefon raqam allaqachon mavjud');
    }

    return this.prisma.customer.create({
      data: {
        marketId: dto.marketId,
        fullName: dto.fullName,
        phone: dto.phone,
        address: dto.address,
        passportSeria: dto.passportSeria,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        note: dto.note,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        address: true,
        passportSeria: true,
        birthDate: true,
        note: true,
        marketId: true,
        createdAt: true,
      },
    });
  }

  // ── 3. Bitta mijoz ─────────────────────────────────
  async findOne(id: string, currentUser: User) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        address: true,
        passportSeria: true,
        birthDate: true,
        note: true,
        marketId: true,
        createdAt: true,
        updatedAt: true,
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            fileUrl: true,
            createdAt: true,
          },
        },
        _count: {
          select: { contracts: true },
        },
      },
    });

    if (!customer) throw new NotFoundException('Mijoz topilmadi');

    await this.checkMarketAccess(customer.marketId, currentUser);

    return customer;
  }

  // ── 4. Mijoz tahrirlash ────────────────────────────
  async update(id: string, dto: UpdateCustomerDto, currentUser: User) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Mijoz topilmadi');

    await this.checkMarketAccess(customer.marketId, currentUser);

    // Telefon o'zgarsa takrorlanmasin
    if (dto.phone && dto.phone !== customer.phone) {
      const existing = await this.prisma.customer.findUnique({
        where: {
          marketId_phone: {
            marketId: customer.marketId,
            phone: dto.phone,
          },
        },
      });
      if (existing)
        throw new ConflictException('Bu telefon raqam allaqachon mavjud');
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        address: dto.address,
        passportSeria: dto.passportSeria,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        note: dto.note,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        address: true,
        passportSeria: true,
        birthDate: true,
        note: true,
        updatedAt: true,
      },
    });
  }

  // ── 5. Mijoz o'chirish ─────────────────────────────
  async remove(id: string, currentUser: User) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Mijoz topilmadi');

    await this.checkMarketAccess(customer.marketId, currentUser);

    // Faqat OWNER va SUPERADMIN o'chira oladi
    if (
      currentUser.role !== Role.OWNER &&
      currentUser.role !== Role.SUPERADMIN
    ) {
      throw new ForbiddenException("O'chirish huquqi yo'q");
    }

    await this.prisma.customer.delete({ where: { id } });
    return { message: "Mijoz muvaffaqiyatli o'chirildi" };
  }

  // ── 6. Mijoz shartnomalar ──────────────────────────
  async findContracts(id: string, currentUser: User) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Mijoz topilmadi');

    await this.checkMarketAccess(customer.marketId, currentUser);

    return this.prisma.contract.findMany({
      where: { customerId: id },
      select: {
        id: true,
        contractNumber: true,
        totalAmount: true,
        paidAmount: true,
        remainAmount: true,
        monthlyAmount: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
