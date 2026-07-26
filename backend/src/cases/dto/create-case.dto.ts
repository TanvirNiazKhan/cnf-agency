import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CaseChannel } from '../entities/case.entity';

export class CreateCaseDto {
  @IsString()
  bl: string;

  @IsOptional()
  @IsString()
  serial?: string;

  @IsOptional()
  @IsString()
  cNumber?: string;

  @IsOptional()
  @IsString()
  cDate?: string;

  @IsOptional()
  @IsString()
  lc?: string;

  @IsOptional()
  @IsString()
  invoice?: string;

  @IsOptional()
  @IsString()
  importerId?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  vessel?: string;

  @IsOptional()
  @IsString()
  container?: string;

  @IsOptional()
  @IsString()
  invoiceValue?: string;

  @IsOptional()
  @IsEnum(CaseChannel)
  channel?: CaseChannel;

  @IsOptional()
  @IsString()
  pkg?: string;

  @IsOptional()
  @IsString()
  pallet?: string;

  @IsOptional()
  @IsString()
  received?: string;

  @IsOptional()
  @IsString()
  arrival?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
