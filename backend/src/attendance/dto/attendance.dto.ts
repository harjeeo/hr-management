import { IsDateString, IsIn, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class CheckInOutDto {
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;
}

export class RequestCorrectionDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  requestedCheckIn?: string;

  @IsOptional()
  @IsDateString()
  requestedCheckOut?: string;

  @IsString()
  reason: string;
}

export class ReviewCorrectionDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
