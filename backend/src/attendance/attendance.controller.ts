import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { AdminAttendanceDto } from './dto/admin-attendance.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: User) {
    return this.attendanceService.checkIn(dto, user);
  }

  @Post('check-out')
  checkOut(@Body() dto: CheckInDto, @CurrentUser() user: User) {
    return this.attendanceService.checkOut(dto, user);
  }

  @Get('me')
  getMyAttendance(
    @CurrentUser() user: User,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    return this.attendanceService.getMyAttendance(user.id, from || today, to || today);
  }

  @Get('today')
  getTodayStatus(@CurrentUser() user: User) {
    return this.attendanceService.getTodayStatus(user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin')
  getByDate(@Query() dto: AdminAttendanceDto) {
    return this.attendanceService.getByDate(dto);
  }
}
