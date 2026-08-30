import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AllocateBalanceDto,
  ApplyLeaveDto,
  CreateLeaveTypeDto,
  ReviewLeaveDto,
  UpdateLeaveTypeDto,
} from './dto/leave.dto';

function daysBetweenInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

@Injectable()
export class LeaveService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private async myEmployee(userId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { userId } });
    if (!employee) throw new BadRequestException('No employee profile linked to this account');
    return employee;
  }

  // Leave types
  listTypes(organizationId: string) {
    return this.prisma.leaveType.findMany({ where: { organizationId }, orderBy: { name: 'asc' } });
  }

  async createType(organizationId: string, dto: CreateLeaveTypeDto) {
    const exists = await this.prisma.leaveType.findFirst({ where: { organizationId, name: dto.name } });
    if (exists) throw new ConflictException('Leave type already exists');
    return this.prisma.leaveType.create({ data: { ...dto, organizationId } });
  }

  async updateType(organizationId: string, id: string, dto: UpdateLeaveTypeDto) {
    const type = await this.prisma.leaveType.findFirst({ where: { id, organizationId } });
    if (!type) throw new NotFoundException('Leave type not found');
    return this.prisma.leaveType.update({ where: { id }, data: dto });
  }

  async removeType(organizationId: string, id: string) {
    const type = await this.prisma.leaveType.findFirst({ where: { id, organizationId } });
    if (!type) throw new NotFoundException('Leave type not found');
    await this.prisma.leaveType.delete({ where: { id } });
    return { success: true };
  }

  // Balances
  async allocateBalance(organizationId: string, dto: AllocateBalanceDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: dto.leaveTypeId, organizationId },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    return this.prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: dto.employeeId,
          leaveTypeId: dto.leaveTypeId,
          year: dto.year,
        },
      },
      create: {
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        year: dto.year,
        allocated: dto.allocated,
      },
      update: { allocated: dto.allocated },
    });
  }

  async myBalances(userId: string) {
    const employee = await this.myEmployee(userId);
    const year = new Date().getFullYear();
    return this.prisma.leaveBalance.findMany({
      where: { employeeId: employee.id, year },
      include: { leaveType: true },
    });
  }

  employeeBalances(organizationId: string, employeeId: string) {
    const year = new Date().getFullYear();
    return this.prisma.leaveBalance.findMany({
      where: { employeeId, year, employee: { organizationId } },
      include: { leaveType: true },
    });
  }

  // Requests
  async apply(userId: string, dto: ApplyLeaveDto) {
    const employee = await this.myEmployee(userId);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    if (endDate < startDate) throw new BadRequestException('End date must be after start date');

    const days = daysBetweenInclusive(startDate, endDate);
    const year = startDate.getFullYear();

    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: { employeeId: employee.id, leaveTypeId: dto.leaveTypeId, year },
      },
    });
    if (balance && balance.allocated - balance.used < days) {
      throw new BadRequestException('Insufficient leave balance');
    }

    const request = await this.prisma.leaveRequest.create({
      data: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        leaveTypeId: dto.leaveTypeId,
        startDate,
        endDate,
        days,
        reason: dto.reason,
      },
      include: { leaveType: true },
    });

    const approverIds = new Set<string>();
    if (employee.managerId) {
      const manager = await this.prisma.employee.findUnique({ where: { id: employee.managerId } });
      if (manager?.userId) approverIds.add(manager.userId);
    }
    const admins = await this.prisma.user.findMany({
      where: { organizationId: employee.organizationId, role: { in: ['ORG_ADMIN', 'HR_MANAGER'] } },
    });
    admins.forEach((a) => approverIds.add(a.id));

    await Promise.all(
      [...approverIds].map((uid) =>
        this.notifications.create(
          employee.organizationId,
          uid,
          'LEAVE_REQUESTED',
          `${employee.fullName} applied for ${request.leaveType.name} (${days} day${days > 1 ? 's' : ''})`,
        ),
      ),
    );

    return request;
  }

  async myRequests(userId: string) {
    const employee = await this.myEmployee(userId);
    return this.prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(userId: string, id: string) {
    const employee = await this.myEmployee(userId);
    const request = await this.prisma.leaveRequest.findFirst({ where: { id, employeeId: employee.id } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Only pending requests can be cancelled');
    return this.prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  listRequests(organizationId: string, status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: { organizationId, ...(status ? { status: status as never } : {}) },
      include: {
        leaveType: true,
        employee: { select: { id: true, fullName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(organizationId: string, id: string, dto: ReviewLeaveDto) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id, organizationId },
      include: { employee: true },
    });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Already reviewed');

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: dto.status, reviewNote: dto.reviewNote },
    });

    if (dto.status === 'APPROVED') {
      const year = request.startDate.getFullYear();
      await this.prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        },
        create: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year,
          allocated: 0,
          used: request.days,
        },
        update: { used: { increment: request.days } },
      });
    }

    if (request.employee.userId) {
      await this.notifications.create(
        organizationId,
        request.employee.userId,
        'LEAVE_REVIEWED',
        `Your leave request (${request.days} day${request.days > 1 ? 's' : ''}) was ${dto.status.toLowerCase()}`,
      );
    }

    return updated;
  }
}
