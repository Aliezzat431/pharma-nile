'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = '',
}: PaginationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLSpanElement>(null);
  const prevPage = useRef(currentPage);

  
  useEffect(() => {
    if (!pageRef.current) return;
    const direction = currentPage > prevPage.current ? 1 : -1;
    prevPage.current = currentPage;

    gsap.fromTo(
      pageRef.current,
      { y: direction * -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out' }
    );
  }, [currentPage]);

  
  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.1 }
    );
  }, []);

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const from = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const to = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div ref={containerRef} className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`} dir="rtl">
      {}
      {totalItems != null && from != null && to != null && (
        <p className="text-sm text-gray-500 font-cairo">
          عرض <span className="text-white font-bold">{from}</span> – <span className="text-white font-bold">{to}</span> من <span className="text-[#00CED1] font-bold">{totalItems}</span> عنصر
        </p>
      )}

      {}
      <div className="flex items-center gap-1.5">
        {}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/5 hover:border-white/20"
          aria-label="الصفحة الأولى"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/5 hover:border-white/20"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {}
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`dot-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-600 text-sm">
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page as number)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all border ${
                currentPage === page
                  ? 'bg-[#00CED1]/15 border-[#00CED1]/50 text-[#00CED1] shadow-[0_0_12px_rgba(0,206,209,0.2)]'
                  : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {currentPage === page ? (
                <span ref={pageRef} style={{ display: 'inline-block' }}>
                  {page}
                </span>
              ) : (
                page
              )}
            </button>
          )
        )}

        {}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/5 hover:border-white/20"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/5 hover:border-white/20"
          aria-label="الصفحة الأخيرة"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
