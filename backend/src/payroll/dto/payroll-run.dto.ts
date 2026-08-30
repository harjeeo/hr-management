import { IsInt, Max, Min } from 'class-validator';

export class ProcessPayrollDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2000)
  year: number;
}
