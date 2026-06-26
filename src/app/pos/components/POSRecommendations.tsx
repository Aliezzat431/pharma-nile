'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Sparkles } from 'lucide-react';
import { Product } from '@/lib/api/products';

interface POSRecommendationsProps {
  suggestions: Product[];
  visible: boolean;
  onSelect: (product: Product) => void;
  loading: boolean;
}

export function POSRecommendations({ suggestions, visible, onSelect, loading }: POSRecommendationsProps) {
  if (!visible || (suggestions.length === 0 && !loading)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute z-[100] top-full left-0 right-0 mt-2 bg-[#0d0d0d] border border-white/10 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] overflow-hidden backdrop-blur-xl"
    >
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-gray-500 font-cairo flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-[var(--royal-gold)]" /> اقتراحات ذكية
        </span>
        {loading && (
          <div className="w-3 h-3 border-2 border-[var(--nile-teal)] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
        {suggestions.length === 0 && !loading ? (
          <div className="px-4 py-6 text-center">
            <p className="text-gray-500 text-sm font-cairo">لم يتم العثور على نتائج دقيقة...</p>
          </div>
        ) : (
          suggestions.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full text-right px-4 py-3 border-b border-white/[0.03] hover:bg-[var(--nile-teal)]/10 transition-colors flex items-center justify-between group"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-white group-hover:text-[var(--nile-teal)] transition-colors font-cairo">
                  {p.name}
                </span>
                <span className="text-[10px] text-gray-500 font-cairo">
                  {p.company} • {(p as any).pharmacy_name} • {p.total_quantity} {p.unit} متوفر
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[var(--royal-gold)] font-bold block text-xs">{p.current_price} ج.م</span>
                  {p.activeBatches && p.activeBatches.length > 0 && (
                    <span className="text-[9px] text-emerald-500/70 block">تشغيلة متاحة</span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[var(--nile-teal)]/20 transition-colors">
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-[var(--nile-teal)]" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}
