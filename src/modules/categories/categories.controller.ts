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
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @ApiOperation({ summary: 'Market kategoriyalari (search bilan)' })
  @ApiQuery({ name: 'marketId', required: true, description: "Market ID'i" })
  @ApiQuery({
    name: 'search',
    required: false,
    description: "Kategoriya nomi bo'yicha qidirish",
  })
  findAll(
    @Query('marketId') marketId: string,
    @Query('search') search: string | undefined,
    @CurrentUser() user: User,
  ) {
    return this.categoriesService.findAll(marketId, user, search);
  }

  @Post()
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Yangi kategoriya yaratish' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: User) {
    return this.categoriesService.create(dto, user);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @ApiOperation({
    summary: "Kategoriya ma'lumotlarini olish (mahsulotlar bilan)",
  })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.categoriesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Kategoriyani tahrirlash (nom yoki rasm)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: User,
  ) {
    return this.categoriesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: "Kategoriyani o'chirish (mahsulotlar yo'q bo'lsa)" })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.categoriesService.remove(id, user);
  }
}
