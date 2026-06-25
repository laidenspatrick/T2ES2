import { Report, ReportStatus, ReportType } from '../entities/Report.js';
import { ReportRepository, ReportSnapshotRepository } from '../repositories/ReportRepository.js';
import { CreateReportDto, ReportFilters } from '../interfaces/iReport.js';
import {
  getSubmittedResponsesByUser,
  getAllCompetencies,
  getGroupMembers,
  getGroupById,
  getResponsesByAssessment,
  getAllAssessments,
} from './ExternalServiceClient.js';
import dotenv from 'dotenv';
dotenv.config();

const EXPIRY_DAYS = Number(process.env.REPORT_EXPIRY_DAYS ?? 30);

function buildFilters(dto: CreateReportDto): Partial<Report> {
  const f = dto.filters ?? {};
  return {
    filterAssessmentId: f.assessmentId ?? null,
    filterUserId: f.userId ?? null,
    filterGroupId: f.groupId ?? null,
    filterCompetencyId: f.competencyId ?? null,
    filterDateFrom: f.dateFrom ?? null,
    filterDateTo: f.dateTo ?? null,
  };
}

function reportToResponse(report: Report, snapshotData?: object | null) {
  return {
    id: report.id,
    type: report.type,
    status: report.status,
    requestedByUserId: report.requestedByUserId,
    filters: {
      assessmentId: report.filterAssessmentId,
      userId: report.filterUserId,
      groupId: report.filterGroupId,
      competencyId: report.filterCompetencyId,
      dateFrom: report.filterDateFrom,
      dateTo: report.filterDateTo,
    } as ReportFilters,
    createdAt: report.createdAt,
    readyAt: report.readyAt,
    expiresAt: report.expiresAt,
    ...(snapshotData !== undefined ? { data: snapshotData } : {}),
  };
}

// ─── Consolidação ─────────────────────────────────────────────────────────────

async function consolidateIndividual(report: Report, token: string): Promise<object> {
  const userId = report.filterUserId ?? report.requestedByUserId;
  const responses = await getSubmittedResponsesByUser(userId, token, report.filterDateFrom, report.filterDateTo);
  const competencyMap: Record<number, { name: string; latestLevelId: number; latestLevelName: string; assessmentsCompleted: number }> = {};
  const responseHistory = (Array.isArray(responses) ? responses : responses.data ?? []).map((r: any) => {
    const categoryResults = (r.categoryResults ?? []).map((cr: any) => {
      if (cr.competencyId && !competencyMap[cr.competencyId]) {
        competencyMap[cr.competencyId] = { name: cr.competencyName ?? '', latestLevelId: cr.levelId, latestLevelName: cr.levelName ?? '', assessmentsCompleted: 0 };
      }
      if (cr.competencyId && competencyMap[cr.competencyId]) {
        competencyMap[cr.competencyId].latestLevelId = cr.levelId;
        competencyMap[cr.competencyId].latestLevelName = cr.levelName ?? '';
        competencyMap[cr.competencyId].assessmentsCompleted += 1;
      }
      return { categoryId: cr.categoryId, categoryName: cr.categoryName ?? null, competencyId: cr.competencyId, levelId: cr.levelId, levelName: cr.levelName ?? null };
    });
    return { responseId: r.id, assessmentId: r.assessmentId, assessmentTitle: r.assessmentTitle ?? null, submittedAt: r.submittedAt, categoryResults };
  });
  const competencySummaries = Object.entries(competencyMap).map(([compId, info]) => ({
    userId, competencyId: Number(compId), competencyName: info.name,
    latestLevelId: info.latestLevelId, latestLevelName: info.latestLevelName,
    assessmentsCompleted: info.assessmentsCompleted,
  }));
  return { userId, totalAssessmentsCompleted: responseHistory.length, competencySummaries, responseHistory };
}

