import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-status.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN' as any, Role.OWNER)
  @ApiOperation({ summary: 'Barcha userlar' })
  findAll(@CurrentUser() currentUser: User) {
    return this.usersService.findAll(currentUser);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, 'SUPERADMIN' as any)
  @ApiOperation({ summary: "Xodim qo'shish" })
  create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: User) {
    return this.usersService.create(dto, currentUser);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN' as any, Role.OWNER)
  @ApiOperation({ summary: 'Bitta user' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.usersService.findOne(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN' as any, Role.OWNER)
  @ApiOperation({ summary: 'User tahrirlash' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN' as any, Role.OWNER)
  @ApiOperation({ summary: "User o'chirish" })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.usersService.remove(id, currentUser);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN' as any, Role.OWNER)
  @ApiOperation({ summary: "User statusini o'zgartirish" })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.updateStatus(id, dto.status, currentUser);
  }
}
