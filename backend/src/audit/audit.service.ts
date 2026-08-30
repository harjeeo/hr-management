import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface LogParams {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogParams) {
    await this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId ?? undefined,
        userId: params.userId ?? undefined,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  list(organizationId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  myLoginHistory(userId: string, limit = 20) {
    return this.prisma.auditLog.findMany({
      where: { userId, action: 'LOGIN' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
