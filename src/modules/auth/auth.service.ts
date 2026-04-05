import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  // ── 1. OTP yuborish (faqat register uchun) ─────────
  async sendOtp(dto: SendOtpDto) {
    // Email allaqachon ro'yxatdan o'tganmi?
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException("Bu email allaqachon ro'yxatdan o'tgan");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpToken = await this.jwtService.signAsync(
      { email: dto.email, otp },
      {
        secret: this.configService.getOrThrow('JWT_OTP_SECRET'),
        expiresIn: '1m',
      },
    );

    await this.mailService.sendOtp(dto.email, otp);

    return {
      message: 'OTP kod emailga yuborildi',
      otpToken,
    };
  }

  // ── 2. OTP tasdiqlash → emailToken olish ──────────
  async verifyOtp(dto: VerifyOtpDto) {
    let payload: { email: string; otp: string };

    try {
      payload = await this.jwtService.verifyAsync(dto.otpToken, {
        secret: this.configService.getOrThrow('JWT_OTP_SECRET'),
      });
    } catch {
      throw new BadRequestException("OTP token muddati o'tgan yoki noto'g'ri");
    }

    if (payload.email !== dto.email) {
      throw new BadRequestException('Email mos kelmadi');
    }

    if (payload.otp !== dto.otp) {
      throw new BadRequestException("OTP kod noto'g'ri");
    }

    // Email tasdiqlangan — emailToken beramiz (5 daqiqa)
    const emailToken = await this.jwtService.signAsync(
      { email: dto.email, verified: true },
      {
        secret: this.configService.getOrThrow('JWT_EMAIL_SECRET'),
        expiresIn: '5m',
      },
    );

    return {
      message: 'Email tasdiqlandi',
      emailToken,
    };
  }

  // ── 3. Register ────────────────────────────────────
  async register(dto: RegisterDto) {
    let payload: { email: string; verified: boolean };

    // emailToken tekshirish
    try {
      payload = await this.jwtService.verifyAsync(dto.emailToken, {
        secret: this.configService.getOrThrow('JWT_EMAIL_SECRET'),
      });
    } catch {
      throw new BadRequestException(
        "Email token muddati o'tgan, qaytadan OTP oling",
      );
    }

    if (!payload.verified) {
      throw new BadRequestException('Email tasdiqlanmagan');
    }

    // Yana bir bor tekshiramiz
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existing) {
      throw new ConflictException("Bu email allaqachon ro'yxatdan o'tgan");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        fullName: dto.fullName,
        password: hashedPassword,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: "Ro'yxatdan o'tish muvaffaqiyatli",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  // ── 4. Login ───────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Foydalanuvchi bloklangan');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        marketId: user.marketId,
      },
      ...tokens,
    };
  }

  // ── 5. Refresh ─────────────────────────────────────
  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User topilmadi yoki bloklangan');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ── 6. Me ──────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        marketId: true,
        subEndDate: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('User topilmadi');
    return user;
  }

  // ── 7. Change Password ─────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User topilmadi');

    const match = await bcrypt.compare(dto.oldPassword, user.password);
    if (!match) throw new UnauthorizedException("Eski parol noto'g'ri");

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: "Parol muvaffaqiyatli o'zgartirildi" };
  }

  // ── Token generator ────────────────────────────────
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  //   google
  // auth.service.ts ga qo'shimcha method

  async googleAuth(googleUser: {
    email: string;
    fullName: string;
    picture: string;
  }) {
    // Foydalanuvchi mavjudmi?
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      // Login — mavjud user
      if (user.status !== 'ACTIVE') {
        throw new ForbiddenException('Foydalanuvchi bloklangan');
      }
    } else {
      // Register — yangi user yaratish
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          fullName: googleUser.fullName,
          password: '', // Google user parolsiz
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        marketId: user.marketId,
      },
      ...tokens,
    };
  }
}
