export interface ReportFilters {
  assessmentId?: number | null;
  userId?: number | null;
  groupId?: number | null;
  competencyId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface CreateReportDto {
  type: 'INDIVIDUAL' | 'GROUP' | 'COMPETENCY' | 'ASSESSMENT';
  filters?: ReportFilters;
}

export interface CreateExportDto {
  format: 'PDF' | 'CSV' | 'XLSX';
}
