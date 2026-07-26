import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from '../entities/settings.entity';

@Injectable()
export class SettingsRepository {
  constructor(@InjectRepository(Settings) private readonly repo: Repository<Settings>) {}

  findByUser(userId: string) {
    return this.repo.findOne({ where: { userId } });
  }

  save(s: Partial<Settings>) {
    return this.repo.save(s);
  }
}
