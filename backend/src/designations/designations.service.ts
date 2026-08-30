import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';

@Injectable()
export class DesignationsService {
  constructor(private prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.designation.findMany({ where: { organizationId }, orderBy: { title: 'asc' } });
  }

  async create(organizationId: string, dto: CreateDesignationDto) {
    const exists = await this.prisma.designation.findFirst({
      where: { organizationId, title: dto.title },
    });
    if (exists) throw new ConflictException('Designation already exists');
    return this.prisma.designation.create({ data: { ...dto, organizationId } });
  }

  private async findOwned(organizationId: string, id: string) {
    const designation = await this.prisma.designation.findFirst({ where: { id, organizationId } });
    if (!designation) throw new NotFoundException('Designation not found');
    return designation;
  }

  async update(organizationId: string, id: string, dto: UpdateDesignationDto) {
    await this.findOwned(organizationId, id);
    return this.prisma.designation.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOwned(organizationId, id);
    await this.prisma.designation.delete({ where: { id } });
    return { success: true };
  }
}
