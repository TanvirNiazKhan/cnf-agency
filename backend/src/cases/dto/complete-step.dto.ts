import { IsObject, IsOptional, IsString } from 'class-validator';

export class CompleteStepDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  completedDate?: string;

  @IsOptional()
  @IsObject()
  checks?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  fields?: Record<string, string>;
}
