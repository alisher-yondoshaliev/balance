import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { getMulterCategoryImageConfig } from './multer.config';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { MulterExceptionFilter } from './filters/multer-exception.filter';

/**
 * Upload Controller
 *
 * Handles file uploads for various resources
 * - Category images
 * - Product images (future)
 *
 * Field name: 'image' (in multipart/form-data)
 * Endpoint: POST /api/uploads/category-image
 */
@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@UseFilters(MulterExceptionFilter)
@Controller('uploads')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  /**
   * Upload category image
   *
   * @param file - Image file from multipart form
   * @returns Upload response with imageUrl
   *
   * @example
   * POST /uploads/category-image
   * Content-Type: multipart/form-data
   * Authorization: Bearer TOKEN
   * Body: form-data with 'image' field
   */
  @Post('category-image')
  @UseInterceptors(FileInterceptor('file', getMulterCategoryImageConfig()))
  @ApiOperation({
    summary: 'Kategoriya rasmi yuklash',
    description: 'Kategoriya uchun rasm faylini yuklaydi',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Kategoriya rasmi (jpg, png, webp, max 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Rasm muvaffaqiyatli yuklandi',
    type: UploadResponseDto,
    example: {
      message: 'Rasm muvaffaqiyatli yuklandi',
      imageUrl: '/uploads/categories/1707652200000-a1b2c3d4.png',
      fileName: '1707652200000-a1b2c3d4.png',
      fileSize: 12580,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Fayl yuklash xatosi',
    example: {
      statusCode: 400,
      message: 'Faqat rasm fayllarini yuklash mumkin (jpg, png, webp)',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Autentifikatsiya talab qilinadi',
  })
  async uploadCategoryImage(
    @UploadedFile() file: any,
  ): Promise<UploadResponseDto> {
    // Multer will handle file validation
    // If file is invalid, FileInterceptor will throw an error
    if (!file) {
      throw new BadRequestException('Fayl yuklandi emas');
    }

    return this.uploadService.uploadCategoryImage(file);
  }
}
