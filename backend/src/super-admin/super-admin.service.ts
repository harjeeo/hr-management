import { Injectable, NotFoundException } from '@nestjs/common';
import { OrgStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async listOrganizations() {
    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { employees: true, users: true } } },
    });
    return orgs;
  }

  async setStatus(orgId: string, status: OrgStatus) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return this.prisma.organization.update({ where: { id: orgId }, data: { status } });
  }

  async platformStats() {
    const [totalOrgs, activeOrgs, trialOrgs, suspendedOrgs, totalEmployees] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { status: 'ACTIVE' } }),
      this.prisma.organization.count({ where: { status: 'TRIAL' } }),
      this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.employee.count(),
    ]);
    return { totalOrgs, activeOrgs, trialOrgs, suspendedOrgs, totalEmployees };
  }
}
