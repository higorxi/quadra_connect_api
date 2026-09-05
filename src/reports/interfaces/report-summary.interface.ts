import {
  ReportModule,
  ReportStatus,
} from '../../../generated/prisma/client/client';

export interface ReportSummary {
  id: string;
  companyId: string;
  module: ReportModule;
  status: ReportStatus;
  filters: Record<string, unknown>;
  startDate: Date | null;
  endDate: Date | null;
  rowCount: number | null;
  result: ReportResult | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface ReportResult {
  summary: Record<string, string | number>;
  columns: string[];
  rows: Record<string, string | number | null>[];
  truncated: boolean;
}

export interface PaginatedReports {
  data: ReportSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
