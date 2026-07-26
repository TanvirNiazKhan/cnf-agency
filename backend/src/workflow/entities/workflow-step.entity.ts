import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryColumn({ length: 10 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'smallint' })
  phase: number;

  @Column({ name: 'sort_order', type: 'smallint' })
  sortOrder: number;

  @Column({ name: 'status_label', type: 'varchar', length: 255 })
  statusLabel: string;

  @Column({ type: 'text', array: true, nullable: true })
  channels: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  uploads: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  checks: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  fields: { label: string; key: string; ph?: string; type?: string }[] | null;

  @Column({ name: 'has_remarks', default: false })
  hasRemarks: boolean;

  @Column({ default: false })
  dropdown: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  special: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'button_label', type: 'varchar', length: 100, nullable: true })
  buttonLabel: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
