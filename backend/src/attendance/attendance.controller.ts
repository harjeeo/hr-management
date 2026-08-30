import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { RequestCorrectionDto, ReviewCorrectionDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Post('check-in')
  checkIn(@CurrentUser() user: AuthUser) {
    return this.service.checkIn(user.userId);
  }

  @Post('check-out')
  checkOut(@CurrentUser() user: AuthUser) {
    return this.service.checkOut(user.userId);
  }

  @Get('me/today')
  myToday(@CurrentUser() user: AuthUser) {
    return this.service.myToday(user.userId);
  }

  @Get('me/history')
  myHistory(@CurrentUser() user: AuthUser) {
    return this.service.myHistory(user.userId);
  }

  @Get()
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  orgAttendance(@CurrentUser() user: AuthUser, @Query('date') date?: string) {
    return this.service.orgAttendance(user.organizationId!, date);
  }

  @Post('corrections')
  requestCorrection(@CurrentUser() user: AuthUser, @Body() dto: RequestCorrectionDto) {
    return this.service.requestCorrection(user.userId, dto);
  }

  @Get('corrections')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  listCorrections(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.service.listCorrections(user.organizationId!, status);
  }

  @Put('corrections/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER', 'MANAGER')
  reviewCorrection(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewCorrectionDto,
  ) {
    return this.service.reviewCorrection(user.organizationId!, user.userId, id, dto);
  }
}
