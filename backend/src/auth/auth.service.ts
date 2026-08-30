import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterOrgDto } from './dto/register-org.dto';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from '../common/types/auth-user';
import { AuditService } from '../audit/audit.service';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'org'
  );
}

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
  ) {}

  private async signFor(user: { id: string; email: string; role: string; organizationId: string | null }) {
    const payload: AuthUser = {
      userId: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
      organizationId: user.organizationId,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: payload,
    };
  }

  async registerOrg(dto: RegisterOrgDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const baseSlug = slugify(dto.companyName);
    let slug = baseSlug;
    let suffix = 1;
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: dto.companyName, slug },
      });
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.ownerName,
          role: 'ORG_ADMIN',
          organizationId: org.id,
        },
      });

      const freePlan = await tx.plan.upsert({
        where: { name: 'Free' },
        update: {},
        create: { name: 'Free', price: 0, employeeLimit: 5, features: ['Basic employee management', 'Attendance', 'Leave'] },
      });
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      await tx.subscription.create({
        data: { organizationId: org.id, planId: freePlan.id, status: 'TRIAL', trialEndsAt },
      });

      return { org, user };
    });

    return this.signFor(result.user);
  }

  async login(dto: LoginDto, meta: RequestMeta = {}) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.twoFactorEnabled) {
      if (!dto.totpCode) {
        return { requires2FA: true };
      }
      const validCode = authenticator.check(dto.totpCode, user.twoFactorSecret!);
      if (!validCode) throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.audit.log({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      description: `${user.email} logged in`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return this.signFor(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        organization: true,
        twoFactorEnabled: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });

    const otpauth = authenticator.keyuri(user.email, 'HR Management', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    return { secret, qrCodeDataUrl };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new BadRequestException('Run 2FA setup first');

    const valid = authenticator.check(code, user.twoFactorSecret);
    if (!valid) throw new BadRequestException('Invalid code');

    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return { success: true };
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const valid = authenticator.check(code, user.twoFactorSecret);
    if (!valid) throw new BadRequestException('Invalid code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { success: true };
  }
}
