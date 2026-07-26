import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowStep } from '../entities/workflow-step.entity';

@Injectable()
export class WorkflowStepsRepository {
  constructor(@InjectRepository(WorkflowStep) private readonly repo: Repository<WorkflowStep>) {}

  findAll() {
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  save(step: Partial<WorkflowStep>) {
    return this.repo.save(step);
  }

  saveMany(steps: Partial<WorkflowStep>[]) {
    return this.repo.save(steps);
  }
}
