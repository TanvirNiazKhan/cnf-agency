import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowStepsRepository } from './repositories/workflow-steps.repository';
import { UpdateStepDto } from './dto/update-step.dto';

@Injectable()
export class WorkflowService {
  constructor(private workflowStepsRepository: WorkflowStepsRepository) {}

  findAll() {
    return this.workflowStepsRepository.findAll();
  }

  async findById(id: string) {
    const step = await this.workflowStepsRepository.findById(id);
    if (!step) throw new NotFoundException('Step not found');
    return step;
  }

  async update(id: string, dto: UpdateStepDto) {
    const step = await this.findById(id);
    Object.assign(step, dto);
    return this.workflowStepsRepository.save(step);
  }

  async reorder(ids: string[]) {
    const steps = await this.workflowStepsRepository.findAll();
    const updated = steps.map((s) => {
      const idx = ids.indexOf(s.id);
      if (idx !== -1) s.sortOrder = idx + 1;
      return s;
    });
    return this.workflowStepsRepository.saveMany(updated);
  }
}
