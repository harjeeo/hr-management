import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'HIRED'] as const;

export class CreateCandidateDto {
  @IsString()
  jobOpeningId: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCandidateDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(STAGES)
  stage?: (typeof STAGES)[number];
}
