import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role, User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthTokenDto } from './dto/auth-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerOwner(dto: RegisterOwnerDto): Promise<AuthTokenDto> {
    const phone = dto.phone?.replace(/\s+/g, '');
    const email = dto.email?.trim().toLowerCase();

    if (!phone && !email) {
      throw new BadRequestException('Telefon yoki emaildan bittasi majburiy');
    }

    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [
          phone ? { phone } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean) as Prisma.UserWhereInput[],
      },
    });

    if (exists) {
      throw new ConflictException('Bu telefon yoki email allaqachon band');
    }

    const password = await bcrypt.hash(dto.password, 10);

    const owner = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: phone ?? null,
        email: email ?? null,
        password,
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
      },
    });

    return this.issueAccessToken(owner);
  }

  async login(dto: LoginDto): Promise<AuthTokenDto> {
    const login = dto.login.trim();
    const user = await this.findUserByLogin(login);

    if (!user) {
      throw new UnauthorizedException('Login yoki parol xato');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Login yoki parol xato');
    }

    await this.ensureUserCanLogin(user);

    return this.issueAccessToken(user);
  }

  private async findUserByLogin(login: string): Promise<User | null> {
    const normalizedLogin = login.toLowerCase();

    if (normalizedLogin.includes('@')) {
      return this.prisma.user.findUnique({
        where: { email: normalizedLogin },
      });
    }

    return this.prisma.user.findUnique({
      where: { phone: login.replace(/\s+/g, '') },
    });
  }

  private async ensureUserCanLogin(user: User): Promise<void> {
    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Profilingiz bloklangan');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException("Profilingiz vaqtincha o'chirilgan");
    }

    if (user.status === UserStatus.EXPIRED) {
      throw new ForbiddenException('Obuna muddati tugagan');
    }

    if (
      user.role === Role.OWNER &&
      user.subEndDate &&
      new Date() > user.subEndDate
    ) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.EXPIRED },
      });

      throw new ForbiddenException('Obuna muddati tugagan');
    }
  }

  private async issueAccessToken(user: User): Promise<AuthTokenDto> {
    const login = user.phone ?? user.email ?? '';

    const payload: JwtPayload = {
      sub: user.id,
      login,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Muvaffaqiyatli bajarildi',
      accessToken,
      user: {
        id: user.id,
        login,
        role: user.role,
      },
    };
  }
}
