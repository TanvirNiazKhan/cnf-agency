import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('attendance_settings')
export class AttendanceSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entry_time', type: 'time', default: '09:00' })
  entryTime: string;

  @Column({ name: 'grace_min', type: 'smallint', default: 15 })
  graceMin: number;

  @Column({ name: 'end_time', type: 'time', default: '18:00' })
  endTime: string;

  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

  @Column({ name: 'radius_meters', type: 'int', default: 100 })
  radiusMeters: number;

  @Column({ name: 'require_location_checkout', type: 'boolean', default: false })
  requireLocationCheckout: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
