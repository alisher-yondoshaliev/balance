import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  ListNotificationsQueryDto,
  NotificationResponseDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'Customerga oid notifikatsiyalar' })
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  @Get('customer/:customerId')
  getNotificationsByCustomer(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('customerId', new ParseUUIDPipe()) customerId: string,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.getNotificationsByCustomer(
      customerId,
      query,
    );
  }

  @ApiOperation({ summary: "Notifikatsiyani o'chirish" })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @Delete(':notificationId')
  async deleteNotification(
    @Param('notificationId', new ParseUUIDPipe()) notificationId: string,
  ): Promise<{ message: string }> {
    await this.notificationsService.deleteNotification(notificationId);
    return Promise.resolve({ message: "Notifikatsiya o'chirildi" });
  }
}
