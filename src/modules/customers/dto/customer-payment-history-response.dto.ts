import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContractStatus,
  InstallmentStatus,
  TransactionType,
} from '@prisma/client';

export class CustomerPaymentHistoryItemDto {
  @ApiProperty()
  transactionId: string;

  @ApiProperty({ enum: TransactionType, enumName: 'TransactionType' })
  type: TransactionType;

  @ApiProperty({ example: '350000' })
  amount: string;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  contractId: string;

  @ApiProperty()
  contractNumber: string;

  @ApiProperty({ enum: ContractStatus, enumName: 'ContractStatus' })
  contractStatus: ContractStatus;

  @ApiPropertyOptional({ nullable: true })
  installmentId: string | null;

  @ApiPropertyOptional({ nullable: true })
  installmentOrderIndex: number | null;

  @ApiPropertyOptional({
    nullable: true,
    enum: InstallmentStatus,
    enumName: 'InstallmentStatus',
  })
  installmentStatus: InstallmentStatus | null;
}

export class CustomerPaymentHistoryResponseDto {
  @ApiProperty()
  customerId: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty({ example: '1450000' })
  totalAmount: string;

  @ApiProperty({ type: [CustomerPaymentHistoryItemDto] })
  items: CustomerPaymentHistoryItemDto[];
}
