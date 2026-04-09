import { extname } from 'path';
import * as crypto from 'crypto';

/**
 * Multer configuration for category image uploads
 *
 * Field name: 'file' (must match FileInterceptor parameter)
 * Storage: ./uploads/categories/
 * Filename: {timestamp}-{random}.{ext}
 * Allowed MIME types:
 *   - image/jpeg
 *   - image/jpg
 *   - image/png
 *   - image/webp
 * Max size: 5MB (5242880 bytes)
 */

export function getMulterCategoryImageConfig(): any {
  const multer = require('multer');

  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  return {
    storage: multer.diskStorage({
      destination: './uploads/categories',
      filename: (req: any, file: any, cb: any) => {
        const randomSuffix = crypto.randomBytes(8).toString('hex');
        const ext = extname(file.originalname).toLowerCase();
        const filename = `${Date.now()}-${randomSuffix}${ext}`;
        cb(null, filename);
      },
    }),

    // File filter for MIME type validation
    fileFilter: (req: any, file: any, cb: any) => {
      // Check MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        const err = new Error(
          `Faqat rasm fayllari mumkin (jpg, png, webp). Yuborilgan: ${file.mimetype}`,
        );
        (err as any).code = 'INVALID_FILE_TYPE';
        return cb(err);
      }

      // Check file extension as backup
      const ext = extname(file.originalname).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      if (!validExtensions.includes(ext)) {
        const err = new Error(
          `Fayl nomining oxiri noto'g'ri. Ruxsat etilgan: jpg, jpeg, png, webp`,
        );
        (err as any).code = 'INVALID_FILE_EXTENSION';
        return cb(err);
      }

      cb(null, true);
    },

    // File size limit (5MB)
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  };
}
