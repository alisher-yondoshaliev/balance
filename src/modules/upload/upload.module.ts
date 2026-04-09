import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

/**
 * Upload Module
 *
 * Handles file uploads for various resources
 * - Category images
 * - Product images (future)
 *
 * Features:
 * - Multer configuration for image uploads
 * - Local file storage in uploads/categories/
 * - File validation (type, size)
 * - URL generation
 */
@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
