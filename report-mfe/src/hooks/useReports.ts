import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/reportApi';
import { Report, PaginatedReports, CompetencyProgress } from '../types';

// ── My Reports ────────────────────────────────────────────────────────────────

export function useMyReports(statusFilter?: string) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listMyReports(statusFilter);
      setReports(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  return { reports, loading, error, refetch: fetch };
}

// ── Single Report ─────────────────────────────────────────────────────────────

export function useReport(id: number | null) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReport(id);
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { report, loading, error, refetch: fetch };
}

// ── All Reports (admin) ───────────────────────────────────────────────────────

export function useAllReports(page = 1, limit = 20, type?: string, status?: string) {
  const [result, setResult] = useState<PaginatedReports>({ data: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listAllReports({ page, limit, type: type as import('../types').ReportType | undefined, status });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, type, status]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...result, loading, error, refetch: fetch };
}

// ── My Progress ───────────────────────────────────────────────────────────────

export function useMyProgress(competencyId?: number, dateFrom?: string, dateTo?: string) {
  const [progress, setProgress] = useState<CompetencyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyProgress({ competencyId, dateFrom, dateTo });
      setProgress(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar progresso.');
    } finally {
      setLoading(false);
    }
  }, [competencyId, dateFrom, dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { progress, loading, error, refetch: fetch };
}
