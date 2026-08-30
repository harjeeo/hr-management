import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeys: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-api-key'];
    if (!key || typeof key !== 'string') {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const organizationId = await this.apiKeys.findOrgByKey(key);
    if (!organizationId) throw new UnauthorizedException('Invalid or revoked API key');

    request.apiOrganizationId = organizationId;
    return true;
  }
}
