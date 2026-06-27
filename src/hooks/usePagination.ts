'use client';

import { useState, useMemo, useEffect } from 'react';

export interface UsePaginationOptions {
  pageSize?: number;
}

export function usePagination<T>(data: T[], options: UsePaginationOptions = {}) {
  const { pageSize = 15 } = options;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever the underlying data changes (filter / search)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  return {
    paginatedData,
    currentPage,
    totalPages,
    totalItems: data.length,
    pageSize,
    setPage: setCurrentPage,
  };
}
