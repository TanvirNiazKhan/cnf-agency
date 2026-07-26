import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from '../entities/attendance-record.entity';

@Injectable()
export class AttendanceRepository {
  constructor(@InjectRepository(AttendanceRecord) private readonly repo: Repository<AttendanceRecord>) {}

  findByUserAndDate(userId: string, date: string) {
    return this.repo.findOne({ where: { userId, date } });
  }

  findByDate(date: string) {
    return this.repo.find({
      where: { date },
      relations: { user: true },
      order: { user: { name: 'ASC' } },
    });
  }

  findByUserRange(userId: string, from: string, to: string) {
    return this.repo
      .createQueryBuilder('ar')
      .where('ar.user_id = :userId', { userId })
      .andWhere('ar.date BETWEEN :from AND :to', { from, to })
      .orderBy('ar.date', 'ASC')
      .getMany();
  }

  save(record: Partial<AttendanceRecord>) {
    return this.repo.save(record);
  }
}
