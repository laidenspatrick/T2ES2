import { AppDataSource } from '../../database/database-config.js';
import { Report } from '../entities/Report.js';
import { ReportSnapshot } from '../entities/ReportSnapshot.js';

export const ReportRepository = AppDataSource.getRepository(Report);
export const ReportSnapshotRepository = AppDataSource.getRepository(ReportSnapshot);
