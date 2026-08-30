import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

const includeRelations = {
  branch: true,
  department: true,
  designation: true,
  manager: { select: { id: true, fullName: true } },
};

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

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

  async update(organizationId: string, id: string, dto: UpdateEmployeeDto) {
    await this.findOne(organizationId, id);
    const { dateOfBirth, joiningDate, ...rest } = dto;
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      },
      include: includeRelations,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.employee.delete({ where: { id } });
    return { success: true };
  }
}
