import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowStepsRepository } from './repositories/workflow-steps.repository';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowStep])],
  providers: [WorkflowStepsRepository, WorkflowService],
  controllers: [WorkflowController],
  exports: [WorkflowStepsRepository, WorkflowService],
})
export class WorkflowModule {}
