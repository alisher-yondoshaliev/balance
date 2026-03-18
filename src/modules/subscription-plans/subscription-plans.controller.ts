import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { SubscriptionPlanResponseDto } from './dto/subscription-plan-response.dto';
import { SubscriptionPlansService } from './subscription-plans.service';

@ApiTags('Subscription Plans')
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {}

  @ApiOperation({ summary: 'Faol planlari royxati (public)' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto, isArray: true })
  @Get('active')
  listActivePlans(): Promise<SubscriptionPlanResponseDto[]> {
    return this.subscriptionPlansService.listActivePlans();
  }

  @ApiOperation({ summary: 'Barcha planlari (public)' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto, isArray: true })
  @Get()
  listPlans(): Promise<SubscriptionPlanResponseDto[]> {
    return this.subscriptionPlansService.listPlans();
  }

  @ApiOperation({ summary: 'Bitta plan' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto })
  @Get(':planId')
  getPlanById(
    @Param('planId', new ParseUUIDPipe()) planId: string,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.getPlanById(planId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Yangi plan yaratish' })
  @ApiCreatedResponse({ type: SubscriptionPlanResponseDto })
  @Roles(Role.OWNER)
  @Post()
  createPlan(
    @CurrentUser() authUser: AuthenticatedUser,
    @Body() dto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.createPlan(authUser, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Plan yangilash' })
  @ApiOkResponse({ type: SubscriptionPlanResponseDto })
  @Roles(Role.OWNER)
  @Patch(':planId')
  updatePlan(
    @CurrentUser() authUser: AuthenticatedUser,
    @Param('planId', new ParseUUIDPipe()) planId: string,
    @Body() dto: Partial<CreateSubscriptionPlanDto>,
  ): Promise<SubscriptionPlanResponseDto> {
    return this.subscriptionPlansService.updatePlan(authUser, planId, dto);
  }
}
