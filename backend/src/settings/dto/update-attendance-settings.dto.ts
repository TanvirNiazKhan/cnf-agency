import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAttendanceSettingsDto {
  @IsOptional()
  @IsString()
  entryTime?: string;

  @IsOptional()
  @IsNumber()
  graceMin?: number;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @IsOptional()
  @IsNumber()
  radiusMeters?: number;

  @IsOptional()
  requireLocationCheckout?: boolean;
}
