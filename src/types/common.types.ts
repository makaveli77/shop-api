export interface PaginationMeta {
  current_page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_prev_page: boolean;
  has_next_page: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorResponse {
  status: string;
  message?: string;
  errors?: string[];
  stack?: string;
}

export interface DatabaseQueryResult<T> {
  rows: T[];
  totalCount?: number;
}
