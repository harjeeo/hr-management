import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private service: AuditService) {}

  @Get()
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.organizationId!);
  }

  @Get('me/logins')
  myLogins(@CurrentUser() user: AuthUser) {
    return this.service.myLoginHistory(user.userId);
  }
}
