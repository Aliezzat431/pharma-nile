'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface GlassTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export default function GlassTable<T>({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = 'لا توجد بيانات متاحة',
  onRowClick
}: GlassTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto glass-panel border-[var(--glass-border)] scrollbar-thin scrollbar-thumb-[var(--glass-surface-heavy)] scrollbar-track-transparent">
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="border-b border-[var(--glass-border)] bg-[var(--glass-surface)]">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={`p-5 text-muted font-bold font-cairo text-sm uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((_, idx) => (
                  <td key={idx} className="p-5">
                    <div className="h-4 bg-[var(--glass-surface)] rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length > 0 ? (
            data.map((item, rowIdx) => (
              <motion.tr
                key={rowIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rowIdx * 0.05 }}
                onClick={() => onRowClick?.(item)}
                className={`transition-all duration-200 group ${onRowClick ? 'cursor-pointer hover:bg-[var(--glass-surface-heavy)]' : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`p-5 text-sm font-medium ${col.className || ''}`}>
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="p-12 text-center text-muted font-cairo italic">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

