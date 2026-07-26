import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CaseChannel } from '../entities/case.entity';

export class ListCasesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CaseChannel)
  channel?: CaseChannel;

  @IsOptional()
  @IsString()
  importerId?: string;

  @IsOptional()
  @IsString()
  step?: string;
}
