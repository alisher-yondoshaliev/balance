import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { GetMarketUsersQueryDto } from './dto/get-market-users-query.dto';
import { MarketStatus, User } from '@prisma/client';

@Injectable()
export class MarketsService {
  constructor(private prisma: PrismaService) {}

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

  // ── 3. Do'konning xodimlarini ko'rish ────────────────
  async findMarketUsers(
    marketId: string,
    currentUser: User,
    query: GetMarketUsersQueryDto,
  ) {
    // Market mavjudmi?
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!market) {
      throw new NotFoundException("Do'kon topilmadi");
    }

    // Access control: OWNER faqat o'z marketining xodimlarini ko'radi
    if (
      (currentUser.role as any) !== 'SUPERADMIN' &&
      market.ownerId !== currentUser.id
    ) {
      throw new ForbiddenException(
        "Bu do'konning xodimlarini ko'rish huquqi yo'q",
      );
    }

    // Pagination
    let page = query.page ? parseInt(String(query.page), 10) : 1;
    let limit = query.limit ? parseInt(String(query.limit), 10) : 10;

    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    const skip = (page - 1) * limit;

    // Where clause - Filtering
    const where: any = { marketId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.role) {
      where.role = query.role;
    }

    // Search - ism, email, telefon
    if (query.search && query.search.trim() !== '') {
      where.OR = [
        {
          fullName: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Sorting
    const orderBy: any = {};
    if (query.sortBy === 'fullName') {
      orderBy.fullName = query.order || 'asc';
    } else {
      orderBy.createdAt = query.order || 'desc';
    }

    // Parallel queries
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          marketId: true,
          phone: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      marketName: market.name,
    };
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
