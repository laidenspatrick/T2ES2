import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as ExportService from '../services/ExportService.js';
import { ExportFormat } from '../entities/ExportJob.js';

function isAdmin(req: AuthRequest) {
  return (req.loggedUser?.roles ?? []).includes('ADMIN');
}
function userId(req: AuthRequest) {
  return req.loggedUser!.idUser;
}

// POST /api/v1/reports/:id/exports
export async function createExport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { format } = req.body as { format: ExportFormat };
    const allowedFormats: ExportFormat[] = ['PDF', 'CSV', 'XLSX'];

    if (!allowedFormats.includes(format)) {
      return res.status(400).json({ message: `Formato inválido. Use: ${allowedFormats.join(', ')}` });
    }

    const job = await ExportService.createExportJob(
      Number(req.params.id),
      format,
      userId(req),
      isAdmin(req),
    );

    // Processa de forma assíncrona
    ExportService.processExportJob(job.id).catch(console.error);

    res.status(202).json(job);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
}

// GET /api/v1/reports/:id/exports
export async function listExports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const jobs = await ExportService.listExportJobsByReport(
      Number(req.params.id),
      userId(req),
      isAdmin(req),
    );
    res.json(jobs);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
}

// GET /api/v1/exports/:jobId
export async function getExport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const job = await ExportService.getExportJob(
      Number(req.params.jobId),
      userId(req),
      isAdmin(req),
    );
    res.json(job);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
}
