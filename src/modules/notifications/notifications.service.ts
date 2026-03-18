import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Notification,
  NotificationChannel,
  NotificationReason,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  ListNotificationsQueryDto,
  NotificationResponseDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotificationsByCustomer(
    customerId: string,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationResponseDto[]> {
    const where: Prisma.NotificationWhereInput = {
      customerId,
      status: query.status,
      reason: query.reason,
      createdAt: this.resolveDateRange(query.from, query.to),
    };

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return notifications.map((item) => this.toNotificationResponse(item));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification topilmadi');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // Internal service methods for creating notifications
  async createInstallmentReminder(
    customerId: string,
    contractId: string,
    installmentId: string,
    dueDays: number,
  ): Promise<void> {
    const message =
      dueDays === 0
        ? 'Installment uchun tolov muddati bugun'
        : `Installment uchun tolov muddati ${dueDays} kun qoldi`;

    await this.prisma.notification.create({
      data: {
        customerId,
        contractId,
        installmentId,
        channel: NotificationChannel.SMS,
        reason: NotificationReason.INSTALLMENT_REMINDER,
        status: NotificationStatus.PENDING,
        message,
      },
    });
  }

  async createInstallmentDueNotification(
    customerId: string,
    contractId: string,
    installmentId: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        customerId,
        contractId,
        installmentId,
        channel: NotificationChannel.SMS,
        reason: NotificationReason.INSTALLMENT_DUE,
        status: NotificationStatus.PENDING,
        message: 'Installment uchun tolov muddati kechikdi',
      },
    });
  }

  async createInstallmentOverdueNotification(
    customerId: string,
    contractId: string,
    installmentId: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        customerId,
        contractId,
        installmentId,
        channel: NotificationChannel.SMS,
        reason: NotificationReason.INSTALLMENT_OVERDUE,
        status: NotificationStatus.PENDING,
        message: 'Installment uchun tolov muddati kuchli kechikdi',
      },
    });
  }

  async createContractSignedNotification(
    customerId: string,
    contractId: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        customerId,
        contractId,
        channel: NotificationChannel.SMS,
        reason: NotificationReason.CONTRACT_SIGNED,
        status: NotificationStatus.PENDING,
        message: 'Shartnoma muvaffaqiyatli imzolandi',
      },
    });
  }

  async createContractCreatedNotification(
    customerId: string,
    contractId: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        customerId,
        contractId,
        channel: NotificationChannel.SMS,
        reason: NotificationReason.CONTRACT_CREATED,
        status: NotificationStatus.PENDING,
        message: 'Yangi shartnoma yaratildi',
      },
    });
  }

  async markAsSent(
    notificationId: string,
    error?: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: error ? NotificationStatus.FAILED : NotificationStatus.SENT,
        sentAt: new Date(),
        error: error ?? null,
      },
    });

    return this.toNotificationResponse(notification);
  }

  private toNotificationResponse(
    notification: Notification,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      customerId: notification.customerId,
      contractId: notification.contractId,
      installmentId: notification.installmentId,
      channel: notification.channel,
      reason: notification.reason,
      status: notification.status,
      message: notification.message,
      sentAt: notification.sentAt,
      error: notification.error,
      createdAt: notification.createdAt,
    };
  }

  private resolveDateRange(
    from?: string,
    to?: string,
  ): Prisma.DateTimeFilter | undefined {
    if (!from && !to) {
      return undefined;
    }

    const filter: Prisma.DateTimeFilter = {};

    if (from) {
      filter.gte = new Date(from);
    }

    if (to) {
      filter.lte = new Date(to);
    }

    return filter;
  }
}
