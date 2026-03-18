import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ListStaffQueryDto } from './dto/list-staff.query.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Joriy foydalanuvchi profilini olish' })
  @ApiOkResponse({ type: UserResponseDto })
  @Get('me')
  getMe(@CurrentUser() authUser: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService.getMe(authUser);
  }

  @ApiOperation({ summary: 'Market stafflarini royxatini olish' })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get('staff')
  listStaff(
    @CurrentUser() authUser: AuthenticatedUser,
    @Query() query: ListStaffQueryDto,
  ): Promise<UserResponseDto[]> {
    return this.usersService.listStaff(authUser, query);
  }

  @ApiOperation({ summary: 'Yangi staff qoshish' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('staff')
  createStaff(
    @CurrentUser() authUser: AuthenticatedUser,
    @Body() dto: CreateStaffDto,
  ): Promise<UserResponseDto> {
    return this.usersService.createStaff(authUser, dto);
  }

  @ApiOperation({ summary: 'Staff statusini yangilash' })
  @ApiOkResponse({ type: UserResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch('staff/:staffId/status')
  updateStaffStatus(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() dto: UpdateStaffStatusDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateStaffStatus(authUser, staffId, dto);
  }
}
