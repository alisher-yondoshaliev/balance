import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role, User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ListStaffQueryDto } from './dto/list-staff.query.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(authUser: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    return this.toUserResponse(user);
  }

  async createStaff(
    authUser: AuthenticatedUser,
    dto: CreateStaffDto,
  ): Promise<UserResponseDto> {
    const actor = await this.getActor(authUser.id);

    const phone = dto.phone?.replace(/\s+/g, '');
    const email = dto.email?.trim().toLowerCase();

    if (!phone && !email) {
      throw new BadRequestException('Telefon yoki emaildan bittasi majburiy');
    }

    const marketId = await this.resolveTargetMarket(actor, dto);
    this.validateRoleAssignment(actor.role, dto.role);

    const identityConditions: Prisma.UserWhereInput[] = [];

    if (phone) {
      identityConditions.push({ phone });
    }

    if (email) {
      identityConditions.push({ email });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: identityConditions },
    });

    if (existingUser) {
      throw new ConflictException('Bu telefon yoki email allaqachon band');
    }

    const password = await bcrypt.hash(dto.password, 10);

    const createdStaff = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: phone ?? null,
        email: email ?? null,
        password,
        role: dto.role,
        status: UserStatus.ACTIVE,
        marketId,
      },
    });

    return this.toUserResponse(createdStaff);
  }

  async listStaff(
    authUser: AuthenticatedUser,
    query: ListStaffQueryDto,
  ): Promise<UserResponseDto[]> {
    const actor = await this.getActor(authUser.id);

    let marketIds: string[] = [];

    if (actor.role === Role.OWNER) {
      if (query.marketId) {
        await this.ensureOwnerMarket(actor.id, query.marketId);
        marketIds = [query.marketId];
      } else {
        const ownedMarkets = await this.prisma.market.findMany({
          where: { ownerId: actor.id },
          select: { id: true },
        });
        marketIds = ownedMarkets.map((item) => item.id);
      }
    } else if (actor.role === Role.ADMIN) {
      if (!actor.marketId) {
        throw new ForbiddenException('Admin marketga biriktirilmagan');
      }
      marketIds = [actor.marketId];
    } else {
      throw new ForbiddenException('Bu amal uchun ruxsat yoq');
    }

    if (marketIds.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        marketId: { in: marketIds },
        role: { in: [Role.ADMIN, Role.MANAGER, Role.SELLER] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((item) => this.toUserResponse(item));
  }

  async updateStaffStatus(
    authUser: AuthenticatedUser,
    staffId: string,
    dto: UpdateStaffStatusDto,
  ): Promise<UserResponseDto> {
    const actor = await this.getActor(authUser.id);

    const targetStaff = await this.prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!targetStaff) {
      throw new NotFoundException('Xodim topilmadi');
    }

    if (targetStaff.role === Role.OWNER) {
      throw new ForbiddenException(
        'Owner statusini bu yerdan boshqarib bolmaydi',
      );
    }

    if (actor.role === Role.OWNER) {
      if (!targetStaff.marketId) {
        throw new ForbiddenException('Xodim marketga biriktirilmagan');
      }
      await this.ensureOwnerMarket(actor.id, targetStaff.marketId);
    } else if (actor.role === Role.ADMIN) {
      if (!actor.marketId || targetStaff.marketId !== actor.marketId) {
        throw new ForbiddenException(
          'Faqat oz marketidagi xodimlar boshqariladi',
        );
      }

      if (targetStaff.role === Role.ADMIN) {
        throw new ForbiddenException(
          'Admin boshqa admin statusini ozgartira olmaydi',
        );
      }
    } else {
      throw new ForbiddenException('Bu amal uchun ruxsat yoq');
    }

    const nextStatus = dto.status as UserStatus;

    const updatedUser = await this.prisma.user.update({
      where: { id: staffId },
      data: { status: nextStatus },
    });

    return this.toUserResponse(updatedUser);
  }

  private async resolveTargetMarket(
    actor: ActorUser,
    dto: CreateStaffDto,
  ): Promise<string> {
    if (actor.role === Role.OWNER) {
      if (!dto.marketId) {
        throw new BadRequestException(
          'Owner staff yaratishda marketId yuborishi shart',
        );
      }

      await this.ensureOwnerMarket(actor.id, dto.marketId);
      return dto.marketId;
    }

    if (actor.role === Role.ADMIN) {
      if (!actor.marketId) {
        throw new ForbiddenException('Admin marketga biriktirilmagan');
      }

      return actor.marketId;
    }

    throw new ForbiddenException('Faqat owner yoki admin staff qosha oladi');
  }

  private validateRoleAssignment(actorRole: Role, targetRole: Role): void {
    if (targetRole === Role.OWNER) {
      throw new BadRequestException(
        'OWNER rolini staff sifatida yaratib bolmaydi',
      );
    }

    if (actorRole === Role.OWNER) {
      return;
    }

    if (actorRole === Role.ADMIN) {
      if (targetRole === Role.ADMIN) {
        throw new ForbiddenException('Admin yangi ADMIN yarata olmaydi');
      }

      return;
    }

    throw new ForbiddenException('Bu amal uchun ruxsat yoq');
  }

  private async ensureOwnerMarket(
    ownerId: string,
    marketId: string,
  ): Promise<void> {
    const ownerMarket = await this.prisma.market.findFirst({
      where: {
        id: marketId,
        ownerId,
      },
      select: { id: true },
    });

    if (!ownerMarket) {
      throw new ForbiddenException('Bu market sizga tegishli emas');
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

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      marketId: user.marketId,
      planId: user.planId,
      subEndDate: user.subEndDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

type ActorUser = {
  id: string;
  role: Role;
  marketId: string | null;
};
