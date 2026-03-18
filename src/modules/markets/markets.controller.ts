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
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateMarketDto } from './dto/create-market.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import { MarketResponseDto } from './dto/market-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { MarketsService } from './markets.service';

@ApiTags('Markets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @ApiOperation({ summary: 'Yangi market yaratish' })
  @ApiCreatedResponse({ type: MarketResponseDto })
  @Roles(Role.OWNER)
  @Post()
  createMarket(
    @CurrentUser() authUser: AuthenticatedUser,
    @Body() dto: CreateMarketDto,
  ): Promise<MarketResponseDto> {
    return this.marketsService.createMarket(authUser, dto);
  }

  @ApiOperation({ summary: 'Marketlar royxati' })
  @ApiOkResponse({ type: MarketResponseDto, isArray: true })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get()
  listMarkets(
    @CurrentUser() authUser: AuthenticatedUser,
  ): Promise<MarketResponseDto[]> {
    return this.marketsService.listMarkets(authUser);
  }

  @ApiOperation({ summary: 'Bitta marketni olish' })
  @ApiOkResponse({ type: MarketResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get(':marketId')
  getMarketById(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
  ): Promise<MarketResponseDto> {
    return this.marketsService.getMarketById(authUser, marketId);
  }

  @ApiOperation({ summary: 'Market malumotlarini yangilash' })
  @ApiOkResponse({ type: MarketResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':marketId')
  updateMarket(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
    @Body() dto: UpdateMarketDto,
  ): Promise<MarketResponseDto> {
    return this.marketsService.updateMarket(authUser, marketId, dto);
  }

  @ApiOperation({ summary: 'Marketga kategoriya qoshish' })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':marketId/categories')
  createCategory(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.marketsService.createCategory(authUser, marketId, dto);
  }

  @ApiOperation({ summary: 'Market kategoriyalari' })
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get(':marketId/categories')
  listCategories(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
  ): Promise<CategoryResponseDto[]> {
    return this.marketsService.listCategories(authUser, marketId);
  }

  @ApiOperation({ summary: 'Kategoriyani yangilash' })
  @ApiOkResponse({ type: CategoryResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':marketId/categories/:categoryId')
  updateCategory(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.marketsService.updateCategory(
      authUser,
      marketId,
      categoryId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Kategoriyani ochirish' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Kategoriya muvaffaqiyatli ochirildi',
        },
      },
    },
  })
  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':marketId/categories/:categoryId')
  deleteCategory(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ): Promise<{ message: string }> {
    return this.marketsService.deleteCategory(authUser, marketId, categoryId);
  }

  @ApiOperation({ summary: 'Marketga mahsulot qoshish' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':marketId/products')
  createProduct(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.marketsService.createProduct(authUser, marketId, dto);
  }

  @ApiOperation({ summary: 'Market mahsulotlari royxati' })
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get(':marketId/products')
  listProducts(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
    @Query() query: ListProductsQueryDto,
  ): Promise<ProductResponseDto[]> {
    return this.marketsService.listProducts(authUser, marketId, query);
  }

  @ApiOperation({ summary: 'Bitta mahsulotni olish' })
  @ApiOkResponse({ type: ProductResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Get(':marketId/products/:productId')
  getProductById(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ): Promise<ProductResponseDto> {
    return this.marketsService.getProductById(authUser, marketId, productId);
  }

  @ApiOperation({ summary: 'Mahsulotni yangilash' })
  @ApiOkResponse({ type: ProductResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':marketId/products/:productId')
  updateProduct(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('marketId', new ParseUUIDPipe()) marketId: string,
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.marketsService.updateProduct(
      authUser,
      marketId,
      productId,
      dto,
    );
  }
}
