import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { ContractsService } from './contracts.service';
import { ActivateContractDto } from './dto/activate-contract.dto';
import { ContractResponseDto } from './dto/contract-response.dto';
import { ContractReportQueryDto } from './dto/contract-report.query.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { IssueSignTokenDto } from './dto/issue-sign-token.dto';
import { ListContractsQueryDto } from './dto/list-contracts.query.dto';
import { PayContractDto } from './dto/pay-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @ApiOperation({ summary: 'Yangi contract draft yaratish' })
  @ApiCreatedResponse({ type: ContractResponseDto })
  @Roles(Role.ADMIN, Role.SELLER)
  @Post()
  createDraftContract(
    @CurrentUser() authUser: AuthenticatedUser,
    @Body() dto: CreateContractDto,
  ): Promise<ContractResponseDto> {
    return this.contractsService.createDraftContract(authUser, dto);
  }

  @ApiOperation({ summary: 'Contractlar royxatini olish' })
  @ApiOkResponse({ type: ContractResponseDto, isArray: true })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @Get()
  listContracts(
    @CurrentUser() authUser: AuthenticatedUser,
    @Query() query: ListContractsQueryDto,
  ): Promise<ContractResponseDto[]> {
    return this.contractsService.listContracts(authUser, query);
  }

  @ApiOperation({ summary: 'Bitta contractni olish' })
  @ApiOkResponse({ type: ContractResponseDto })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @Get(':contractId')
  getContractById(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
  ): Promise<ContractResponseDto> {
    return this.contractsService.getContractById(authUser, contractId);
  }

  @ApiOperation({ summary: 'Contractni aktiv holatga otkazish' })
  @ApiOkResponse({ type: ContractResponseDto })
  @Roles(Role.ADMIN, Role.SELLER)
  @Post(':contractId/activate')
  activateContract(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @Body() dto: ActivateContractDto,
  ): Promise<ContractResponseDto> {
    return this.contractsService.activateContract(authUser, contractId, dto);
  }

  @ApiOperation({ summary: 'Contract uchun tolov qabul qilish' })
  @ApiOkResponse({ type: ContractResponseDto })
  @Roles(Role.ADMIN, Role.SELLER)
  @Post(':contractId/payments')
  payContract(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @Body() dto: PayContractDto,
  ): Promise<ContractResponseDto> {
    return this.contractsService.payContract(authUser, contractId, dto);
  }

  @ApiOperation({ summary: 'Contract uchun imzolash tokenini yaratish' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        contractId: { type: 'string' },
        signToken: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Roles(Role.ADMIN, Role.SELLER)
  @Post(':contractId/issue-sign-token')
  issueSignToken(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('contractId', new ParseUUIDPipe()) contractId: string,
    @Body() dto: IssueSignTokenDto,
  ): Promise<{ contractId: string; signToken: string; expiresAt: Date }> {
    return this.contractsService.issueSignToken(authUser, contractId, dto);
  }

  @ApiOperation({ summary: "Sign token bo'yicha contractni olish (public)" })
  @ApiOkResponse({ type: ContractResponseDto })
  @Get('public/sign/:token')
  getContractBySignToken(
    @Param('token') token: string,
  ): Promise<ContractResponseDto> {
    return this.contractsService.getContractBySignToken(token);
  }

  @ApiOperation({ summary: "Sign token bo'yicha contractni imzolash (public)" })
  @ApiOkResponse({ type: ContractResponseDto })
  @Post('public/sign/:token')
  signContractByToken(
    @Param('token') token: string,
    @Body() dto: SignContractDto,
  ): Promise<ContractResponseDto> {
    return this.contractsService.signContractByToken(token, dto);
  }

  @ApiOperation({ summary: 'Contract/payment hisobotlari' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        totalTransactions: { type: 'number' },
        totalAmount: { type: 'string' },
        groupedByType: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        byDay: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              amount: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @Get('reports/payments')
  getPaymentReport(
    @CurrentUser() authUser: AuthenticatedUser,
    @Query() query: ContractReportQueryDto,
  ): Promise<{
    totalTransactions: number;
    totalAmount: string;
    groupedByType: Record<string, string>;
    byDay: Array<{ date: string; amount: string }>;
  }> {
    return this.contractsService.getPaymentReport(authUser, query);
  }

  @ApiOperation({ summary: "Overdue statuslarni qo'lda sync qilish" })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        updatedInstallments: { type: 'number' },
        updatedContracts: { type: 'number' },
      },
    },
  })
  @Roles(Role.OWNER, Role.ADMIN)
  @Post('sync-overdue')
  syncOverdueStatuses(): Promise<{
    updatedInstallments: number;
    updatedContracts: number;
  }> {
    return this.contractsService.syncOverdueStatuses();
  }
}
