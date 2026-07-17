'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, ShoppingCart, Package, Users, Settings, History, X, Command, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const commands = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', href: '/', shortcut: 'D' },
  { icon: ShoppingCart, label: 'نقطة البيع', href: '/pos', shortcut: 'P' },
  { icon: Package, label: 'المخزون', href: '/inventory', shortcut: 'I' },
  { icon: Users, label: 'العملاء', href: '/customers', shortcut: 'C' },
  { icon: AlertCircle, label: 'النواقص', href: '/shortages', shortcut: 'A' },
  { icon: History, label: 'المرتجعات', href: '/returns', shortcut: 'R' },
  { icon: Settings, label: 'الإعدادات', href: '/settings', shortcut: 'S' },
];

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      if (filteredCommands[selectedIndex]) {
        router.push(filteredCommands[selectedIndex].href);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
            style={{ background: 'var(--surface-overlay)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-xl glass-card-heavy overflow-hidden shadow-2xl relative z-10 border-[var(--glass-border)]"
          >
            <div className="p-4 border-b border-[var(--divider)] flex items-center gap-3">
              <Search className="w-5 h-5 text-[var(--text-inactive)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ابحث عن صفحة أو عملية... (مثلاً: بيع، عملاء)"
                className="flex-1 bg-transparent border-none outline-none text-[var(--foreground)] text-lg font-cairo placeholder:text-[var(--text-inactive)]"
              />
              <button 
                onClick={onClose}
                className="p-1 hover:bg-[var(--glass-surface)] rounded-lg text-[var(--text-inactive)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
              {filteredCommands.length > 0 ? (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, i) => (
                    <button
                      key={cmd.href}
                      onClick={() => {
                        router.push(cmd.href);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                        i === selectedIndex 
                        ? 'bg-[var(--nile-teal)]/10 text-[var(--nile-teal)] border border-[var(--nile-teal)]/20' 
                        : 'text-[var(--text-muted)] hover:bg-[var(--glass-surface)] hover:text-[var(--foreground)] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <cmd.icon className={`w-5 h-5 ${i === selectedIndex ? 'text-[var(--nile-teal)]' : 'text-[var(--text-inactive)]'}`} />
                        <span className="font-cairo font-bold">{cmd.label}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-50">
                        <Command className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{cmd.shortcut}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--glass-surface)] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-[var(--text-inactive)]" />
                  </div>
                  <p className="text-[var(--text-inactive)] font-cairo">لم نجد أي نتائج لـ "{query}"</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--divider)] bg-transparent flex items-center justify-between text-[10px] text-[var(--text-inactive)] font-bold tracking-widest uppercase">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-[var(--glass-surface)] border border-[var(--glass-border)]">ESC</span> ليك</span>
                <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-[var(--glass-surface)] border border-[var(--glass-border)]">ENTER</span> انتقال</span>
              </div>
             
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
