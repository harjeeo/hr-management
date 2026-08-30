import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { UpsertSalaryStructureDto } from './dto/salary-structure.dto';
import { ProcessPayrollDto } from './dto/payroll-run.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private service: PayrollService) {}

  @Get('salary-structures/:employeeId')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  getSalaryStructure(@CurrentUser() user: AuthUser, @Param('employeeId') employeeId: string) {
    return this.service.getSalaryStructure(user.organizationId!, employeeId);
  }

  @Put('salary-structures/:employeeId')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  upsertSalaryStructure(
    @CurrentUser() user: AuthUser,
    @Param('employeeId') employeeId: string,
    @Body() dto: UpsertSalaryStructureDto,
  ) {
    return this.service.upsertSalaryStructure(user.organizationId!, employeeId, dto, user.userId);
  }

  @Get('runs')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  listRuns(@CurrentUser() user: AuthUser) {
    return this.service.listRuns(user.organizationId!);
  }

  @Get('runs/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  runDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.runDetail(user.organizationId!, id);
  }

  @Post('runs')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  process(@CurrentUser() user: AuthUser, @Body() dto: ProcessPayrollDto) {
    return this.service.process(user.organizationId!, dto, user.userId);
  }

  @Get('payslips/me')
  myPayslips(@CurrentUser() user: AuthUser) {
    return this.service.myPayslips(user.userId);
  }

  @Get('payslips/:id')
  payslipDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.payslipDetail(user.organizationId!, user.userId, user.role, id);
  }
}
