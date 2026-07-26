import { Injectable, BadRequestException } from '@nestjs/common';
import { AttendanceRepository } from './repositories/attendance.repository';
import { SettingsService } from '../settings/settings.service';
import { CheckInDto } from './dto/check-in.dto';
import { AdminAttendanceDto } from './dto/admin-attendance.dto';
import { User } from '../users/entities/user.entity';

/** Haversine distance in meters between two lat/lng points. */
function haversineMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class AttendanceService {
  constructor(
    private attendanceRepository: AttendanceRepository,
    private settingsService: SettingsService,
  ) {}

  private async validateLocation(dto: CheckInDto, isCheckout: boolean) {
    const settings = await this.settingsService.getAttendanceSettings();
    if (settings.latitude == null || settings.longitude == null) return;
    if (isCheckout && !settings.requireLocationCheckout) return;

    if (dto.latitude == null || dto.longitude == null) {
      throw new BadRequestException('Location is required. Please enable GPS and try again.');
    }

    const distance = haversineMeters(
      settings.latitude, settings.longitude,
      dto.latitude, dto.longitude,
    );

    if (distance > settings.radiusMeters) {
      throw new BadRequestException(
        `You are ${Math.round(distance)}m away from the office. Must be within ${settings.radiusMeters}m.`,
      );
    }
  }

  async checkIn(dto: CheckInDto, user: User) {
    await this.validateLocation(dto, false);

    const date = dto.date || new Date().toISOString().split('T')[0];
    const time = dto.time || new Date().toTimeString().slice(0, 8);

    let record = await this.attendanceRepository.findByUserAndDate(user.id, date);
    if (record) {
      if (record.checkIn) throw new BadRequestException('Already checked in today');
    }

    if (!record) {
      record = await this.attendanceRepository.save({ userId: user.id, date, checkIn: time });
    } else {
      record.checkIn = time;
      record = await this.attendanceRepository.save(record);
    }
    return record;
  }

  async checkOut(dto: CheckInDto, user: User) {
    await this.validateLocation(dto, true);

    const date = dto.date || new Date().toISOString().split('T')[0];
    const time = dto.time || new Date().toTimeString().slice(0, 8);

    const record = await this.attendanceRepository.findByUserAndDate(user.id, date);
    if (!record || !record.checkIn) throw new BadRequestException('Not checked in yet');

    record.checkOut = time;
    return this.attendanceRepository.save(record);
  }

  getMyAttendance(userId: string, from: string, to: string) {
    return this.attendanceRepository.findByUserRange(userId, from, to);
  }

  getByDate(dto: AdminAttendanceDto) {
    const date = dto.date || new Date().toISOString().split('T')[0];
    return this.attendanceRepository.findByDate(date);
  }

  async getTodayStatus(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.attendanceRepository.findByUserAndDate(userId, today);
  }
}
