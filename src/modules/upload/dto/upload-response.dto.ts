import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    example: 'Rasm muvaffaqiyatli yuklandi',
    description: 'Upload muvaffaqiyati haqidagi xabar',
  })
  message: string = '';

  @ApiProperty({
    example: '/uploads/categories/1707652200000-a1b2c3d4.png',
    description: 'Yuklangan rasm URL manzili',
  })
  imageUrl: string = '';

  @ApiProperty({
    example: '1707652200000-a1b2c3d4.png',
    description: 'Yuklangan fayl nomi',
  })
  fileName: string = '';

  @ApiProperty({
    example: 12580,
    description: 'Fayl hajmi (bytes)',
  })
  fileSize: number = 0;
}
