import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SetStatusDto } from './dto/set-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin')
export class SuperAdminController {
  constructor(private service: SuperAdminService) {}

  @Get('organizations')
  listOrganizations() {
    return this.service.listOrganizations();
  }

  @Put('organizations/:id/status')
  setStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SetStatusDto) {
    return this.service.setStatus(id, dto.status, user.userId);
  }

  @Get('stats')
  stats() {
    return this.service.platformStats();
  }
}
