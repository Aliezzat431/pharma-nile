'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { supabase } from '@/lib/supabase';
import { Search, Star, BadgePlus, Loader2 } from 'lucide-react';

interface ProductSuggestion {
  id: string;
  name: string;
  type?: string;
  company?: string;
}

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: ProductSuggestion | null) => void;
  pharmacyId: string | undefined;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ProductAutocomplete({
  value,
  onChange,
  onSelect,
  pharmacyId,
  disabled = false,
  placeholder = 'اسم الدواء أو المستلزم...',
  className = '',
}: ProductAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animate dropdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (!dropdownRef.current) return;
    if (open && suggestions.length > 0) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -8, scaleY: 0.92, transformOrigin: 'top center' },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.22, ease: 'power2.out' }
      );
    }
  }, [open, suggestions.length]);

  // ── Fetch suggestions on keystroke ────────────────────────────────────
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!pharmacyId || query.trim().length < 2) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, type, company')
          .eq('pharmacy_id', pharmacyId)
          .ilike('name', `%${query}%`)
          .limit(8);
        setSuggestions(data || []);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [pharmacyId]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 200);
  };

  // ── Keyboard navigation ───────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      pick(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const pick = (product: ProductSuggestion) => {
    onChange(product.name);
    onSelect(product);
    setOpen(false);
    setSuggestions([]);
  };

  // ── Close on outside click ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isNew = !suggestions.find(
    (s) => s.name.toLowerCase() === value.toLowerCase()
  );
  const showNewBadge = value.trim().length >= 2 && !loading;

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim().length >= 2 && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--nile-teal)]/50 font-cairo pr-8 transition-all"
        />
        {loading ? (
          <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 animate-spin" />
        ) : (
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
        )}
      </div>

      {/* Status badge */}
      {showNewBadge && value.trim().length >= 2 && (
        <div className="absolute -top-1.5 right-2 z-10">
          {isNew ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-cairo">
              <BadgePlus className="w-2.5 h-2.5" /> جديد
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-cairo">
              <Star className="w-2.5 h-2.5" /> موجود
            </span>
          )}
        </div>
      )}

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1.5 right-0 left-0 bg-[#0d0d0d] border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden"
        >
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-white/5 flex items-center gap-2">
            <Search className="w-3 h-3 text-[var(--nile-teal)]" />
            <span className="text-[10px] text-gray-500 font-cairo">
              {suggestions.length} نتيجة مطابقة في مخزونك
            </span>
          </div>

          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pick(s); }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`w-full text-right flex items-center gap-3 px-3 py-2.5 transition-colors ${
                activeIdx === i
                  ? 'bg-[var(--nile-teal)]/10 text-white'
                  : 'hover:bg-white/5 text-gray-200'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold font-cairo truncate">{s.name}</p>
                {(s.type || s.company) && (
                  <p className="text-[10px] text-gray-500 truncate font-cairo">
                    {[s.type, s.company].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
              {activeIdx === i && (
                <span className="text-[9px] text-[var(--nile-teal)] font-bold flex-shrink-0 font-cairo">
                  Enter ↵
                </span>
              )}
            </button>
          ))}

          {/* "New product" option at bottom */}
          {isNew && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(null); setOpen(false); }}
              className="w-full text-right flex items-center gap-3 px-3 py-2.5 border-t border-white/5 hover:bg-emerald-500/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <BadgePlus className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold font-cairo text-emerald-400 truncate">
                  إضافة "{value}" كمنتج جديد
                </p>
                <p className="text-[10px] text-gray-500 font-cairo">سيتم إنشاؤه عند الحفظ</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
