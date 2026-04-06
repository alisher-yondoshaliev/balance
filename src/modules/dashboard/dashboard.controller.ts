import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Umumiy statistika' })
  @ApiQuery({ name: 'marketId', required: true })
  getSummary(@Query('marketId') marketId: string, @CurrentUser() user: User) {
    return this.dashboardService.getSummary(marketId, user);
  }

  @Get('revenue')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Oylik daromad (12 oy)' })
  @ApiQuery({ name: 'marketId', required: true })
  getRevenue(@Query('marketId') marketId: string, @CurrentUser() user: User) {
    return this.dashboardService.getRevenue(marketId, user);
  }

  @Get('top-debtors')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: "Eng ko'p qarzdorlar" })
  @ApiQuery({ name: 'marketId', required: true })
  getTopDebtors(
    @Query('marketId') marketId: string,
    @CurrentUser() user: User,
  ) {
    return this.dashboardService.getTopDebtors(marketId, user);
  }

  @Get('overdue')
  @Roles(Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Muddati o'tgan to'lovlar" })
  @ApiQuery({ name: 'marketId', required: true })
  getOverdueInstallments(
    @Query('marketId') marketId: string,
    @CurrentUser() user: User,
  ) {
    return this.dashboardService.getOverdueInstallments(marketId, user);
  }
}
