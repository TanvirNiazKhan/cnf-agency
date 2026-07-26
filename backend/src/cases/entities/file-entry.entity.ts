import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StepData } from './step-data.entity';
import { User } from '../../users/entities/user.entity';

export enum FileType {
  PDF = 'pdf',
  IMG = 'img',
}

@Entity('file_entries')
export class FileEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StepData, (sd) => sd.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_data_id' })
  stepData: StepData;

  @Column({ name: 'step_data_id' })
  stepDataId: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'enum', enum: FileType })
  type: FileType;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ name: 'file_date', type: 'date', default: () => 'CURRENT_DATE' })
  fileDate: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User | null;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedById: string | null;

  @Column({ name: 'file_size', type: 'varchar', length: 20, nullable: true })
  fileSize: string | null;

  @Column({ name: 'storage_key', type: 'varchar', length: 500, nullable: true })
  storageKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
