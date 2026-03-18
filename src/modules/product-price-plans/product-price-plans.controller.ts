import {
  Body,
  Controller,
  Delete,
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
import { CreateProductPricePlanDto } from './dto/create-product-price-plan.dto';
import { ListProductPricePlansQueryDto } from './dto/list-product-price-plans.query.dto';
import { ProductPricePlanResponseDto } from './dto/product-price-plan-response.dto';
import { UpdateProductPricePlanDto } from './dto/update-product-price-plan.dto';
import { ProductPricePlansService } from './product-price-plans.service';

@ApiTags('Product Price Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product-price-plans')
export class ProductPricePlansController {
  constructor(
    private readonly productPricePlansService: ProductPricePlansService,
  ) {}

  @ApiOperation({ summary: 'Mahsulot uchun narx rejasi yaratish' })
  @ApiCreatedResponse({ type: ProductPricePlanResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post()
  createProductPricePlan(
    @CurrentUser() authUser: AuthenticatedUser,
    @Body() dto: CreateProductPricePlanDto,
  ): Promise<ProductPricePlanResponseDto> {
    return this.productPricePlansService.createProductPricePlan(authUser, dto);
  }

  @ApiOperation({ summary: 'Mahsulot narx rejalari royxati' })
  @ApiOkResponse({ type: ProductPricePlanResponseDto, isArray: true })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @Get()
  listProductPricePlans(
    @CurrentUser() authUser: AuthenticatedUser,
    @Query() query: ListProductPricePlansQueryDto,
  ): Promise<ProductPricePlanResponseDto[]> {
    return this.productPricePlansService.listProductPricePlans(authUser, query);
  }

  @ApiOperation({ summary: 'Bitta narx rejasini olish' })
  @ApiOkResponse({ type: ProductPricePlanResponseDto })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @Get(':planId')
  getProductPricePlanById(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('planId', new ParseUUIDPipe()) planId: string,
  ): Promise<ProductPricePlanResponseDto> {
    return this.productPricePlansService.getProductPricePlanById(
      authUser,
      planId,
    );
  }

  @ApiOperation({ summary: 'Narx rejasini yangilash' })
  @ApiOkResponse({ type: ProductPricePlanResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':planId')
  updateProductPricePlan(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('planId', new ParseUUIDPipe()) planId: string,
    @Body() dto: UpdateProductPricePlanDto,
  ): Promise<ProductPricePlanResponseDto> {
    return this.productPricePlansService.updateProductPricePlan(
      authUser,
      planId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Narx rejasini ochirish' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Narx rejasi muvaffaqiyatli ochirildi',
        },
      },
    },
  })
  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':planId')
  deleteProductPricePlan(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('planId', new ParseUUIDPipe()) planId: string,
  ): Promise<{ message: string }> {
    return this.productPricePlansService.deleteProductPricePlan(
      authUser,
      planId,
    );
  }
}
