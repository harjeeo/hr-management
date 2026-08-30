import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private service: ApiKeysService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.organizationId!);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateApiKeyDto) {
    return this.service.create(user.organizationId!, dto);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.revoke(user.organizationId!, id);
  }
}
