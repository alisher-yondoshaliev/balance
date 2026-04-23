import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

/**
 * Logs the raw request body for contract endpoints
 * This captures data BEFORE ValidationPipe transforms it
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLoggingInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const body = request.body as any;

    // Only log contract endpoints
    if (url.includes('/api/contracts')) {
      this.logger.log(
        `[${method} ${url}] ===== RAW REQUEST BODY (BEFORE PIPE) =====`,
      );
      this.logger.log(`Raw body: ${JSON.stringify(body, null, 2)}`);

      // Log specific fields we care about
      if (body && typeof body === 'object') {
        this.logger.log(
          `Field analysis: ${JSON.stringify(
            {
              hasMonths: 'months' in body,
              hasTermMonths: 'termMonths' in body,
              months: body.months,
              termMonths: body.termMonths,
              downPayment: body.downPayment,
              customerId: body.customerId,
              productId: body.productId,
            },
            null,
            2,
          )}`,
        );
      }
    }

    return next.handle();
  }
}
