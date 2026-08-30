import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { ChangePlanDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BillingController {
  constructor(private service: BillingService) {}

  @Get('plans')
  listPlans() {
    return this.service.listPlans();
  }

  @Get('subscriptions/me')
  mySubscription(@CurrentUser() user: AuthUser) {
    return this.service.mySubscription(user.organizationId!);
  }

  @Post('subscriptions/me/change-plan')
  @Roles('ORG_ADMIN')
  changePlan(@CurrentUser() user: AuthUser, @Body() dto: ChangePlanDto) {
    return this.service.changePlan(user.organizationId!, dto);
  }

  @Get('super-admin/plans')
  @Roles('SUPER_ADMIN')
  listAllPlans() {
    return this.service.listAllPlans();
  }

  @Post('super-admin/plans')
  @Roles('SUPER_ADMIN')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.service.createPlan(dto);
  }

  @Put('super-admin/plans/:id')
  @Roles('SUPER_ADMIN')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.service.updatePlan(id, dto);
  }

  @Get('super-admin/subscriptions')
  @Roles('SUPER_ADMIN')
  listSubscriptions() {
    return this.service.listSubscriptions();
  }

  @Post('super-admin/invoices/:id/mark-paid')
  @Roles('SUPER_ADMIN')
  markInvoicePaid(@Param('id') id: string) {
    return this.service.markInvoicePaid(id);
  }

  @Get('super-admin/billing-stats')
  @Roles('SUPER_ADMIN')
  billingStats() {
    return this.service.billingStats();
  }
}
