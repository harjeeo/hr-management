import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { LeaveService } from './leave.service';
import {
  AllocateBalanceDto,
  ApplyLeaveDto,
  CreateLeaveTypeDto,
  ReviewLeaveDto,
  UpdateLeaveTypeDto,
} from './dto/leave.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave')
export class LeaveController {
  constructor(private service: LeaveService) {}

  @Get('types')
  listTypes(@CurrentUser() user: AuthUser) {
    return this.service.listTypes(user.organizationId!);
  }

  @Post('types')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  createType(@CurrentUser() user: AuthUser, @Body() dto: CreateLeaveTypeDto) {
    return this.service.createType(user.organizationId!, dto);
  }

  @Put('types/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  updateType(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
    return this.service.updateType(user.organizationId!, id, dto);
  }

  @Delete('types/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  removeType(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeType(user.organizationId!, id);
  }

  @Post('balances')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  allocateBalance(@CurrentUser() user: AuthUser, @Body() dto: AllocateBalanceDto) {
    return this.service.allocateBalance(user.organizationId!, dto);
  }

  @Get('balances/me')
  myBalances(@CurrentUser() user: AuthUser) {
    return this.service.myBalances(user.userId);
  }

  @Get('balances/:employeeId')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  employeeBalances(@CurrentUser() user: AuthUser, @Param('employeeId') employeeId: string) {
    return this.service.employeeBalances(user.organizationId!, employeeId);
  }

  @Post('requests')
  apply(@CurrentUser() user: AuthUser, @Body() dto: ApplyLeaveDto) {
    return this.service.apply(user.userId, dto);
  }

  @Get('requests/me')
  myRequests(@CurrentUser() user: AuthUser) {
    return this.service.myRequests(user.userId);
  }

  @Post('requests/:id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.cancel(user.userId, id);
  }

  @Get('requests')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  listRequests(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.service.listRequests(user.organizationId!, status);
  }

  @Put('requests/:id/review')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  review(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReviewLeaveDto) {
    return this.service.review(user.organizationId!, id, dto);
  }
}
