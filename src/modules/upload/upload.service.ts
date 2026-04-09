import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UploadResponseDto } from './dto/upload-response.dto';

/**
 * Upload Service
 *
 * Responsibilities:
 * - Process uploaded files
 * - Generate file URLs
 * - Return upload response with user-friendly messages
 *
 * Supported MIME types: image/jpeg, image/jpg, image/png, image/webp
 * Max file size: 5MB
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  /**
   * Process category image upload
   *
   * @param file - Multer file object containing:
   *   - filename: Generated filename (timestamp-random.ext)
   *   - size: File size in bytes
   *   - mimetype: MIME type (e.g., image/jpeg)
   *
   * @returns Upload response with imageUrl accessible at /uploads/categories/filename
   * @throws BadRequestException if file is not provided
   *
   * @example
   * Response: {
   *   "message": "Rasm muvaffaqiyatli yuklandi",
   *   "imageUrl": "/uploads/categories/1712731226000-a1b2c3d4.png",
   *   "fileName": "1712731226000-a1b2c3d4.png",
   *   "fileSize": 12580
   * }
   */
  async uploadCategoryImage(file: any): Promise<UploadResponseDto> {
    if (!file) {
      this.logger.warn('Upload attempt without file');
      throw new BadRequestException('Fayl yuklani emas');
    }

    this.logger.debug(
      `File uploaded: ${file.filename}, Size: ${file.size} bytes, MIME: ${file.mimetype}`,
    );

    // Generate public URL for the uploaded file
    const imageUrl = `/uploads/categories/${file.filename}`;

    return {
      message: 'Rasm muvaffaqiyatli yuklandi',
      imageUrl,
      fileName: file.filename,
      fileSize: file.size,
    };
  }
}
