import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { PublicApiController } from './public-api.controller';

@Module({
  providers: [ApiKeysService],
  controllers: [ApiKeysController, PublicApiController],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
