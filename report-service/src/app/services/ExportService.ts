import { ExportJob, ExportFormat } from '../entities/ExportJob.js';
import { ExportJobRepository } from '../repositories/ExportJobRepository.js';
import { ReportRepository, ReportSnapshotRepository } from '../repositories/ReportRepository.js';

function toCsv(data: object): string {
  const flatten = (obj: any, prefix = ''): Record<string, string> => {
    return Object.keys(obj).reduce((acc: Record<string, string>, key) => {
      const pre = prefix.length ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, flatten(obj[key], pre));
      } else {
        acc[pre] = Array.isArray(obj[key]) ? JSON.stringify(obj[key]) : String(obj[key] ?? '');
      }
      return acc;
    }, {});
  };

  const flat = flatten(data);
  const headers = Object.keys(flat).join(',');
  const values = Object.values(flat)
    .map((v) => `"${v.replace(/"/g, '""')}"`)
    .join(',');
  return `${headers}\n${values}`;
}

function toHtmlReport(reportType: string, data: any): string {
  const json = JSON.stringify(data, null, 2);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relatório ${reportType}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
    h1 { color: #1565C0; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 4px; font-size: 13px; white-space: pre-wrap; }
    .meta { color: #666; margin-bottom: 24px; }
  </style>
</head>
<body>
  <h1>Relatório: ${reportType}</h1>
  <p class="meta">Gerado em: ${new Date().toISOString()}</p>
  <pre>${json}</pre>
</body>
</html>`;
}

export async function createExportJob(
  reportId: number,
  format: ExportFormat,
  userId: number,
  isAdmin: boolean,
): Promise<ExportJob> {
  const report = await ReportRepository.findOne({ where: { id: reportId } });

  if (!report) throw Object.assign(new Error('Relatório não encontrado.'), { status: 404 });
  if (!isAdmin && report.requestedByUserId !== userId) {
    throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  }
  if (report.status !== 'READY') {
    throw Object.assign(
      new Error('Relatório ainda não está pronto para exportação.'),
      { status: 409 },
    );
  }

  const job = ExportJobRepository.create({
    reportId,
    format,
    status: 'PENDING',
  });

  return ExportJobRepository.save(job);
}

export async function processExportJob(jobId: number): Promise<void> {
  const job = await ExportJobRepository.findOneOrFail({ where: { id: jobId } });
  await ExportJobRepository.update(jobId, { status: 'PROCESSING' });

  try {
    const snapshot = await ReportSnapshotRepository.findOne({
      where: { reportId: job.reportId },
      relations: ['report'],
    });

    if (!snapshot) throw new Error('Snapshot do relatório não encontrado.');

    let content: string;
    let mimeType: string;

    switch (job.format) {
      case 'CSV':
        content = toCsv(snapshot.data);
        mimeType = 'text/csv';
        break;
      case 'PDF':
      case 'XLSX':
      default:
        // Sem lib de PDF/XLSX no ambiente Ministack: gera HTML como proxy.
        // Em produção, substituir por pdfkit ou exceljs.
        content = toHtmlReport(snapshot.report?.type ?? 'REPORT', snapshot.data);
        mimeType = 'text/html';
        break;
    }

    // Em produção: upload para S3/LocalStack e devolver URL pré-assinada.
    // Aqui devolvemos o conteúdo encodado em base64 via data-URI para fins de demo.
    const base64 = Buffer.from(content).toString('base64');
    const downloadUrl = `data:${mimeType};base64,${base64}`;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await ExportJobRepository.update(jobId, {
      status: 'DONE',
      downloadUrl,
      readyAt: new Date(),
      expiresAt,
    });
  } catch (err) {
    console.error(`[ExportService] Falha ao processar job ${jobId}:`, err);
    await ExportJobRepository.update(jobId, { status: 'FAILED' });
  }
}

export async function getExportJob(
  jobId: number,
  userId: number,
  isAdmin: boolean,
): Promise<ExportJob> {
  const job = await ExportJobRepository.findOne({
    where: { id: jobId },
    relations: ['report'],
  });

  if (!job) throw Object.assign(new Error('Export job não encontrado.'), { status: 404 });
  if (!isAdmin && job.report?.requestedByUserId !== userId) {
    throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  }

  return job;
}

export async function listExportJobsByReport(
  reportId: number,
  userId: number,
  isAdmin: boolean,
): Promise<ExportJob[]> {
  const report = await ReportRepository.findOne({ where: { id: reportId } });
  if (!report) throw Object.assign(new Error('Relatório não encontrado.'), { status: 404 });
  if (!isAdmin && report.requestedByUserId !== userId) {
    throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  }

  return ExportJobRepository.find({ where: { reportId }, order: { createdAt: 'DESC' } });
}
