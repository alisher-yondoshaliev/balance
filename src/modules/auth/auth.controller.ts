import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthMeResponse } from './dto/auth-me.response';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GoogleGuard } from './guards/google.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Emailga OTP yuborish (register uchun)' })
  @ApiResponse({ status: 201, description: 'OTP yuborildi' })
  @ApiResponse({
    status: 409,
    description: "Email allaqachon ro'yxatdan o'tgan",
  })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'OTP tasdiqlash → emailToken olish' })
  @ApiResponse({ status: 201, description: 'emailToken qaytarildi' })
  @ApiResponse({
    status: 400,
    description: "OTP noto'g'ri yoki muddati o'tgan",
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('register')
  @ApiOperation({ summary: "Ro'yxatdan o'tish (Owner)" })
  @ApiResponse({ status: 201, description: 'Account yaratildi' })
  @ApiResponse({ status: 400, description: "emailToken muddati o'tgan" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Kirish (email + password)' })
  @ApiResponse({ status: 201, description: 'Tokenlar qaytarildi' })
  @ApiResponse({ status: 401, description: "Email yoki parol noto'g'ri" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Access token yangilash' })
  refresh(@Req() req: Request) {
    const user = req.user as { sub: string };
    return this.authService.refresh(user.sub);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Joriy foydalanuvchining ma'lumotlari" })
  @ApiResponse({
    status: 200,
    description: 'User information returned',
    type: Object,
  })
  async me(@CurrentUser('id') userId: string): Promise<AuthMeResponse> {
    return this.authService.me(userId);
  }

  @Get('google')
  @UseGuards(GoogleGuard)
  @ApiOperation({ summary: 'Google orqali kirish' })
  googleLogin() {
    // Passport Google sahifasiga yo'naltiradi
  }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  @ApiOperation({ summary: 'Google callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as {
      email: string;
      fullName: string;
      picture: string;
    };
    const result = await this.authService.googleAuth(googleUser);

    // Frontend'ga token'larni query parameter bilan yo'naltirish
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/google/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;

    res.redirect(redirectUrl);
  }

  @Patch('change-password')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Parol o'zgartirish" })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Parolni unutdim → parol yangilash' })
  @ApiResponse({
    status: 201,
    description: "Parol muvaffaqiyatli o'zgartirildi",
  })
  @ApiResponse({
    status: 400,
    description: "Token muddati o'tgan yoki email tasdiqlanmagan",
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.resetToken, dto.newPassword);
  }
}
