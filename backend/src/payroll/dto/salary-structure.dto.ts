import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertSalaryStructureDto {
  @IsNumber()
  @Min(0)
  basic: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conveyance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  specialAllowance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherAllowance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  providentFund?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  professionalTax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherDeductions?: number;
}
