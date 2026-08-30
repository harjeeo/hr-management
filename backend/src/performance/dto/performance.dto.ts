import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateCycleDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class UpdateCycleDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'CLOSED'])
  status?: 'ACTIVE' | 'CLOSED';
}

export class CreateGoalDto {
  @IsString()
  employeeId: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export class SelfReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  selfRating: number;

  @IsOptional()
  @IsString()
  selfFeedback?: string;
}

export class ManagerReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  managerRating: number;

  @IsOptional()
  @IsString()
  managerFeedback?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  finalRating?: number;
}