async function consolidateGroup(report: Report, token: string): Promise<object> {
  const groupId = report.filterGroupId!;
  const group = await getGroupById(groupId, token);
  const members = await getGroupMembers(groupId, token);
  const memberList: any[] = Array.isArray(members) ? members : members.data ?? [];
  const competencyAverages: Record<number, { name: string; total: number; count: number }> = {};
  const memberBreakdown: any[] = [];
  let participatingMembers = 0;
  for (const member of memberList) {
    const responses = await getSubmittedResponsesByUser(member.id, token, report.filterDateFrom, report.filterDateTo);
    const respList: any[] = Array.isArray(responses) ? responses : responses.data ?? [];
    if (respList.length > 0) participatingMembers++;
    const memberCompetencies: Record<number, any> = {};
    for (const r of respList) {
      for (const cr of r.categoryResults ?? []) {
        memberCompetencies[cr.competencyId] = { userId: member.id, competencyId: cr.competencyId, competencyName: cr.competencyName ?? null, latestLevelId: cr.levelId, latestLevelName: cr.levelName ?? null, assessmentsCompleted: (memberCompetencies[cr.competencyId]?.assessmentsCompleted ?? 0) + 1 };
        if (!competencyAverages[cr.competencyId]) competencyAverages[cr.competencyId] = { name: cr.competencyName ?? '', total: 0, count: 0 };
        competencyAverages[cr.competencyId].total += cr.levelId ?? 0;
        competencyAverages[cr.competencyId].count += 1;
      }
    }
    memberBreakdown.push(...Object.values(memberCompetencies));
  }
  const totalMembers = memberList.length;
  const participationRate = totalMembers > 0 ? (participatingMembers / totalMembers) * 100 : 0;
  return {
    groupId, groupName: group.name ?? null, totalMembers, participatingMembers,
    participationRate: Math.round(participationRate * 10) / 10,
    competencyAverages: Object.entries(competencyAverages).map(([id, info]) => ({ competencyId: Number(id), competencyName: info.name, averageLevelId: Math.round(info.total / info.count), averageScore: Math.round((info.total / info.count) * 10) / 10 })),
    memberBreakdown,
  };
}

async function consolidateCompetency(report: Report, token: string): Promise<object> {
  const competencies = await getAllCompetencies(token);
  const competencyList: any[] = Array.isArray(competencies) ? competencies : competencies.data ?? [];
  const distributions = competencyList
    .filter((comp: any) => !report.filterCompetencyId || comp.id === report.filterCompetencyId)
    .map((comp: any) => ({ competencyId: comp.id, competencyName: comp.name ?? null, totalRespondents: 0, levelDistribution: [] }));
  return { totalRespondents: 0, competencyDistributions: distributions };
}

async function consolidateAssessment(report: Report, token: string): Promise<object> {
  const assessmentId = report.filterAssessmentId!;
  const assessments = await getAllAssessments(token);
  const assessmentList: any[] = Array.isArray(assessments) ? assessments : assessments.data ?? [];
  const assessment = assessmentList.find((a: any) => a.id === assessmentId) ?? {};
  const responses = await getResponsesByAssessment(assessmentId, token);
  const respList: any[] = Array.isArray(responses) ? responses : responses.data ?? [];
  const submitted = respList.filter((r: any) => r.status === 'SUBMITTED');
  const started = respList.filter((r: any) => ['IN_PROGRESS', 'SUBMITTED'].includes(r.status));
  const completionRate = started.length > 0 ? (submitted.length / started.length) * 100 : 0;
  return { assessmentId, assessmentTitle: assessment.title ?? null, totalStarted: started.length, totalCompleted: submitted.length, completionRate: Math.round(completionRate * 10) / 10, categoryBreakdowns: [] };
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function createReport(dto: CreateReportDto, userId: number, isAdmin: boolean): Promise<Report> {
  if (['GROUP', 'ASSESSMENT'].includes(dto.type) && !isAdmin) {
    throw Object.assign(new Error('Tipo de relatório exclusivo para ADMIN.'), { status: 403 });
  }
  const report = ReportRepository.create({
    type: dto.type as ReportType,
    status: 'PENDING' as ReportStatus,
    requestedByUserId: userId,
    ...buildFilters(dto),
  });
  if (!isAdmin) report.filterUserId = null;
  return ReportRepository.save(report);
}

export async function processReport(reportId: number, token: string): Promise<void> {
  const report = await ReportRepository.findOneOrFail({ where: { id: reportId } });
  await ReportRepository.update(reportId, { status: 'PROCESSING' });
  try {
    let data: object;
    switch (report.type) {
      case 'INDIVIDUAL': data = await consolidateIndividual(report, token); break;
      case 'GROUP':      data = await consolidateGroup(report, token); break;
      case 'COMPETENCY': data = await consolidateCompetency(report, token); break;
      case 'ASSESSMENT': data = await consolidateAssessment(report, token); break;
      default: throw new Error(`Tipo desconhecido: ${report.type}`);
    }
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);
    // Busca snapshot existente (upsert manual)
    const existing = await ReportSnapshotRepository.findOne({ where: { reportId } });
    if (existing) {
      await ReportSnapshotRepository.update(existing.id, { data });
    } else {
      const snapshot = ReportSnapshotRepository.create({ reportId, data });
      await ReportSnapshotRepository.save(snapshot);
    }
    await ReportRepository.update(reportId, { status: 'READY', readyAt: now, expiresAt });
  } catch (err) {
    console.error(`[ReportService] Falha ao processar #${reportId}:`, err);
    await ReportRepository.update(reportId, { status: 'FAILED' });
  }
}

