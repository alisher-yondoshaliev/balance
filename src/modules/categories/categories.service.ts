import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private async checkMarketAccess(marketId: string, currentUser: User) {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });
    if (!market) throw new NotFoundException('Market topilmadi');
    if (currentUser.role === Role.SUPERADMIN) return market;
    if (currentUser.role === Role.OWNER && market.ownerId !== currentUser.id)
      throw new ForbiddenException("Bu marketga ruxsat yo'q");
    if (currentUser.role !== Role.OWNER && currentUser.marketId !== marketId)
      throw new ForbiddenException("Bu marketga ruxsat yo'q");
    return market;
  }

  async findAll(marketId: string, currentUser: User, search?: string) {
    await this.checkMarketAccess(marketId, currentUser);

    // Build where conditions
    const where: any = { marketId };
    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive' as const,
      };
    }

    return this.prisma.category.findMany({
      where,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateCategoryDto, currentUser: User) {
    await this.checkMarketAccess(dto.marketId, currentUser);

    const existing = await this.prisma.category.findUnique({
      where: { marketId_name: { marketId: dto.marketId, name: dto.name } },
    });
    if (existing)
      throw new ConflictException('Bu kategoriya allaqachon mavjud');

    return this.prisma.category.create({
      data: {
        marketId: dto.marketId,
        name: dto.name,
        imageUrl: dto.imageUrl,
      },
    });
  }

  async findOne(id: string, currentUser: User) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            basePrice: true,
            stock: true,
            imageUrl: true,
            status: true,
          },
        },
      },
    });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    await this.checkMarketAccess(category.marketId, currentUser);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, currentUser: User) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    await this.checkMarketAccess(category.marketId, currentUser);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: {
          marketId_name: { marketId: category.marketId, name: dto.name },
        },
      });
      if (existing) throw new ConflictException('Bu nom allaqachon mavjud');
    }

    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name, imageUrl: dto.imageUrl },
    });
  }

  async remove(id: string, currentUser: User) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    await this.checkMarketAccess(category.marketId, currentUser);

    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0)
      throw new ConflictException(
        "Bu kategoriyada mahsulotlar mavjud, avval ularni o'chiring",
      );

    await this.prisma.category.delete({ where: { id } });
    return { message: "Kategoriya o'chirildi" };
  }
}
