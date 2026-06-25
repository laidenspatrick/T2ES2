import { ExportJob, ExportFormat } from '../entities/ExportJob.js';
import { ExportJobRepository } from '../repositories/ExportJobRepository.js';
import { ReportRepository, ReportSnapshotRepository } from '../repositories/ReportRepository.js';

function toCsv(data: object): string {
  const flatten = (obj: any, prefix = ''): Record<string, string> =>
    Object.keys(obj).reduce((acc: Record<string, string>, key) => {
      const pre = prefix.length ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, flatten(obj[key], pre));
      } else {
        acc[pre] = Array.isArray(obj[key]) ? JSON.stringify(obj[key]) : String(obj[key] ?? '');
      }
      return acc;
    }, {});
  const flat = flatten(data);
  const headers = Object.keys(flat).join(',');
  const values = Object.values(flat).map((v) => `"${v.replace(/"/g, '""')}"`).join(',');
  return `${headers}\n${values}`;
}

function toHtmlReport(reportType: string, data: any): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Relatório ${reportType}</title>
<style>body{font-family:Arial,sans-serif;margin:40px}pre{background:#f5f5f5;padding:16px;border-radius:4px;font-size:13px;white-space:pre-wrap}</style>
</head><body><h1>Relatório: ${reportType}</h1><p>Gerado em: ${new Date().toISOString()}</p>
<pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
}

export async function createExportJob(reportId: number, format: ExportFormat, userId: number, isAdmin: boolean): Promise<ExportJob> {
  const report = await ReportRepository.findOne({ where: { id: reportId } });
  if (!report) throw Object.assign(new Error('Relatório não encontrado.'), { status: 404 });
  if (!isAdmin && report.requestedByUserId !== userId) throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  if (report.status !== 'READY') throw Object.assign(new Error('Relatório ainda não está pronto para exportação.'), { status: 409 });
  const job = ExportJobRepository.create({ reportId, format, status: 'PENDING' });
  return ExportJobRepository.save(job);
}

export async function processExportJob(jobId: number): Promise<void> {
  const job = await ExportJobRepository.findOneOrFail({ where: { id: jobId } });
  await ExportJobRepository.update(jobId, { status: 'PROCESSING' });
  try {
    // Busca snapshot diretamente pelo reportId (sem relação na entidade Report)
    const snapshot = await ReportSnapshotRepository.findOne({ where: { reportId: job.reportId } });
    if (!snapshot) throw new Error('Snapshot não encontrado.');
    const report = await ReportRepository.findOne({ where: { id: job.reportId } });
    let content: string;
    let mimeType: string;
    switch (job.format) {
      case 'CSV':  content = toCsv(snapshot.data); mimeType = 'text/csv'; break;
      default:     content = toHtmlReport(report?.type ?? 'REPORT', snapshot.data); mimeType = 'text/html'; break;
    }
    const downloadUrl = `data:${mimeType};base64,${Buffer.from(content).toString('base64')}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    await ExportJobRepository.update(jobId, { status: 'DONE', downloadUrl, readyAt: new Date(), expiresAt });
  } catch (err) {
    console.error(`[ExportService] Falha no job ${jobId}:`, err);
    await ExportJobRepository.update(jobId, { status: 'FAILED' });
  }
}

export async function getExportJob(jobId: number, userId: number, isAdmin: boolean): Promise<ExportJob> {
  const job = await ExportJobRepository.findOne({ where: { id: jobId }, relations: ['report'] });
  if (!job) throw Object.assign(new Error('Export job não encontrado.'), { status: 404 });
  if (!isAdmin && job.report?.requestedByUserId !== userId) throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  return job;
}

export async function listExportJobsByReport(reportId: number, userId: number, isAdmin: boolean): Promise<ExportJob[]> {
  const report = await ReportRepository.findOne({ where: { id: reportId } });
  if (!report) throw Object.assign(new Error('Relatório não encontrado.'), { status: 404 });
  if (!isAdmin && report.requestedByUserId !== userId) throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  return ExportJobRepository.find({ where: { reportId }, order: { createdAt: 'DESC' } });
}
