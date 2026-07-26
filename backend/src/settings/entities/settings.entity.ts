import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  license: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'email_alerts', default: true })
  emailAlerts: boolean;

  @Column({ name: 'sms_alerts', default: false })
  smsAlerts: boolean;

  @Column({ name: 'weekly_report', default: true })
  weeklyReport: boolean;

  @Column({ name: 'auto_sync', default: true })
  autoSync: boolean;

  @Column({ default: false })
  compact: boolean;
}
