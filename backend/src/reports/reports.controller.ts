import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { toCsv } from './csv.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

function respond(res: Response, filename: string, rows: Record<string, unknown>[], format?: string) {
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(toCsv(rows));
    return;
  }
  res.json(rows);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN', 'HR_MANAGER')
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('employees')
  async employees(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
    @Query('format') format?: string,
  ) {
    const rows = await this.service.employees(user.organizationId!);
    respond(res, 'employees.csv', rows, format);
  }

  @Get('attendance')
  async attendance(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format?: string,
  ) {
    const rows = await this.service.attendance(user.organizationId!, from, to);
    respond(res, 'attendance.csv', rows, format);
  }

  @Get('leave')
  async leave(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format?: string,
  ) {
    const rows = await this.service.leave(user.organizationId!, from, to);
    respond(res, 'leave.csv', rows, format);
  }

  @Get('payroll')
  async payroll(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('format') format?: string,
  ) {
    const rows = await this.service.payroll(
      user.organizationId!,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
    respond(res, 'payroll.csv', rows, format);
  }
}
