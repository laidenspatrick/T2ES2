import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ExportJob } from './ExportJob.js';
import { ReportSnapshot } from './ReportSnapshot.js';

export type ReportType = 'INDIVIDUAL' | 'GROUP' | 'COMPETENCY' | 'ASSESSMENT';
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: ReportType;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: ReportStatus;

  @Column({ name: 'requested_by_user_id' })
  requestedByUserId!: number;

  @Column({ name: 'filter_assessment_id', nullable: true, type: 'int' })
  filterAssessmentId!: number | null;

  @Column({ name: 'filter_user_id', nullable: true, type: 'int' })
  filterUserId!: number | null;

  @Column({ name: 'filter_group_id', nullable: true, type: 'int' })
  filterGroupId!: number | null;

  @Column({ name: 'filter_competency_id', nullable: true, type: 'int' })
  filterCompetencyId!: number | null;

  @Column({ name: 'filter_date_from', nullable: true, type: 'date' })
  filterDateFrom!: string | null;

  @Column({ name: 'filter_date_to', nullable: true, type: 'date' })
  filterDateTo!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'ready_at', nullable: true, type: 'timestamptz' })
  readyAt!: Date | null;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamptz' })
  expiresAt!: Date | null;

  @OneToMany(() => ExportJob, (job) => job.report)
  exportJobs!: ExportJob[];

  @OneToOne(() => ReportSnapshot, (snap) => snap.report)
  snapshot!: ReportSnapshot;
}
