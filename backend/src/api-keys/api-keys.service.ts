import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, dto: CreateApiKeyDto) {
    const rawKey = `hrms_${randomBytes(24).toString('hex')}`;
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    const apiKey = await this.prisma.apiKey.create({
      data: { organizationId, name: dto.name, keyHash, keyPrefix },
    });

    // rawKey is only ever returned once, at creation time
    return { id: apiKey.id, name: apiKey.name, key: rawKey, keyPrefix };
  }

  async revoke(organizationId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, organizationId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async findOrgByKey(rawKey: string): Promise<string | null> {
    const keyHash = hashKey(rawKey);
    const apiKey = await this.prisma.apiKey.findFirst({ where: { keyHash, revokedAt: null } });
    if (!apiKey) return null;
    await this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    return apiKey.organizationId;
  }
}
