import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Report } from './Report.js';

@Entity('report_snapshots')
export class ReportSnapshot {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Report, (report) => report.snapshot)
  @JoinColumn({ name: 'report_id' })
  report!: Report;

  @Column({ name: 'report_id' })
  reportId!: number;

  @Column({ type: 'jsonb' })
  data!: object;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamptz' })
  generatedAt!: Date;
}
