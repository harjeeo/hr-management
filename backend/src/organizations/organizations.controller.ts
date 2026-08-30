import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrgDto } from './dto/update-org.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/me')
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthUser) {
    return this.orgService.getProfile(user.organizationId!);
  }

  @Put()
  @Roles('ORG_ADMIN')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateOrgDto) {
    return this.orgService.updateProfile(user.organizationId!, dto);
  }
}
