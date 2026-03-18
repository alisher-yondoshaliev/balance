import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthTokenDto } from './dto/auth-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Owner ro'yxatdan o'tishi" })
  @ApiCreatedResponse({ type: AuthTokenDto })
  @Post('register-owner')
  registerOwner(@Body() dto: RegisterOwnerDto): Promise<AuthTokenDto> {
    return this.authService.registerOwner(dto);
  }

  @ApiOperation({ summary: 'Tizimga kirish' })
  @ApiOkResponse({ type: AuthTokenDto })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthTokenDto> {
    return this.authService.login(dto);
  }
}
