import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDesignationDto {
  @IsString()
  @MinLength(2)
  title: string;
}

export class UpdateDesignationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;
}
