import { IsIn } from 'class-validator';
import { OrgStatus } from '@prisma/client';

export class SetStatusDto {
  @IsIn(['TRIAL', 'ACTIVE', 'SUSPENDED'])
  status: OrgStatus;
}
