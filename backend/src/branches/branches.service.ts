import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.branch.findMany({ where: { organizationId }, orderBy: { name: 'asc' } });
  }

  async create(organizationId: string, dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: { ...dto, organizationId } });
  }

  private async findOwned(organizationId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id, organizationId } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async update(organizationId: string, id: string, dto: UpdateBranchDto) {
    await this.findOwned(organizationId, id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOwned(organizationId, id);
    await this.prisma.branch.delete({ where: { id } });
    return { success: true };
  }
}
