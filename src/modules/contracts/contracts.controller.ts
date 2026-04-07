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
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdateContractStatusDto } from './dto/update-status.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Contracts')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get()
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Barcha shartnomalar' })
  @ApiQuery({ name: 'marketId', required: true })
  findAll(
    @Query('marketId') marketId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.contractsService.findAll(marketId, currentUser);
  }

  @Post()
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Shartnoma yaratish' })
  create(@Body() dto: CreateContractDto, @CurrentUser() currentUser: User) {
    return this.contractsService.create(dto, currentUser);
  }

  @Get(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Bitta shartnoma' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.contractsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Shartnoma tahrirlash' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.contractsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: "Shartnoma o'chirish (faqat DRAFT)" })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.contractsService.remove(id, currentUser);
  }

  @Patch(':id/status')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: "Shartnoma statusini o'zgartirish" })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContractStatusDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.contractsService.updateStatus(id, dto.status, currentUser);
  }

  @Post(':id/pay')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "To'lov qabul qilish" })
  pay(
    @Param('id') id: string,
    @Body() dto: PayInstallmentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.contractsService.pay(id, dto, currentUser);
  }

  @Get(':id/installments')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Installmentlar ro'yxati" })
  getInstallments(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.contractsService.getInstallments(id, currentUser);
  }
}
