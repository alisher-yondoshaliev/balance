import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PaySubscriptionDto } from './dto/pay-subscription.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  // ── Ochiq endpointlar ──────────────────────────────
  @Get('plans')
  @ApiOperation({ summary: 'Barcha planlar' })
  findAllPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Bitta plan' })
  findOnePlan(@Param('id') id: string) {
    return this.subscriptionsService.findOnePlan(id);
  }

  // ── SUPERADMIN endpointlari ────────────────────────
  @Post('plans')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Plan yaratish (SuperAdmin)' })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Patch('plans/:id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Plan tahrirlash (SuperAdmin)' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Plan o'chirish (SuperAdmin)" })
  removePlan(@Param('id') id: string) {
    return this.subscriptionsService.removePlan(id);
  }

  // ── OWNER endpointlari ─────────────────────────────
  @Post('pay')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Obuna to'lash (Owner)" })
  pay(@Body() dto: PaySubscriptionDto, @CurrentUser() currentUser: User) {
    return this.subscriptionsService.pay(dto, currentUser);
  }

  @Get('current')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Joriy obuna (Owner)' })
  getCurrent(@CurrentUser() currentUser: User) {
    return this.subscriptionsService.getCurrent(currentUser);
  }

  @Get('history')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "To'lov tarixi (Owner)" })
  getHistory(@CurrentUser() currentUser: User) {
    return this.subscriptionsService.getHistory(currentUser);
  }
}
