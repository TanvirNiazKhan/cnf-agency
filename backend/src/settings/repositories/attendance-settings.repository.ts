import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceSettings } from '../entities/attendance-settings.entity';

@Injectable()
export class AttendanceSettingsRepository {
  constructor(@InjectRepository(AttendanceSettings) private readonly repo: Repository<AttendanceSettings>) {}

  findOne() {
    return this.repo.findOne({ where: {} });
  }

  save(s: Partial<AttendanceSettings>) {
    return this.repo.save(s);
  }
}
