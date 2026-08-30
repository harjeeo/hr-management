import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

const CATEGORIES = [
  'ID_PROOF',
  'PAN',
  'PASSPORT',
  'DRIVING_LICENSE',
  'EDUCATION_CERTIFICATE',
  'EXPERIENCE_LETTER',
  'OFFER_LETTER',
  'APPOINTMENT_LETTER',
  'EMPLOYMENT_AGREEMENT',
  'SALARY_DOCUMENT',
  'OTHER',
] as const;

export class UploadDocumentDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: (typeof CATEGORIES)[number];

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}
