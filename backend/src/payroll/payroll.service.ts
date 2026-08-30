import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSalaryStructureDto } from './dto/salary-structure.dto';
import { ProcessPayrollDto } from './dto/payroll-run.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private audit: AuditService,
  ) {}

  // Salary structures
  async getSalaryStructure(organizationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.salaryStructure.findUnique({ where: { employeeId } });
  }

  async upsertSalaryStructure(
    organizationId: string,
    employeeId: string,
    dto: UpsertSalaryStructureDto,
    actorUserId?: string,
  ) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const result = await this.prisma.salaryStructure.upsert({
      where: { employeeId },
      create: { organizationId, employeeId, ...dto },
      update: { ...dto },
    });

    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'SALARY_STRUCTURE_CHANGED',
      entityType: 'Employee',
      entityId: employeeId,
      description: `${employee.fullName}'s salary structure was updated`,
    });

    return result;
  }

  // Payroll runs
  listRuns(organizationId: string) {
    return this.prisma.payrollRun.findMany({
      where: { organizationId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async runDetail(organizationId: string, id: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, organizationId },
      include: {
        payslips: {
          include: { employee: { select: { id: true, fullName: true, employeeCode: true } } },
          orderBy: { employee: { fullName: 'asc' } },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async process(organizationId: string, dto: ProcessPayrollDto, actorUserId?: string) {
    const existing = await this.prisma.payrollRun.findUnique({
      where: { organizationId_month_year: { organizationId, month: dto.month, year: dto.year } },
    });
    if (existing) throw new ConflictException('Payroll already processed for this month');

    const employees = await this.prisma.employee.findMany({
      where: { organizationId, employmentStatus: { in: ['ACTIVE', 'ON_LEAVE', 'PROBATION'] } },
      include: { salaryStructure: true },
    });
    const withStructure = employees.filter((e) => e.salaryStructure);
    if (withStructure.length === 0) {
      throw new BadRequestException('No employees have a salary structure configured');
    }

    const run = await this.prisma.payrollRun.create({
      data: { organizationId, month: dto.month, year: dto.year, status: 'PROCESSED', processedAt: new Date() },
    });

    await this.prisma.payslip.createMany({
      data: withStructure.map((e) => {
        const s = e.salaryStructure!;
        const grossSalary = s.basic + s.hra + s.conveyance + s.specialAllowance + s.otherAllowance;
        const totalDeductions = s.providentFund + s.professionalTax + s.otherDeductions;
        return {
          organizationId,
          payrollRunId: run.id,
          employeeId: e.id,
          basic: s.basic,
          hra: s.hra,
          conveyance: s.conveyance,
          specialAllowance: s.specialAllowance,
          otherAllowance: s.otherAllowance,
          grossSalary,
          providentFund: s.providentFund,
          professionalTax: s.professionalTax,
          otherDeductions: s.otherDeductions,
          totalDeductions,
          netSalary: grossSalary - totalDeductions,
        };
      }),
    });

    const notifyTargets = await this.prisma.employee.findMany({
      where: { id: { in: withStructure.map((e) => e.id) }, userId: { not: null } },
      select: { userId: true },
    });
    await Promise.all(
      notifyTargets.map((t) =>
        this.notifications.create(
          organizationId,
          t.userId!,
          'PAYSLIP_GENERATED',
          `Your payslip for ${dto.month}/${dto.year} is ready`,
        ),
      ),
    );

    return this.runDetail(organizationId, run.id);
  }

  async myPayslips(userId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { userId } });
    if (!employee) throw new BadRequestException('No employee profile linked to this account');
    return this.prisma.payslip.findMany({
      where: { employeeId: employee.id },
      include: { payrollRun: { select: { month: true, year: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async payslipDetail(organizationId: string, userId: string, role: string, id: string) {
    const payslip = await this.prisma.payslip.findFirst({
      where: { id, organizationId },
      include: {
        employee: { select: { id: true, fullName: true, employeeCode: true, userId: true } },
        payrollRun: true,
      },
    });
    if (!payslip) throw new NotFoundException('Payslip not found');

    const isSelf = payslip.employee.userId === userId;
    const isHr = ['ORG_ADMIN', 'HR_MANAGER'].includes(role);
    if (!isSelf && !isHr) throw new ForbiddenException('Not allowed to view this payslip');

    return payslip;
  }
}
