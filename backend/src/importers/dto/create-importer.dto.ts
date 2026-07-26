import { IsString, MaxLength } from 'class-validator';

export class CreateImporterDto {
  @IsString()
  @MaxLength(255)
  name: string;
}
