import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContractStatus,
  InstallmentStatus,
  TransactionType,
} from '@prisma/client';

export class ContractCustomerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;
}

export class ContractStaffDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  role: string;
}

export class ContractItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  pricePlanId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ example: '12999000' })
  basePrice: string;

  @ApiProperty({ example: '20' })
  interestRate: string;

  @ApiProperty({ example: '15598800' })
  totalPrice: string;

  @ApiProperty({ example: '1299900' })
  monthlyPrice: string;
}

export class InstallmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty({ example: '1299900' })
  amount: string;

  @ApiProperty({ example: '649950' })
  paidAmount: string;

  @ApiProperty({ enum: InstallmentStatus, enumName: 'InstallmentStatus' })
  status: InstallmentStatus;

  @ApiPropertyOptional({ nullable: true })
  paidAt: Date | null;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  installmentId: string | null;

  @ApiProperty({ enum: TransactionType, enumName: 'TransactionType' })
  type: TransactionType;

  @ApiProperty({ example: '500000' })
  amount: string;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class ContractResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  contractNumber: string;

  @ApiProperty()
  marketId: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  staffId: string;

  @ApiProperty()
  termMonths: number;

  @ApiProperty({ example: '500000' })
  downPayment: string;

  @ApiProperty({ example: '15598800' })
  totalAmount: string;

  @ApiProperty({ example: '1299900' })
  monthlyAmount: string;

  @ApiProperty({ example: '500000' })
  paidAmount: string;

  @ApiProperty({ example: '15098800' })
  remainAmount: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ enum: ContractStatus, enumName: 'ContractStatus' })
  status: ContractStatus;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;

  @ApiPropertyOptional({ nullable: true })
  signToken: string | null;

  @ApiPropertyOptional({ nullable: true })
  signTokenExpiry: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: ContractCustomerDto })
  customer: ContractCustomerDto;

  @ApiProperty({ type: ContractStaffDto })
  staff: ContractStaffDto;

  @ApiProperty({ type: [ContractItemResponseDto] })
  items: ContractItemResponseDto[];

  @ApiProperty({ type: [InstallmentResponseDto] })
  installments: InstallmentResponseDto[];

  @ApiProperty({ type: [TransactionResponseDto] })
  transactions: TransactionResponseDto[];
}
