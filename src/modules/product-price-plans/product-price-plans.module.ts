import { Module } from '@nestjs/common';
import { ProductPricePlansController } from './product-price-plans.controller';
import { ProductPricePlansService } from './product-price-plans.service';

@Module({
  controllers: [ProductPricePlansController],
  providers: [ProductPricePlansService],
  exports: [ProductPricePlansService],
})
export class ProductPricePlansModule {}
