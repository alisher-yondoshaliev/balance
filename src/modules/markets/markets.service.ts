import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Category,
  Market,
  Prisma,
  Product,
  ProductStatus,
  Role,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateMarketDto } from './dto/create-market.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import { MarketResponseDto } from './dto/market-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class MarketsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMarket(
    authUser: AuthenticatedUser,
    dto: CreateMarketDto,
  ): Promise<MarketResponseDto> {
    const actor = await this.getActor(authUser.id);

    if (actor.role !== Role.OWNER) {
      throw new ForbiddenException('Faqat owner market yarata oladi');
    }

    const market = await this.prisma.market.create({
      data: {
        ownerId: actor.id,
        name: dto.name.trim(),
        address: dto.address?.trim() ?? null,
        phone: dto.phone?.replace(/\s+/g, '') ?? null,
      },
    });

    return this.toMarketResponse(market);
  }

  async listMarkets(authUser: AuthenticatedUser): Promise<MarketResponseDto[]> {
    const actor = await this.getActor(authUser.id);

    if (actor.role === Role.OWNER) {
      const markets = await this.prisma.market.findMany({
        where: { ownerId: actor.id },
        orderBy: { createdAt: 'desc' },
      });

      return markets.map((market) => this.toMarketResponse(market));
    }

    if (actor.role === Role.ADMIN) {
      if (!actor.marketId) {
        return [];
      }

      const market = await this.prisma.market.findUnique({
        where: { id: actor.marketId },
      });

      return market ? [this.toMarketResponse(market)] : [];
    }

    throw new ForbiddenException('Bu amal uchun ruxsat yoq');
  }

  async getMarketById(
    authUser: AuthenticatedUser,
    marketId: string,
  ): Promise<MarketResponseDto> {
    const actor = await this.getActor(authUser.id);
    const market = await this.assertMarketAccess(actor, marketId);

    return this.toMarketResponse(market);
  }

  async updateMarket(
    authUser: AuthenticatedUser,
    marketId: string,
    dto: UpdateMarketDto,
  ): Promise<MarketResponseDto> {
    const actor = await this.getActor(authUser.id);
    await this.assertMarketAccess(actor, marketId);

    if (actor.role === Role.ADMIN && dto.status !== undefined) {
      throw new ForbiddenException('Admin market statusini ozgartira olmaydi');
    }

    const updated = await this.prisma.market.update({
      where: { id: marketId },
      data: {
        name: dto.name?.trim(),
        address: dto.address?.trim(),
        phone: dto.phone?.replace(/\s+/g, ''),
        status: dto.status,
      },
    });

    return this.toMarketResponse(updated);
  }

  async createCategory(
    authUser: AuthenticatedUser,
    marketId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const actor = await this.getActor(authUser.id);
    await this.assertMarketAccess(actor, marketId);

    try {
      const category = await this.prisma.category.create({
        data: {
          marketId,
          name: dto.name.trim(),
          imageUrl: dto.imageUrl ?? null,
        },
      });

      return this.toCategoryResponse(category);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Bu nomdagi kategoriya allaqachon mavjud');
      }

      throw error;
    }
  }

  async listCategories(
    authUser: AuthenticatedUser,
    marketId: string,
  ): Promise<CategoryResponseDto[]> {
    const actor = await this.getActor(authUser.id);
    await this.assertMarketAccess(actor, marketId);

    const categories = await this.prisma.category.findMany({
      where: { marketId },
      orderBy: { createdAt: 'desc' },
    });

    return categories.map((category) => this.toCategoryResponse(category));
  }

  async updateCategory(
    authUser: AuthenticatedUser,
    marketId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const actor = await this.getActor(authUser.id);
    await this.assertMarketAccess(actor, marketId);

    const targetCategory = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        marketId,
      },
    });

    if (!targetCategory) {
      throw new NotFoundException('Kategoriya topilmadi');
    }

    try {
      const updated = await this.prisma.category.update({
        where: { id: categoryId },
        data: {
          name: dto.name?.trim(),
          imageUrl: dto.imageUrl,
        },
      });

      return this.toCategoryResponse(updated);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Bu nomdagi kategoriya allaqachon mavjud');
      }

      throw error;
    }
  }

  async deleteCategory(
    authUser: AuthenticatedUser,
    marketId: string,
    categoryId: string,
  ): Promise<{ message: string }> {
    const actor = await this.getActor(authUser.id);
    await this.assertMarketAccess(actor, marketId);

    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        marketId,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }

    if (category._count.products > 0) {
      throw new ConflictException(
        'Bu kategoriyada mahsulotlar mavjud, avval mahsulotlarni olib tashlang',
      );
    }

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    return {
      message: 'Kategoriya muvaffaqiyatli ochirildi',
    };
  }

  async createProduct(
    authUser: AuthenticatedUser,
    marketId: string,
    dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const actor = await this.getActor(authUser.id);
    await this.assertMarketAccess(actor, marketId);

    await this.assertCategoryInMarket(dto.categoryId, marketId);

    const product = await this.prisma.product.create({
      data: {
        marketId,
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        imageUrl: dto.imageUrl ?? null,
        stock: dto.stock ?? 0,
        basePrice: new Prisma.Decimal(dto.basePrice),
        status: dto.status ?? ProductStatus.ACTIVE,
      },
    });

    return this.toProductResponse(product);
  }

  async listProducts(
    authUser: AuthenticatedUser,
    marketId: string,
    query: ListProductsQueryDto,
  ): Promise<ProductResponseDto[]> {
    const actor = await this.getActor(authUser.id);
    await this.assertMarketAccess(actor, marketId);

    const where: Prisma.ProductWhereInput = {
      marketId,
      categoryId: query.categoryId,
      status: query.status,
    };

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.toProductResponse(product));
  }

  async getProductById(
    authUser: AuthenticatedUser,
    marketId: string,
    productId: string,
  ): Promise<ProductResponseDto> {
    const actor = await this.getActor(authUser.id);
    await this.assertMarketAccess(actor, marketId);

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        marketId,
      },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    return this.toProductResponse(product);
  }

  async updateProduct(
    authUser: AuthenticatedUser,
    marketId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const actor = await this.getActor(authUser.id);
    await this.assertMarketAccess(actor, marketId);

    const existing = await this.prisma.product.findFirst({
      where: {
        id: productId,
        marketId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    if (dto.categoryId) {
      await this.assertCategoryInMarket(dto.categoryId, marketId);
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        categoryId: dto.categoryId,
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        imageUrl: dto.imageUrl,
        stock: dto.stock,
        basePrice:
          dto.basePrice !== undefined
            ? new Prisma.Decimal(dto.basePrice)
            : undefined,
        status: dto.status,
      },
    });

    return this.toProductResponse(updated);
  }

  private async assertCategoryInMarket(
    categoryId: string,
    marketId: string,
  ): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        marketId,
      },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException('Kategoriya ushbu marketga tegishli emas');
    }
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

  private async assertMarketAccess(
    actor: ActorUser,
    marketId: string,
  ): Promise<Market> {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      throw new NotFoundException('Market topilmadi');
    }

    if (actor.role === Role.OWNER && market.ownerId === actor.id) {
      return market;
    }

    if (actor.role === Role.ADMIN && actor.marketId === market.id) {
      return market;
    }

    throw new ForbiddenException('Bu marketga kirish huquqi yoq');
  }

  private toMarketResponse(market: Market): MarketResponseDto {
    return {
      id: market.id,
      ownerId: market.ownerId,
      name: market.name,
      address: market.address,
      phone: market.phone,
      status: market.status,
      createdAt: market.createdAt,
      updatedAt: market.updatedAt,
    };
  }

  private toCategoryResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      marketId: category.marketId,
      name: category.name,
      imageUrl: category.imageUrl,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private toProductResponse(product: Product): ProductResponseDto {
    return {
      id: product.id,
      marketId: product.marketId,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      stock: product.stock,
      basePrice: product.basePrice.toString(),
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeError = error as { code?: string };
    return maybeError.code === 'P2002';
  }
}

type ActorUser = {
  id: string;
  role: Role;
  marketId: string | null;
};
