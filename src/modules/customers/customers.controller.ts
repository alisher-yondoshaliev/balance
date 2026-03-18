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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CustomerPaymentHistoryResponseDto } from './dto/customer-payment-history-response.dto';
import { CustomerPaymentHistoryQueryDto } from './dto/customer-payment-history.query.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { ListCustomersQueryDto } from './dto/list-customers.query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: 'Yangi customer yaratish' })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  @Roles(Role.OWNER, Role.ADMIN, Role.SELLER)
  @Post()
  createCustomer(
    @CurrentUser() authUser: AuthenticatedUser,
    @Body() dto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.createCustomer(authUser, dto);
  }

  @ApiOperation({ summary: 'Customerlar royxati' })
  @ApiOkResponse({ type: CustomerResponseDto, isArray: true })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @Get()
  listCustomers(
    @CurrentUser() authUser: AuthenticatedUser,
    @Query() query: ListCustomersQueryDto,
  ): Promise<CustomerResponseDto[]> {
    return this.customersService.listCustomers(authUser, query);
  }

  @ApiOperation({ summary: 'Bitta customerni olish' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @Get(':customerId')
  getCustomerById(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
  ): Promise<CustomerResponseDto> {
    return this.customersService.getCustomerById(authUser, customerId);
  }

  @ApiOperation({ summary: 'Customerni yangilash' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':customerId')
  updateCustomer(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.updateCustomer(authUser, customerId, dto);
  }

  @ApiOperation({ summary: 'Customer uchun hujjat metadata yaratish' })
  @ApiCreatedResponse({ type: DocumentResponseDto })
  @Roles(Role.OWNER, Role.ADMIN, Role.SELLER)
  @Post(':customerId/documents')
  createDocument(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Body() dto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.customersService.createDocument(authUser, customerId, dto);
  }

  @ApiOperation({ summary: 'Customer hujjatlari royxati' })
  @ApiOkResponse({ type: DocumentResponseDto, isArray: true })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @Get(':customerId/documents')
  listDocuments(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
  ): Promise<DocumentResponseDto[]> {
    return this.customersService.listDocuments(authUser, customerId);
  }

  @ApiOperation({ summary: 'Customer payment history' })
  @ApiOkResponse({ type: CustomerPaymentHistoryResponseDto })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER)
  @Get(':customerId/payment-history')
  getCustomerPaymentHistory(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Query() query: CustomerPaymentHistoryQueryDto,
  ): Promise<CustomerPaymentHistoryResponseDto> {
    return this.customersService.getCustomerPaymentHistory(
      authUser,
      customerId,
      query,
    );
  }
}
