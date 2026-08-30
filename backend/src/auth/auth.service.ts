import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterOrgDto } from './dto/register-org.dto';
import { LoginDto } from './dto/login.dto';
import { AuthUser } from '../common/types/auth-user';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'org'
  );
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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
      return { org, user };
    });

    return this.signFor(result.user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signFor(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, organizationId: true, organization: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
