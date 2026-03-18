import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Prisma,
  ProductPricePlan,
  Role,
  type Product,
  type User,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateProductPricePlanDto } from './dto/create-product-price-plan.dto';
import { ListProductPricePlansQueryDto } from './dto/list-product-price-plans.query.dto';
import { ProductPricePlanResponseDto } from './dto/product-price-plan-response.dto';
import { UpdateProductPricePlanDto } from './dto/update-product-price-plan.dto';

type ActorUser = Pick<User, 'id' | 'role' | 'marketId'>;
type ProductContext = Pick<Product, 'id' | 'marketId'> & {
  market: { ownerId: string };
};

@Injectable()
export class ProductPricePlansService {
  constructor(private readonly prisma: PrismaService) {}

  async createProductPricePlan(
    authUser: AuthenticatedUser,
    dto: CreateProductPricePlanDto,
  ): Promise<ProductPricePlanResponseDto> {
    const actor = await this.getActor(authUser.id);
    const product = await this.getProductContext(dto.productId);

    this.assertWriteAccess(actor, product.marketId, product.market.ownerId);

    try {
      const created = await this.prisma.productPricePlan.create({
        data: {
          productId: dto.productId,
          termMonths: dto.termMonths,
          interestRate: new Prisma.Decimal(dto.interestRate),
          totalPrice: new Prisma.Decimal(dto.totalPrice),
          monthlyPrice: new Prisma.Decimal(dto.monthlyPrice),
        },
      });

      return this.toResponse(created);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Ushbu mahsulot uchun shu muddatdagi narx rejasi allaqachon mavjud',
        );
      }

      throw error;
    }
  }

  async listProductPricePlans(
    authUser: AuthenticatedUser,
    query: ListProductPricePlansQueryDto,
  ): Promise<ProductPricePlanResponseDto[]> {
    const actor = await this.getActor(authUser.id);
    const product = await this.getProductContext(query.productId);

    this.assertReadAccess(actor, product.marketId, product.market.ownerId);

    const where: Prisma.ProductPricePlanWhereInput = {
      productId: query.productId,
      termMonths: query.termMonths,
    };

    const plans = await this.prisma.productPricePlan.findMany({
      where,
      orderBy: { termMonths: 'asc' },
    });

    return plans.map((item) => this.toResponse(item));
  }

  async getProductPricePlanById(
    authUser: AuthenticatedUser,
    planId: string,
  ): Promise<ProductPricePlanResponseDto> {
    const actor = await this.getActor(authUser.id);

    const plan = await this.prisma.productPricePlan.findUnique({
      where: { id: planId },
      include: {
        product: {
          select: {
            marketId: true,
            market: {
              select: {
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Narx rejasi topilmadi');
    }

    this.assertReadAccess(
      actor,
      plan.product.marketId,
      plan.product.market.ownerId,
    );

    return this.toResponse(plan);
  }

  async updateProductPricePlan(
    authUser: AuthenticatedUser,
    planId: string,
    dto: UpdateProductPricePlanDto,
  ): Promise<ProductPricePlanResponseDto> {
    const actor = await this.getActor(authUser.id);

    const existing = await this.prisma.productPricePlan.findUnique({
      where: { id: planId },
      include: {
        product: {
          select: {
            marketId: true,
            market: {
              select: {
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Narx rejasi topilmadi');
    }

    this.assertWriteAccess(
      actor,
      existing.product.marketId,
      existing.product.market.ownerId,
    );

    if (
      dto.interestRate === undefined &&
      dto.totalPrice === undefined &&
      dto.monthlyPrice === undefined &&
      dto.termMonths === undefined
    ) {
      throw new BadRequestException(
        'Yangilash uchun kamida bitta maydon yuboring',
      );
    }

    try {
      const updated = await this.prisma.productPricePlan.update({
        where: { id: planId },
        data: {
          termMonths: dto.termMonths,
          interestRate:
            dto.interestRate !== undefined
              ? new Prisma.Decimal(dto.interestRate)
              : undefined,
          totalPrice:
            dto.totalPrice !== undefined
              ? new Prisma.Decimal(dto.totalPrice)
              : undefined,
          monthlyPrice:
            dto.monthlyPrice !== undefined
              ? new Prisma.Decimal(dto.monthlyPrice)
              : undefined,
        },
      });

      return this.toResponse(updated);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Ushbu mahsulot uchun shu muddatdagi narx rejasi allaqachon mavjud',
        );
      }

      throw error;
    }
  }

  async deleteProductPricePlan(
    authUser: AuthenticatedUser,
    planId: string,
  ): Promise<{ message: string }> {
    const actor = await this.getActor(authUser.id);

    const existing = await this.prisma.productPricePlan.findUnique({
      where: { id: planId },
      include: {
        product: {
          select: {
            marketId: true,
            market: {
              select: {
                ownerId: true,
              },
            },
          },
        },
        _count: {
          select: {
            contractItems: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Narx rejasi topilmadi');
    }

    this.assertWriteAccess(
      actor,
      existing.product.marketId,
      existing.product.market.ownerId,
    );

    if (existing._count.contractItems > 0) {
      throw new ConflictException(
        'Bu narx rejasi contractlarda ishlatilgan, ochirib bolmaydi',
      );
    }

    await this.prisma.productPricePlan.delete({
      where: { id: planId },
    });

    return {
      message: 'Narx rejasi muvaffaqiyatli ochirildi',
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

  private async getProductContext(productId: string): Promise<ProductContext> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        marketId: true,
        market: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    return product;
  }

  private assertReadAccess(
    actor: ActorUser,
    marketId: string,
    ownerId: string,
  ): void {
    if (actor.role === Role.OWNER && ownerId === actor.id) {
      return;
    }

    if (
      (actor.role === Role.ADMIN ||
        actor.role === Role.MANAGER ||
        actor.role === Role.SELLER) &&
      actor.marketId === marketId
    ) {
      return;
    }

    throw new ForbiddenException('Bu amal uchun ruxsat yoq');
  }

  private assertWriteAccess(
    actor: ActorUser,
    marketId: string,
    ownerId: string,
  ): void {
    if (actor.role === Role.OWNER && ownerId === actor.id) {
      return;
    }

    if (actor.role === Role.ADMIN && actor.marketId === marketId) {
      return;
    }

    throw new ForbiddenException('Bu amal uchun ruxsat yoq');
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private toResponse(plan: ProductPricePlan): ProductPricePlanResponseDto {
    return {
      id: plan.id,
      productId: plan.productId,
      termMonths: plan.termMonths,
      interestRate: plan.interestRate.toString(),
      totalPrice: plan.totalPrice.toString(),
      monthlyPrice: plan.monthlyPrice.toString(),
    };
  }
}
