import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StepData } from '../entities/step-data.entity';

@Injectable()
export class StepDataRepository {
  constructor(@InjectRepository(StepData) private readonly repo: Repository<StepData>) {}

  findByCaseAndStep(caseId: string, stepId: string) {
    return this.repo.findOne({
      where: { caseId, stepId },
      relations: { files: true },
    });
  }

  findByCase(caseId: string) {
    return this.repo.find({
      where: { caseId },
      relations: { files: true },
      order: { step: { sortOrder: 'ASC' } },
    });
  }

  save(sd: Partial<StepData>) {
    return this.repo.save(sd);
  }

  upsert(sd: Partial<StepData>) {
    return this.repo.save(sd);
  }
}
