import { Project } from '@/models/Project';

export interface GetProjectsOptions {
  analystId?: string;
  role?: string;
  // Paginación
  page?: number;
  limit?: number;
  offset?: number;
  // Filtros
  searchTerm?: string;
  teamFilter?: string;
  statusFilter?: string;
  analystFilter?: string;
  monthFilter?: number;
  yearFilter?: number;
}

export interface PaginatedProjectsResult {
  data: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
