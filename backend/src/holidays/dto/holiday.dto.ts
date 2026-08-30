import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const HOLIDAY_TYPES = ['PUBLIC', 'FESTIVAL', 'COMPANY', 'OPTIONAL'] as const;

export class CreateHolidayDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsIn(HOLIDAY_TYPES)
  type?: (typeof HOLIDAY_TYPES)[number];

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateHolidayDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsIn(HOLIDAY_TYPES)
  type?: (typeof HOLIDAY_TYPES)[number];

  @IsOptional()
  @IsString()
  branchId?: string;
}
