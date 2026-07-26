import { IsOptional, IsString } from 'class-validator';

export class AdminAttendanceDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
