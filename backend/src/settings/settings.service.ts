import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './repositories/settings.repository';
import { AttendanceSettingsRepository } from './repositories/attendance-settings.repository';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateAttendanceSettingsDto } from './dto/update-attendance-settings.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SettingsService {
  constructor(
    private settingsRepository: SettingsRepository,
    private attendanceSettingsRepository: AttendanceSettingsRepository,
  ) {}

  async getMySettings(user: User) {
    let settings = await this.settingsRepository.findByUser(user.id);
    if (!settings) {
      settings = await this.settingsRepository.save({ userId: user.id });
    }
    return settings;
  }

  async updateMySettings(user: User, dto: UpdateSettingsDto) {
    let settings = await this.settingsRepository.findByUser(user.id);
    if (!settings) {
      settings = await this.settingsRepository.save({ userId: user.id, ...dto });
    } else {
      Object.assign(settings, dto);
      settings = await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async getAttendanceSettings() {
    let s = await this.attendanceSettingsRepository.findOne();
    if (!s) {
      s = await this.attendanceSettingsRepository.save({
        entryTime: '09:00',
        graceMin: 15,
        endTime: '18:00',
      });
    }
    return s;
  }

  async updateAttendanceSettings(dto: UpdateAttendanceSettingsDto) {
    let s = await this.attendanceSettingsRepository.findOne();
    if (!s) {
      s = await this.attendanceSettingsRepository.save(dto);
    } else {
      Object.assign(s, dto);
      s = await this.attendanceSettingsRepository.save(s);
    }
    return s;
  }
}
