import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FileType } from '../entities/file-entry.entity';

export class UploadFileDto {
  @IsString()
  name: string;

  @IsEnum(FileType)
  type: FileType;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  fileDate?: string;

  @IsOptional()
  @IsString()
  fileSize?: string;

  @IsOptional()
  @IsString()
  storageKey?: string;
}
