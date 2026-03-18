import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role, SubscriptionPlan } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { SubscriptionPlanResponseDto } from './dto/subscription-plan-response.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlan(
    authUser: AuthenticatedUser,
    dto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    const actor = await this.getActor(authUser.id);

    if (actor.role !== Role.OWNER) {
      throw new ForbiddenException('Faqat owner plan yarata oladi');
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name.trim(),
        duration: dto.duration,
        price: new Prisma.Decimal(dto.price),
        description: dto.description?.trim() ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    return this.toPlanResponse(plan);
  }

  async listPlans(): Promise<SubscriptionPlanResponseDto[]> {
    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => this.toPlanResponse(plan));
  }

  async listActivePlans(): Promise<SubscriptionPlanResponseDto[]> {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    return plans.map((plan) => this.toPlanResponse(plan));
  }

  async getPlanById(planId: string): Promise<SubscriptionPlanResponseDto> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan topilmadi');
    }

    return this.toPlanResponse(plan);
  }

  async updatePlan(
    authUser: AuthenticatedUser,
    planId: string,
    dto: Partial<CreateSubscriptionPlanDto>,
  ): Promise<SubscriptionPlanResponseDto> {
    const actor = await this.getActor(authUser.id);

    if (actor.role !== Role.OWNER) {
      throw new ForbiddenException("Faqat owner plan o'zgartira oladi");
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan topilmadi');
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        name: dto.name?.trim(),
        duration: dto.duration,
        price:
          dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
        description: dto.description?.trim(),
        isActive: dto.isActive,
      },
    });

    return this.toPlanResponse(updated);
  }

  private async getActor(userId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!actor) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    return actor;
  }

  private toPlanResponse(plan: SubscriptionPlan): SubscriptionPlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      duration: plan.duration,
      price: plan.price.toString(),
      description: plan.description,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
