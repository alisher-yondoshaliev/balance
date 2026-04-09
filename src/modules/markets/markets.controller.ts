import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MarketsService } from './markets.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { GetMarketUsersQueryDto } from './dto/get-market-users-query.dto';
import { GetMarketUsersResponse } from './dto/get-market-users-response.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Markets')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller('markets')
export class MarketsController {
  constructor(private marketsService: MarketsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: "Do'kon yaratish" })
  @ApiResponse({ status: 201, description: "Do'kon yaratildi" })
  create(@Body() dto: CreateMarketDto, @CurrentUser('id') userId: string) {
    return this.marketsService.create(dto, userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: "O'z do'konlarini ko'rish" })
  findMyMarkets(@CurrentUser('id') userId: string) {
    return this.marketsService.findMyMarkets(userId);
  }

  @Get(':id/users')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN' as any, Role.OWNER)
  @ApiOperation({
    summary:
      "Do'konning xodimlarini ko'rish (pagination + filtering + sorting)",
  })
  @ApiResponse({
    status: 200,
    description: "Do'konga tegishli xodimlar ro'yxati",
    type: GetMarketUsersResponse,
  })
  @ApiResponse({
    status: 404,
    description: "Do'kon topilmadi",
  })
  @ApiResponse({
    status: 403,
    description: "Xodimlarni ko'rish huquqi yo'q",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'Ali',
    type: String,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'ACTIVE',
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
  })
  @ApiQuery({
    name: 'role',
    required: false,
    example: 'SELLER',
    type: String,
    enum: ['ADMIN', 'MANAGER', 'SELLER'],
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'createdAt',
    type: String,
    enum: ['createdAt', 'fullName'],
  })
  @ApiQuery({
    name: 'order',
    required: false,
    example: 'desc',
    type: String,
    enum: ['asc', 'desc'],
  })
  findMarketUsers(
    @Param('id') marketId: string,
    @Query() query: GetMarketUsersQueryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.marketsService.findMarketUsers(marketId, currentUser, query);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: "Do'kon tahrirlash" })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMarketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.marketsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: "Do'kon o'chirish" })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.marketsService.remove(id, userId);
  }
}