export async function listReports(userId: number, isAdmin: boolean, type?: string, status?: string, page = 1, limit = 20) {
  const qb = ReportRepository.createQueryBuilder('r');
  if (!isAdmin) qb.where('r.requested_by_user_id = :userId', { userId });
  if (type)   qb.andWhere('r.type = :type', { type });
  if (status) qb.andWhere('r.status = :status', { status });
  qb.orderBy('r.created_at', 'DESC').skip((page - 1) * limit).take(limit);
  const [data, total] = await qb.getManyAndCount();
  return { data: data.map((r) => reportToResponse(r)), total, page, limit };
}

export async function listMyReports(userId: number, status?: string) {
  const where: any = { requestedByUserId: userId, type: 'INDIVIDUAL' };
  if (status) where.status = status;
  const reports = await ReportRepository.find({ where });
  return reports.map((r) => reportToResponse(r));
}

export async function getReport(reportId: number, userId: number, isAdmin: boolean) {
  const report = await ReportRepository.findOne({ where: { id: reportId } });
  if (!report) throw Object.assign(new Error('Relatório não encontrado.'), { status: 404 });
  if (!isAdmin && report.requestedByUserId !== userId) throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  // Busca snapshot separadamente (sem relação direta na entidade)
  const snapshot = await ReportSnapshotRepository.findOne({ where: { reportId } });
  return reportToResponse(report, snapshot?.data ?? null);
}

export async function deleteReport(reportId: number, userId: number, isAdmin: boolean) {
  const report = await ReportRepository.findOne({ where: { id: reportId } });
  if (!report) throw Object.assign(new Error('Relatório não encontrado.'), { status: 404 });
  if (!isAdmin && report.requestedByUserId !== userId) throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  // Remove snapshot primeiro por FK
  await ReportSnapshotRepository.delete({ reportId });
  await ReportRepository.remove(report);
}

export async function getMyProgress(userId: number, token: string, competencyId?: number, dateFrom?: string, dateTo?: string) {
  const responses = await getSubmittedResponsesByUser(userId, token, dateFrom, dateTo);
  const respList: any[] = Array.isArray(responses) ? responses : responses.data ?? [];
  const progressMap: Record<number, any> = {};
  for (const r of respList.sort((a: any, b: any) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())) {
    for (const cr of r.categoryResults ?? []) {
      if (competencyId && cr.competencyId !== competencyId) continue;
      if (!progressMap[cr.competencyId]) {
        progressMap[cr.competencyId] = { userId, competencyId: cr.competencyId, competencyName: cr.competencyName ?? null, entries: [] };
      }
      progressMap[cr.competencyId].entries.push({ responseId: r.id, assessmentId: r.assessmentId, levelId: cr.levelId, levelName: cr.levelName ?? null, achievedAt: r.submittedAt });
    }
  }
  return Object.values(progressMap);
}
