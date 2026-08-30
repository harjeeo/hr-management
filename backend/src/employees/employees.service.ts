import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { AuditService } from '../audit/audit.service';

function generateTempPassword(): string {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase();
}

const includeRelations = {
  branch: true,
  department: true,
  designation: true,
  manager: { select: { id: true, fullName: true } },
};

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  list(organizationId: string, search?: string) {
    return this.prisma.employee.findMany({
      where: {
        organizationId,
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { employeeCode: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, organizationId },
      include: includeRelations,
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(organizationId: string, dto: CreateEmployeeDto) {
    const exists = await this.prisma.employee.findFirst({
      where: { organizationId, employeeCode: dto.employeeCode },
    });
    if (exists) throw new ConflictException('Employee code already in use');

    const { dateOfBirth, joiningDate, ...rest } = dto;
    return this.prisma.employee.create({
      data: {
        ...rest,
        organizationId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      },
      include: includeRelations,
    });
  }

  async update(organizationId: string, id: string, dto: UpdateEmployeeDto, actorUserId?: string) {
    const before = await this.findOne(organizationId, id);
    const { dateOfBirth, joiningDate, ...rest } = dto;
    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      },
      include: includeRelations,
    });

    if (dto.employmentStatus && dto.employmentStatus !== before.employmentStatus) {
      await this.audit.log({
        organizationId,
        userId: actorUserId,
        action: 'EMPLOYEE_STATUS_CHANGED',
        entityType: 'Employee',
        entityId: id,
        description: `${before.fullName}'s status changed from ${before.employmentStatus} to ${dto.employmentStatus}`,
      });
    }

    return updated;
  }

  async remove(organizationId: string, id: string, actorUserId?: string) {
    const employee = await this.findOne(organizationId, id);
    await this.prisma.employee.delete({ where: { id } });
    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'EMPLOYEE_DELETED',
      entityType: 'Employee',
      entityId: id,
      description: `${employee.fullName} (${employee.employeeCode}) was removed`,
    });
    return { success: true };
  }

  async findMine(userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
      include: includeRelations,
    });
    if (!employee) throw new NotFoundException('No employee profile linked to this account');
    return employee;
  }

  async createLogin(organizationId: string, id: string) {
    const employee = await this.findOne(organizationId, id);
    if (employee.userId) throw new ConflictException('Employee already has a login');

    const existingUser = await this.prisma.user.findUnique({ where: { email: employee.email } });
    if (existingUser) throw new ConflictException('A user with this email already exists');

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: employee.email,
        passwordHash,
        name: employee.fullName,
        role: 'EMPLOYEE',
        organizationId,
      },
    });

    await this.prisma.employee.update({ where: { id }, data: { userId: user.id } });

    return { email: user.email, tempPassword };
  }
}
