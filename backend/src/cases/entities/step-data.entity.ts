import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Case } from './case.entity';
import { WorkflowStep } from '../../workflow/entities/workflow-step.entity';
import { User } from '../../users/entities/user.entity';
import { FileEntry } from './file-entry.entity';

@Entity('step_data')
@Unique(['caseId', 'stepId'])
export class StepData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case, (c) => c.stepData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ name: 'case_id' })
  caseId: string;

  @ManyToOne(() => WorkflowStep, { eager: true })
  @JoinColumn({ name: 'step_id' })
  step: WorkflowStep;

  @Column({ name: 'step_id', type: 'varchar', length: 10 })
  stepId: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'completed_date', type: 'date', nullable: true })
  completedDate: Date | null;

  @Column({ type: 'jsonb', default: {} })
  checks: Record<string, boolean>;

  @Column({ type: 'jsonb', default: {} })
  fields: Record<string, string>;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completed_by' })
  completedBy: User | null;

  @Column({ name: 'completed_by', nullable: true })
  completedById: string | null;

  @OneToMany(() => FileEntry, (f) => f.stepData, { cascade: true })
  files: FileEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
