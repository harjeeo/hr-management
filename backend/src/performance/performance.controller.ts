import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import {
  CreateCycleDto,
  CreateGoalDto,
  ManagerReviewDto,
  SelfReviewDto,
  UpdateCycleDto,
  UpdateGoalDto,
} from './dto/performance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private service: PerformanceService) {}

  @Get('cycles')
  listCycles(@CurrentUser() user: AuthUser) {
    return this.service.listCycles(user.organizationId!);
  }

  @Post('cycles')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  createCycle(@CurrentUser() user: AuthUser, @Body() dto: CreateCycleDto) {
    return this.service.createCycle(user.organizationId!, dto);
  }

  @Put('cycles/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  updateCycle(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCycleDto) {
    return this.service.updateCycle(user.organizationId!, id, dto);
  }

  @Get('cycles/:cycleId/goals')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  listGoals(
    @CurrentUser() user: AuthUser,
    @Param('cycleId') cycleId: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.service.listGoals(user.organizationId!, cycleId, employeeId);
  }

  @Get('cycles/:cycleId/goals/me')
  myGoals(@CurrentUser() user: AuthUser, @Param('cycleId') cycleId: string) {
    return this.service.myGoals(user.userId, cycleId);
  }

  @Post('cycles/:cycleId/goals')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  createGoal(@CurrentUser() user: AuthUser, @Param('cycleId') cycleId: string, @Body() dto: CreateGoalDto) {
    return this.service.createGoal(user.organizationId!, cycleId, dto);
  }

  @Put('goals/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  updateGoal(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.service.updateGoal(user.organizationId!, id, dto);
  }

  @Get('cycles/:cycleId/reviews')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  listReviews(@CurrentUser() user: AuthUser, @Param('cycleId') cycleId: string) {
    return this.service.listReviews(user.organizationId!, cycleId);
  }

  @Get('cycles/:cycleId/reviews/me')
  myReview(@CurrentUser() user: AuthUser, @Param('cycleId') cycleId: string) {
    return this.service.myReview(user.userId, cycleId);
  }

  @Post('cycles/:cycleId/reviews/self')
  submitSelfReview(@CurrentUser() user: AuthUser, @Param('cycleId') cycleId: string, @Body() dto: SelfReviewDto) {
    return this.service.submitSelfReview(user.userId, cycleId, dto);
  }

  @Post('cycles/:cycleId/reviews/:employeeId/manager')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  submitManagerReview(
    @CurrentUser() user: AuthUser,
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: ManagerReviewDto,
  ) {
    return this.service.submitManagerReview(user.organizationId!, cycleId, employeeId, dto);
  }
}
