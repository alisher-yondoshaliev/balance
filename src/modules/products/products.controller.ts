import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiProperty,
} from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreatePricePlanDto } from './dto/create-price-plan.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductStatus, Role, User } from '@prisma/client';

class UpdateStatusDto {
  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  status: ProductStatus = 'ACTIVE';
}

@ApiTags('Products')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @ApiOperation({ summary: 'Barcha mahsulotlar' })
  @ApiQuery({ name: 'marketId', required: true })
  findAll(@Query('marketId') marketId: string, @CurrentUser() user: User) {
    return this.productsService.findAll(marketId, user);
  }

  @Post()
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Mahsulot yaratish' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: User) {
    return this.productsService.create(dto, user);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @ApiOperation({ summary: 'Bitta mahsulot' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Mahsulot tahrirlash' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: "Mahsulot statusini o'zgartirish" })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.updateStatus(id, dto.status, user);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Mahsulotni arxivlash' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.remove(id, user);
  }

  // ── Price Plans ──────────────────────────────────
  @Post(':id/price-plans')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: "Narx rejasi qo'shish" })
  createPricePlan(
    @Param('id') id: string,
    @Body() dto: CreatePricePlanDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.createPricePlan(id, dto, user);
  }

  @Patch(':id/price-plans/:planId')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Narx rejasi tahrirlash' })
  updatePricePlan(
    @Param('id') id: string,
    @Param('planId') planId: string,
    @Body() dto: CreatePricePlanDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.updatePricePlan(id, planId, dto, user);
  }

  @Delete(':id/price-plans/:planId')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: "Narx rejasi o'chirish" })
  removePricePlan(
    @Param('id') id: string,
    @Param('planId') planId: string,
    @CurrentUser() user: User,
  ) {
    return this.productsService.removePricePlan(id, planId, user);
  }
}
