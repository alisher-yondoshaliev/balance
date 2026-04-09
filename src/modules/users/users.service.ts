import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Barcha userlar
  async findAll(currentUser: User) {
    if ((currentUser.role as any) === 'SUPERADMIN') {
      return this.prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          marketId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // OWNER faqat o'z market userlarini ko'radi
    if (currentUser.role === Role.OWNER) {
      return this.prisma.user.findMany({
        where: {
          marketId: { not: null },
          workMarket: {
            ownerId: currentUser.id,
          },
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          marketId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException("Ruxsat yo'q");
  }

  // User qo'shish
  async create(dto: CreateUserDto, currentUser: User) {
    if (
      (currentUser.role as any) !== 'OWNER' &&
      (currentUser.role as any) !== 'SUPERADMIN'
    ) {
      throw new ForbiddenException("Xodim qo'shish huquqi yo'q");
    }

    // OWNER faqat o'z marketiga xodim qo'sha oladi
    if (currentUser.role === Role.OWNER) {
      if (!dto.marketId) {
        throw new ForbiddenException('marketId kiritilishi shart');
      }

      // Validate UUID format (DTO validation handles this, but adding extra safety)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(dto.marketId)) {
        throw new BadRequestException(
          'marketId must be a valid UUID v4 format',
        );
      }

      try {
        const market = await this.prisma.market.findUnique({
          where: { id: dto.marketId },
        });

        if (!market) {
          throw new NotFoundException('Market topilmadi');
        }

        if (market.ownerId !== currentUser.id) {
          throw new ForbiddenException('Bu market sizga tegishli emas');
        }
      } catch (error: any) {
        // If Prisma throws UUID validation error, catch it
        if (error.code === 'P2023') {
          throw new BadRequestException('marketId must be a valid UUID format');
        }
        // Re-throw our custom exceptions
        if (
          error instanceof NotFoundException ||
          error instanceof ForbiddenException ||
          error instanceof BadRequestException
        ) {
          throw error;
        }
        throw error;
      }

      // OWNER faqat ADMIN, MANAGER, SELLER qo'sha oladi
      if ((dto.role as any) === 'OWNER' || (dto.role as any) === 'SUPERADMIN') {
        throw new ForbiddenException("Bu rolni qo'shish huquqi yo'q");
      }
    }

    // Email unique tekshirish
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Bu email bilan user allaqachon mavjud');
    }

    // Phone unique tekshirish
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException(
          'Bu telefon raqam bilan user allaqachon mavjud',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: dto.role,
        marketId: dto.marketId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        marketId: true,
        createdAt: true,
      },
    });
  }

  // Bitta user
  async findOne(id: string, currentUser: User) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        marketId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User topilmadi');
    }

    // OWNER faqat o'z xodimlarini ko'radi
    if (currentUser.role === Role.OWNER && user.marketId) {
      const market = await this.prisma.market.findFirst({
        where: { id: user.marketId, ownerId: currentUser.id },
      });
      if (!market) {
        throw new ForbiddenException("Ruxsat yo'q");
      }
    }

    return user;
  }

  // User tahrirlash
  async update(id: string, dto: UpdateUserDto, currentUser: User) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User topilmadi');
    }

    // OWNER faqat o'z xodimlarini tahrirlaydi
    if (currentUser.role === Role.OWNER && user.marketId) {
      const market = await this.prisma.market.findFirst({
        where: { id: user.marketId, ownerId: currentUser.id },
      });
      if (!market) {
        throw new ForbiddenException("Ruxsat yo'q");
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.role && { role: dto.role }),
        ...(dto.marketId && { marketId: dto.marketId }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        marketId: true,
        createdAt: true,
      },
    });
  }

  // User o'chirish
  async remove(id: string, currentUser: User) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User topilmadi');
    }

    if (id === currentUser.id) {
      throw new ForbiddenException("O'zingizni o'chira olmaysiz");
    }

    // OWNER faqat o'z xodimlarini o'chiradi
    if (currentUser.role === Role.OWNER && user.marketId) {
      const market = await this.prisma.market.findFirst({
        where: { id: user.marketId, ownerId: currentUser.id },
      });
      if (!market) {
        throw new ForbiddenException("Ruxsat yo'q");
      }
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: "User muvaffaqiyatli o'chirildi" };
  }

  // User status o'zgartirish
  async updateStatus(id: string, status: UserStatus, currentUser: User) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User topilmadi');
    }

    if (id === currentUser.id) {
      throw new ForbiddenException("O'z statusingizni o'zgartira olmaysiz");
    }

    // OWNER faqat o'z xodimlarini bloklaydi
    if (currentUser.role === Role.OWNER && user.marketId) {
      const market = await this.prisma.market.findFirst({
        where: { id: user.marketId, ownerId: currentUser.id },
      });
      if (!market) {
        throw new ForbiddenException("Ruxsat yo'q");
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        fullName: true,
        status: true,
      },
    });
  }
}
