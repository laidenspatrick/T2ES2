import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as DashboardService from '../services/DashboardService.js';

function token(req: AuthRequest) {
  return req.headers.authorization!.split(' ')[1];
}

// GET /api/v1/dashboard/summary
export async function getSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const summary = await DashboardService.getDashboardSummary(token(req));
    res.json(summary);
  } catch (err: any) {
    next(err);
  }
}

// GET /api/v1/dashboard/top-performers
export async function getTopPerformers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { competencyId, limit } = req.query as Record<string, string>;
    if (!competencyId) {
      return res.status(400).json({ message: 'competencyId é obrigatório.' });
    }
    const data = await DashboardService.getDashboardTopPerformers(
      token(req),
      Number(competencyId),
      Number(limit ?? 10),
    );
    res.json(data);
  } catch (err: any) {
    next(err);
  }
}

// GET /api/v1/dashboard/completion-rates
export async function getCompletionRates(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await DashboardService.getDashboardCompletionRates(token(req));
    res.json(data);
  } catch (err: any) {
    next(err);
  }
}
