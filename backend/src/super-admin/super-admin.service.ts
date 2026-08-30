import { Injectable, NotFoundException } from '@nestjs/common';
import { OrgStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async listOrganizations() {
    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { employees: true, users: true } } },
    });
    return orgs;
  }

  async setStatus(orgId: string, status: OrgStatus, actorUserId?: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    const updated = await this.prisma.organization.update({ where: { id: orgId }, data: { status } });

    await this.audit.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'ORG_STATUS_CHANGED',
      entityType: 'Organization',
      entityId: orgId,
      description: `${org.name}'s status changed from ${org.status} to ${status} by platform admin`,
    });

    return updated;
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
