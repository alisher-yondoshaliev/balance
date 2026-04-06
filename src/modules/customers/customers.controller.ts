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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Barcha mijozlar' })
  @ApiQuery({ name: 'marketId', required: true })
  findAll(
    @Query('marketId') marketId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.customersService.findAll(marketId, currentUser);
  }

  @Post()
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Mijoz qo'shish" })
  create(@Body() dto: CreateCustomerDto, @CurrentUser() currentUser: User) {
    return this.customersService.create(dto, currentUser);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Bitta mijoz' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.customersService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Mijoz tahrirlash' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.customersService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: "Mijoz o'chirish" })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.customersService.remove(id, currentUser);
  }

  @Get(':id/contracts')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Mijoz shartnomalar' })
  findContracts(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.customersService.findContracts(id, currentUser);
  }
}
