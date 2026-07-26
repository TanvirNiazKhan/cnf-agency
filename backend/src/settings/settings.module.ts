import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from './entities/settings.entity';
import { AttendanceSettings } from './entities/attendance-settings.entity';
import { SettingsRepository } from './repositories/settings.repository';
import { AttendanceSettingsRepository } from './repositories/attendance-settings.repository';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Settings, AttendanceSettings])],
  providers: [SettingsRepository, AttendanceSettingsRepository, SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
