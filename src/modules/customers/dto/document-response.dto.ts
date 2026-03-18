import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty({ enum: DocumentType, enumName: 'DocumentType' })
  type: DocumentType;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileUrl: string;

  @ApiPropertyOptional({ nullable: true })
  fileSize: number | null;

  @ApiPropertyOptional({ nullable: true })
  mimeType: string | null;

  @ApiProperty()
  uploadedById: string;

  @ApiProperty()
  createdAt: Date;
}
