import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Exception filter for Multer file upload errors
 * Converts multer errors into user-friendly responses
 */
@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle multer-specific errors
    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(400).json({
        statusCode: 400,
        message: 'Fayl hajmi juda katta (maksimum 5MB)',
        error: 'Bad Request',
      });
      return;
    }

    if (exception.code === 'LIMIT_PART_COUNT') {
      response.status(400).json({
        statusCode: 400,
        message: "Juda ko'p fayl",
        error: 'Bad Request',
      });
      return;
    }

    if (exception.message && exception.message.includes('rasm')) {
      response.status(400).json({
        statusCode: 400,
        message: exception.message,
        error: 'Bad Request',
      });
      return;
    }

    // Default error
    response.status(400).json({
      statusCode: 400,
      message: 'Fayl yuklashda xatolik yuz berdi',
      error: 'Bad Request',
    });
  }
}
