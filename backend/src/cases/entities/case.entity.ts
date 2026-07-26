import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Importer } from '../../importers/entities/importer.entity';
import { User } from '../../users/entities/user.entity';
import { StepData } from './step-data.entity';

export enum CaseChannel {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
}

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', generated: 'increment' })
  seq: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  serial: string | null;

  @Column({ name: 'c_number', type: 'varchar', length: 50, nullable: true })
  cNumber: string | null;

  @Column({ name: 'c_date', type: 'date', nullable: true })
  cDate: Date | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  bl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoice: string | null;

  @ManyToOne(() => Importer, { nullable: true, eager: true })
  @JoinColumn({ name: 'importer_id' })
  importer: Importer | null;

  @Column({ name: 'importer_id', nullable: true })
  importerId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vessel: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  container: string | null;

  @Column({ name: 'invoice_value', type: 'varchar', length: 50, nullable: true })
  invoiceValue: string | null;

  @Column({ type: 'enum', enum: CaseChannel, nullable: true })
  channel: CaseChannel | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pkg: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pallet: string | null;

  @Column({ type: 'date', nullable: true })
  received: Date | null;

  @Column({ type: 'date', nullable: true })
  arrival: Date | null;

  @Column({ default: false })
  delivery: boolean;

  @Column({ default: false })
  exam: boolean;

  @Column({ default: false })
  assess: boolean;

  @Column({ name: 'current_step', type: 'smallint', default: 0 })
  currentStep: number;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User | null;

  @Column({ name: 'created_by', nullable: true })
  createdById: string | null;

  @OneToMany(() => StepData, (sd) => sd.case, { cascade: true })
  stepData: StepData[];

  @Column({ name: 'custom_steps', type: 'jsonb', nullable: true, default: () => "'[]'" })
  customSteps: {
    id: string;
    title: string;
    insertAfter: string;
    notes: string;
    done: boolean;
    createdAt: string;
  }[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
