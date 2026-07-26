import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../entities/case.entity';

@Injectable()
export class CasesRepository {
  constructor(@InjectRepository(Case) private readonly repo: Repository<Case>) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { stepData: { files: true } },
    });
  }

  findByBl(bl: string) {
    return this.repo.findOne({ where: { bl } });
  }

  save(c: Partial<Case>) {
    return this.repo.save(c);
  }

  softDelete(id: string) {
    return this.repo.softDelete(id);
  }

  createQueryBuilder(alias: string) {
    return this.repo.createQueryBuilder(alias);
  }

  async getStats() {
    const total = await this.repo.count();
    const byChannel = await this.repo
      .createQueryBuilder('c')
      .select('c.channel', 'channel')
      .addSelect('COUNT(*)', 'count')
      .where('c.deleted_at IS NULL')
      .groupBy('c.channel')
      .getRawMany();

    const completed = await this.repo
      .createQueryBuilder('c')
      .where('c.deleted_at IS NULL AND c.current_step >= 24')
      .getCount();

    const needsAttention = await this.repo
      .createQueryBuilder('c')
      .where('c.deleted_at IS NULL AND c.current_step > 0 AND c.current_step < 24')
      .andWhere(`c.updated_at < NOW() - INTERVAL '3 days'`)
      .getCount();

    return { total, byChannel, completed, needsAttention };
  }
}
