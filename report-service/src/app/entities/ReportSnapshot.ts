import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Report } from './Report.js';

@Entity('report_snapshots')
export class ReportSnapshot {
  @PrimaryGeneratedColumn()
  id!: number;

  // Usando ManyToOne em vez de OneToOne para evitar o ciclo de importação.
  // Na prática sempre haverá no máximo 1 snapshot por relatório (regra do service).
  @ManyToOne(() => Report, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report!: Report;

  @Column({ name: 'report_id' })
  reportId!: number;

  @Column({ type: 'jsonb' })
  data!: object;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamptz' })
  generatedAt!: Date;
}
