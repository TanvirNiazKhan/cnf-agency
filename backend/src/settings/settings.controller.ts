import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateAttendanceSettingsDto } from './dto/update-attendance-settings.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getMySettings(@CurrentUser() user: User) {
    return this.settingsService.getMySettings(user);
  }

  @Patch()
  updateMySettings(@CurrentUser() user: User, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateMySettings(user, dto);
  }

  @Get('attendance')
  getAttendanceSettings() {
    return this.settingsService.getAttendanceSettings();
  }

  @Roles(UserRole.ADMIN)
  @Patch('attendance')
  updateAttendanceSettings(@Body() dto: UpdateAttendanceSettingsDto) {
    return this.settingsService.updateAttendanceSettings(dto);
  }
}
