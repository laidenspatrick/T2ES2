export type ReportType = 'INDIVIDUAL' | 'GROUP' | 'COMPETENCY' | 'ASSESSMENT';
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type ExportFormat = 'PDF' | 'CSV' | 'XLSX';
export type ExportStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface ReportFilters {
  assessmentId?: number | null;
  userId?: number | null;
  groupId?: number | null;
  competencyId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface Report {
  id: number;
  type: ReportType;
  status: ReportStatus;
  requestedByUserId: number;
  filters: ReportFilters;
  createdAt: string;
  readyAt: string | null;
  expiresAt: string | null;
  data?: object | null;
}

export interface PaginatedReports {
  data: Report[];
  total: number;
  page: number;
  limit: number;
}

export interface ExportJob {
  id: number;
  reportId: number;
  format: ExportFormat;
  status: ExportStatus;
  downloadUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
  readyAt: string | null;
}

export interface ProgressEntry {
  responseId: number;
  assessmentId: number;
  levelId: number;
  levelName: string | null;
  achievedAt: string;
}

export interface CompetencyProgress {
  userId: number;
  competencyId: number;
  competencyName: string | null;
  entries: ProgressEntry[];
}

export interface DashboardSummary {
  totalUsers: number;
  totalGroups: number;
  totalAssessments: number;
  totalCompetencies: number;
  completedAssessments: number;
  competencyDistributions: {
    competencyId: number;
    competencyName: string;
    levelDistribution: { levelId: number; count: number }[];
  }[];
  groupProgress: {
    groupId: number;
    groupName: string;
    totalMembers: number | null;
    assessmentsCompleted: number;
  }[];
}

export interface TopPerformer {
  userId: number;
  levelId: number;
  levelName: string | null;
}

export interface CompletionRate {
  assessmentId: number;
  assessmentTitle: string | null;
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
}

// Contexto injetado pelo Shell App
export interface ShellAuthContext {
  token: string;
  userId: number;
  email: string;
  roles: string[];
}
