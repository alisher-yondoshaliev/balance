import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { MarketStatus, User } from '@prisma/client';

@Injectable()
export class MarketsService {
  constructor(private prisma: PrismaService) { }

  // ── 1. Do'kon yaratish ─────────────────────────────
  async create(dto: CreateMarketDto, userId: string) {
    const market = await this.prisma.market.create({
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        ownerId: userId,
        status: 'PENDING',
      },
    });

    return market;
  }

  // ── 2. O'z do'konlarini ko'rish ────────────────────
  async findMyMarkets(userId: string) {
    return await this.prisma.market.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            workers: true,
            products: true,
            customers: true,
            contracts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 3. Bitta do'kon ────────────────────────────────
  async findOne(id: string) {
    return await this.prisma.market.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  // ── 4. Do'kon tahrirlash ───────────────────────────
  async update(id: string, dto: UpdateMarketDto, userId: string) {
    const market = await this.prisma.market.findUnique({ where: { id } });

    if (!market) throw new NotFoundException("Do'kon topilmadi");

    if (market.ownerId !== userId) {
      throw new ForbiddenException("Bu do'konni tahrirlash huquqi yo'q");
    }

    return this.prisma.market.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
      },
    });
  }

  // ── 5. Do'kon o'chirish ───────────────────────────
  async remove(id: string, userId: string) {
    const market = await this.prisma.market.findUnique({ where: { id } });

    if (!market) throw new NotFoundException("Do'kon topilmadi");

    if (market.ownerId !== userId) {
      throw new ForbiddenException("Bu do'konni o'chirish huquqi yo'q");
    }

    await this.prisma.market.delete({ where: { id } });

    return { message: "Do'kon muvaffaqiyatli o'chirildi" };
  }
}
