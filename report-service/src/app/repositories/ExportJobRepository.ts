import { AppDataSource } from '../../database/database-config.js';
import { ExportJob } from '../entities/ExportJob.js';

export const ExportJobRepository = AppDataSource.getRepository(ExportJob);
