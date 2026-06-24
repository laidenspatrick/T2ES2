import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Report } from '../app/entities/Report.js';
import { ReportSnapshot } from '../app/entities/ReportSnapshot.js';
import { ExportJob } from '../app/entities/ExportJob.js';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'report_service',
  synchronize: true,
  logging: false,
  entities: [Report, ReportSnapshot, ExportJob],
  migrations: [],
  subscribers: [],
});
