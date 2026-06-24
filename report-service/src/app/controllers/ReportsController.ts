import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as ReportService from '../services/ReportService.js';
import { CreateReportDto } from '../interfaces/iReport.js';

function roles(req: AuthRequest) {
  return req.loggedUser?.roles ?? [];
}
function isAdmin(req: AuthRequest) {
  return roles(req).includes('ADMIN');
}
function userId(req: AuthRequest) {
  return req.loggedUser!.idUser;
}

// POST /api/v1/reports
export async function createReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateReportDto;
    const report = await ReportService.createReport(dto, userId(req), isAdmin(req));

    // Processa de forma assíncrona (fire-and-forget)
    const token = req.headers.authorization!.split(' ')[1];
    ReportService.processReport(report.id, token).catch(console.error);

    res.status(202).json(report);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
}

// GET /api/v1/reports
export async function listReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { type, status, page, limit } = req.query as Record<string, string>;
    const result = await ReportService.listReports(
      userId(req),
      isAdmin(req),
      type,
      status,
      Number(page ?? 1),
      Number(limit ?? 20),
    );
    res.json(result);
  } catch (err: any) {
    next(err);
  }
}

// GET /api/v1/reports/my
export async function listMyReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.query as Record<string, string>;
    const reports = await ReportService.listMyReports(userId(req), status);
    res.json(reports);
  } catch (err: any) {
    next(err);
  }
}

// GET /api/v1/reports/my/progress
export async function getMyProgress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { competencyId, dateFrom, dateTo } = req.query as Record<string, string>;
    const token = req.headers.authorization!.split(' ')[1];
    const progress = await ReportService.getMyProgress(
      userId(req),
      token,
      competencyId ? Number(competencyId) : undefined,
      dateFrom,
      dateTo,
    );
    res.json(progress);
  } catch (err: any) {
    next(err);
  }
}

// GET /api/v1/reports/:id
export async function getReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const report = await ReportService.getReport(
      Number(req.params.id),
      userId(req),
      isAdmin(req),
    );
    res.json(report);
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
}

// DELETE /api/v1/reports/:id
export async function deleteReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await ReportService.deleteReport(Number(req.params.id), userId(req), isAdmin(req));
    res.status(204).send();
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
}
