import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function dateRange(from?: string, to?: string) {
  const fromDate = from ? new Date(from) : new Date(new Date().setDate(1));
  const toDate = to ? new Date(to) : new Date();
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);
  return { fromDate, toDate };
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async employees(organizationId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { organizationId },
      include: { branch: true, department: true, designation: true, manager: { select: { fullName: true } } },
      orderBy: { fullName: 'asc' },
    });
    return employees.map((e) => ({
      employeeCode: e.employeeCode,
      fullName: e.fullName,
      email: e.email,
      branch: e.branch?.name ?? '',
      department: e.department?.name ?? '',
      designation: e.designation?.title ?? '',
      manager: e.manager?.fullName ?? '',
      employmentType: e.employmentType,
      employmentStatus: e.employmentStatus,
      joiningDate: e.joiningDate?.toISOString().slice(0, 10) ?? '',
    }));
  }

  async attendance(organizationId: string, from?: string, to?: string) {
    const { fromDate, toDate } = dateRange(from, to);
    const records = await this.prisma.attendance.findMany({
      where: { organizationId, date: { gte: fromDate, lte: toDate } },
      include: { employee: { select: { fullName: true, employeeCode: true } } },
      orderBy: { date: 'asc' },
    });
    return records.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      employeeCode: r.employee.employeeCode,
      fullName: r.employee.fullName,
      status: r.status,
      checkIn: r.checkIn ? r.checkIn.toISOString() : '',
      checkOut: r.checkOut ? r.checkOut.toISOString() : '',
    }));
  }

  async leave(organizationId: string, from?: string, to?: string) {
    const { fromDate, toDate } = dateRange(from, to);
    const records = await this.prisma.leaveRequest.findMany({
      where: { organizationId, startDate: { gte: fromDate, lte: toDate } },
      include: { employee: { select: { fullName: true, employeeCode: true } }, leaveType: true },
      orderBy: { startDate: 'asc' },
    });
    return records.map((r) => ({
      employeeCode: r.employee.employeeCode,
      fullName: r.employee.fullName,
      leaveType: r.leaveType.name,
      startDate: r.startDate.toISOString().slice(0, 10),
      endDate: r.endDate.toISOString().slice(0, 10),
      days: r.days,
      status: r.status,
    }));
  }

  async payroll(organizationId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    const run = await this.prisma.payrollRun.findUnique({
      where: { organizationId_month_year: { organizationId, month: m, year: y } },
      include: { payslips: { include: { employee: { select: { fullName: true, employeeCode: true } } } } },
    });
    if (!run) return [];
    return run.payslips.map((p) => ({
      employeeCode: p.employee.employeeCode,
      fullName: p.employee.fullName,
      grossSalary: p.grossSalary,
      totalDeductions: p.totalDeductions,
      netSalary: p.netSalary,
    }));
  }
}
