'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'اختر...',
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-cairo border transition-all duration-200
          bg-[var(--glass-surface)] border-[var(--glass-border)]
          text-[var(--text-secondary)] hover:border-[var(--nile-teal)]/60
          hover:bg-[var(--nile-teal)]/8 hover:text-[var(--text-primary)]
          focus:outline-none focus:border-[var(--nile-teal)] focus:shadow-[0_0_0_2px_var(--nile-teal-glow)]
          ${isOpen ? 'border-[var(--nile-teal)] text-[var(--text-primary)] bg-[var(--nile-teal)]/10' : ''}
          min-w-[130px] whitespace-nowrap`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex-1 text-right truncate">{selectedLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 text-[var(--text-muted)] ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel — opens downward, floats above content via z-index */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full mt-2 right-0 z-[200] min-w-[200px] max-h-[280px] overflow-y-auto rounded-2xl
              border border-[var(--glass-border)]
              shadow-[0_20px_60px_rgba(0,0,0,0.5)]
              backdrop-blur-2xl"
            style={{ background: 'var(--glass-surface-heavy)' }}
            role="listbox"
          >
            <div className="p-1.5 space-y-0.5">
              {options.map(opt => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-cairo text-right
                      transition-all duration-150
                      ${isActive
                        ? 'bg-[var(--nile-teal)]/20 text-[var(--nile-teal)] font-bold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--nile-teal)]/10 hover:text-[var(--text-primary)]'
                      }`}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
