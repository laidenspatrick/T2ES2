import axios, { AxiosInstance } from 'axios';
import {
  Report,
  PaginatedReports,
  ExportJob,
  ExportFormat,
  ReportType,
  ReportFilters,
  CompetencyProgress,
  DashboardSummary,
  TopPerformer,
  CompletionRate,
} from '../types';

// URL do backend — configurável via env (Vite) ou padrão localhost
const BASE_URL =
  (import.meta as { env?: Record<string, string> }).env?.VITE_REPORT_SERVICE_URL ??
  'http://localhost:3005/api/v1';

// ── Fábrica de cliente ────────────────────────────────────────────────────────

let _client: AxiosInstance | null = null;

export function initApiClient(token: string): void {
  _client = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15_000,
  });

  // Interceptor de erro global
  _client.interceptors.response.use(
    (res) => res,
    (err) => {
      const msg =
        err.response?.data?.message ?? err.message ?? 'Erro de comunicação com o servidor.';
      return Promise.reject(new Error(msg));
    },
  );
}

function client(): AxiosInstance {
  if (!_client) throw new Error('API client não inicializado. Chame initApiClient(token) primeiro.');
  return _client;
}

// ════════════════════════════════════════════════════════════════
// Reports
// ════════════════════════════════════════════════════════════════

export async function createReport(
  type: ReportType,
  filters?: ReportFilters,
): Promise<Report> {
  const { data } = await client().post<Report>('/reports', { type, filters });
  return data;
}

export async function listAllReports(params?: {
  type?: ReportType;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedReports> {
  const { data } = await client().get<PaginatedReports>('/reports', { params });
  return data;
}

export async function listMyReports(status?: string): Promise<Report[]> {
  const { data } = await client().get<Report[]>('/reports/my', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function getReport(id: number): Promise<Report> {
  const { data } = await client().get<Report>(`/reports/${id}`);
  return data;
}

export async function deleteReport(id: number): Promise<void> {
  await client().delete(`/reports/${id}`);
}

// ════════════════════════════════════════════════════════════════
// Progress
// ════════════════════════════════════════════════════════════════

export async function getMyProgress(params?: {
  competencyId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<CompetencyProgress[]> {
  const { data } = await client().get<CompetencyProgress[]>('/reports/my/progress', { params });
  return data;
}

// ════════════════════════════════════════════════════════════════
// Exports
// ════════════════════════════════════════════════════════════════

export async function createExport(reportId: number, format: ExportFormat): Promise<ExportJob> {
  const { data } = await client().post<ExportJob>(`/reports/${reportId}/exports`, { format });
  return data;
}

export async function listExports(reportId: number): Promise<ExportJob[]> {
  const { data } = await client().get<ExportJob[]>(`/reports/${reportId}/exports`);
  return data;
}

export async function getExportJob(jobId: number): Promise<ExportJob> {
  const { data } = await client().get<ExportJob>(`/exports/${jobId}`);
  return data;
}

/**
 * Faz polling até o job de exportação estar DONE ou FAILED.
 * Intervalo padrão: 2s, máximo de tentativas: 30 (~1 min).
 */
export async function pollExportJob(
  jobId: number,
  intervalMs = 2000,
  maxAttempts = 30,
): Promise<ExportJob> {
  for (let i = 0; i < maxAttempts; i++) {
    const job = await getExportJob(jobId);
    if (job.status === 'DONE' || job.status === 'FAILED') return job;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Timeout aguardando exportação.');
}

/**
 * Faz polling até o relatório estar READY ou FAILED.
 */
export async function pollReport(
  reportId: number,
  intervalMs = 2000,
  maxAttempts = 30,
): Promise<Report> {
  for (let i = 0; i < maxAttempts; i++) {
    const report = await getReport(reportId);
    if (report.status === 'READY' || report.status === 'FAILED') return report;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Timeout aguardando geração do relatório.');
}

// ════════════════════════════════════════════════════════════════
// Dashboard
// ════════════════════════════════════════════════════════════════

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await client().get<DashboardSummary>('/dashboard/summary');
  return data;
}

export async function getTopPerformers(competencyId: number, limit = 10): Promise<TopPerformer[]> {
  const { data } = await client().get<TopPerformer[]>('/dashboard/top-performers', {
    params: { competencyId, limit },
  });
  return data;
}

export async function getCompletionRates(): Promise<CompletionRate[]> {
  const { data } = await client().get<CompletionRate[]>('/dashboard/completion-rates');
  return data;
}
