import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrgDto } from './dto/update-org.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(organizationId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateProfile(organizationId: string, dto: UpdateOrgDto) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found');
    return this.prisma.organization.update({ where: { id: organizationId }, data: dto });
  }

  assertScoped(userOrgId: string | null, targetOrgId: string) {
    if (!userOrgId || userOrgId !== targetOrgId) {
      throw new ForbiddenException('Cross-organization access denied');
    }
  }
}
