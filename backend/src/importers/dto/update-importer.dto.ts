import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateImporterDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
