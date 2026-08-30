import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOnboardingTaskDto {
  @IsString()
  @MinLength(2)
  title: string;
}

export class UpdateOnboardingTaskDto {
  @IsOptional()
  @IsBoolean()
  isDone?: boolean;
}
