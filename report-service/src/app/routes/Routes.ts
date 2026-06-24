import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import * as ReportsCtrl from '../controllers/ReportsController.js';
import * as DashboardCtrl from '../controllers/DashboardController.js';
import * as ExportsCtrl from '../controllers/ExportsController.js';

const router = Router();

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'report-service', timestamp: new Date().toISOString() });
});

// ── Reports ───────────────────────────────────────────────────────────────────
router.post('/reports', authMiddleware, ReportsCtrl.createReport);
router.get('/reports', authMiddleware, adminMiddleware, ReportsCtrl.listReports);
router.get('/reports/my', authMiddleware, ReportsCtrl.listMyReports);
router.get('/reports/my/progress', authMiddleware, ReportsCtrl.getMyProgress);
router.get('/reports/:id', authMiddleware, ReportsCtrl.getReport);
router.delete('/reports/:id', authMiddleware, ReportsCtrl.deleteReport);

// ── Exports (por relatório) ───────────────────────────────────────────────────
router.post('/reports/:id/exports', authMiddleware, ExportsCtrl.createExport);
router.get('/reports/:id/exports', authMiddleware, ExportsCtrl.listExports);

// ── Export job avulso ─────────────────────────────────────────────────────────
router.get('/exports/:jobId', authMiddleware, ExportsCtrl.getExport);

// ── Dashboard (somente ADMIN) ─────────────────────────────────────────────────
router.get('/dashboard/summary', authMiddleware, adminMiddleware, DashboardCtrl.getSummary);
router.get('/dashboard/top-performers', authMiddleware, adminMiddleware, DashboardCtrl.getTopPerformers);
router.get('/dashboard/completion-rates', authMiddleware, adminMiddleware, DashboardCtrl.getCompletionRates);

export default router;
