import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MarketsModule } from './modules/markets/markets.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProductPricePlansModule } from './modules/product-price-plans/product-price-plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, authConfig],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MarketsModule,
    ContractsModule,
    CustomersModule,
    SubscriptionPlansModule,
    NotificationsModule,
    ProductPricePlansModule,
  ],
})
export class AppModule {}
