import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.department.findMany({ where: { organizationId }, orderBy: { name: 'asc' } });
  }

  async create(organizationId: string, dto: CreateDepartmentDto) {
    const exists = await this.prisma.department.findFirst({
      where: { organizationId, name: dto.name },
    });
    if (exists) throw new ConflictException('Department already exists');
    return this.prisma.department.create({ data: { ...dto, organizationId } });
  }

  private async findOwned(organizationId: string, id: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, organizationId } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(organizationId: string, id: string, dto: UpdateDepartmentDto) {
    await this.findOwned(organizationId, id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOwned(organizationId, id);
    await this.prisma.department.delete({ where: { id } });
    return { success: true };
  }
}
