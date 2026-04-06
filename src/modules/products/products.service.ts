import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreatePricePlanDto } from './dto/create-price-plan.dto';
import { ProductStatus, Role, User } from '@prisma/client';

@Injectable()
export class ProductsService {
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

  async findAll(marketId: string, currentUser: User) {
    await this.checkMarketAccess(marketId, currentUser);
    return this.prisma.product.findMany({
      where: { marketId },
      include: {
        category: { select: { id: true, name: true } },
        pricePlans: true,
        _count: { select: { contractItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateProductDto, currentUser: User) {
    await this.checkMarketAccess(dto.marketId, currentUser);

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    if (category.marketId !== dto.marketId)
      throw new ForbiddenException('Kategoriya bu marketga tegishli emas');

    return this.prisma.product.create({
      data: {
        marketId: dto.marketId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        stock: dto.stock,
        basePrice: dto.basePrice,
        status: 'ACTIVE',
      },
      include: { category: true, pricePlans: true },
    });
  }

  async findOne(id: string, currentUser: User) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        pricePlans: { orderBy: { termMonths: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    await this.checkMarketAccess(product.marketId, currentUser);
    return product;
  }

  async update(id: string, dto: UpdateProductDto, currentUser: User) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    await this.checkMarketAccess(product.marketId, currentUser);

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        stock: dto.stock,
        basePrice: dto.basePrice,
      },
      include: { category: true, pricePlans: true },
    });
  }

  async updateStatus(id: string, status: ProductStatus, currentUser: User) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    await this.checkMarketAccess(product.marketId, currentUser);

    return this.prisma.product.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true },
    });
  }

  async remove(id: string, currentUser: User) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    await this.checkMarketAccess(product.marketId, currentUser);

    await this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return { message: 'Mahsulot arxivlandi' };
  }

  // ── Price Plans ────────────────────────────────────
  async createPricePlan(
    productId: string,
    dto: CreatePricePlanDto,
    currentUser: User,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    await this.checkMarketAccess(product.marketId, currentUser);

    const existing = await this.prisma.productPricePlan.findUnique({
      where: {
        productId_termMonths: { productId, termMonths: dto.termMonths },
      },
    });
    if (existing)
      throw new ConflictException(
        'Bu muddat uchun narx rejasi allaqachon mavjud',
      );

    return this.prisma.productPricePlan.create({
      data: {
        productId,
        termMonths: dto.termMonths,
        interestRate: dto.interestRate,
        totalPrice: dto.totalPrice,
        monthlyPrice: dto.monthlyPrice,
      },
    });
  }

  async updatePricePlan(
    productId: string,
    planId: string,
    dto: CreatePricePlanDto,
    currentUser: User,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    await this.checkMarketAccess(product.marketId, currentUser);

    const plan = await this.prisma.productPricePlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Narx rejasi topilmadi');

    return this.prisma.productPricePlan.update({
      where: { id: planId },
      data: {
        termMonths: dto.termMonths,
        interestRate: dto.interestRate,
        totalPrice: dto.totalPrice,
        monthlyPrice: dto.monthlyPrice,
      },
    });
  }

  async removePricePlan(productId: string, planId: string, currentUser: User) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    await this.checkMarketAccess(product.marketId, currentUser);

    await this.prisma.productPricePlan.delete({ where: { id: planId } });
    return { message: "Narx rejasi o'chirildi" };
  }
}
