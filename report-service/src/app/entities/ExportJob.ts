import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Report } from './Report.js';

export type ExportFormat = 'PDF' | 'CSV' | 'XLSX';
export type ExportStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

@Entity('export_jobs')
export class ExportJob {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Report, (report) => report.exportJobs)
  @JoinColumn({ name: 'report_id' })
  report!: Report;

  @Column({ name: 'report_id' })
  reportId!: number;

  @Column({ type: 'varchar', length: 10 })
  format!: ExportFormat;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: ExportStatus;

  @Column({ name: 'download_url', nullable: true, type: 'varchar', length: 2048 })
  downloadUrl!: string | null;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamptz' })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'ready_at', nullable: true, type: 'timestamptz' })
  readyAt!: Date | null;
}
