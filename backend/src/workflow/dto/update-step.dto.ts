import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateStepDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  statusLabel?: string;

  @IsOptional()
  @IsArray()
  channels?: string[] | null;

  @IsOptional()
  @IsArray()
  uploads?: string[] | null;

  @IsOptional()
  @IsArray()
  checks?: string[] | null;

  @IsOptional()
  fields?: { label: string; key: string; ph?: string; type?: string }[] | null;

  @IsOptional()
  @IsBoolean()
  hasRemarks?: boolean;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsString()
  buttonLabel?: string | null;
}
