'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { 
  Palette, 
  Moon, 
  Sun, 
  Coffee, 
  Waves, 
  Trees, 
  Zap, 
  Ghost, 
  CloudSnow, 
  Check,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = [
  { id: 'dark', label: 'الوضع الليلي (Default)', icon: Moon, color: '#050505' },
  { id: 'light', label: 'الوضع النهاري', icon: Sun, color: '#f8fafc' },
  { id: 'midnight', label: 'منتصف الليل', icon: Waves, color: '#020612' },
  { id: 'ocean', label: 'أعماق المحيط', icon: Waves, color: '#010b14' },
  { id: 'forest', label: 'الغابة العميقة', icon: Trees, color: '#040d0a' },
  { id: 'coffee', label: 'وضع القهوة', icon: Coffee, color: '#140d0b' },
  { id: 'amethyst', label: 'الجمشت الملكي', icon: Sparkles, color: '#0d0b1a' },
  { id: 'sunset', label: 'وقت الغروب', icon: Zap, color: '#140806' },
  { id: 'cyberpunk', label: 'سايبر بانك', icon: Zap, color: '#000000' },
  { id: 'dracula', label: 'دراكولا', icon: Ghost, color: '#1e1f29' },
  { id: 'snowy', label: 'وضوح الثلج', icon: CloudSnow, color: '#f8fafc' },
];

export default function ThemeToggle({ align = "right" }: { align?: "left" | "right" | "sidebar" }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const getDropdownClasses = () => {
    if (align === "sidebar") {
      return "absolute bottom-10 right-full mr-4"; 
    }
    return align === "left" ? "absolute left-0 mt-3" : "absolute right-0 mt-3";
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] rounded-xl border border-[var(--glass-border)] text-[var(--foreground)] transition-all group shadow-lg backdrop-blur-md w-full"
      >
        <Palette className="w-5 h-5 text-[var(--nile-teal)] group-hover:rotate-12 transition-transform shrink-0" />
        <span className="text-xs font-bold font-cairo truncate">المظهر</span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-inactive)] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, x: align === "sidebar" ? 20 : 0, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, x: align === "sidebar" ? 20 : 0, scale: 0.95 }}
              className={`${getDropdownClasses()} w-64 glass-panel border-[var(--glass-border)] z-50 p-2 shadow-2xl overflow-hidden`}
            >
              <div className="grid grid-cols-1 gap-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      theme === t.id 
                      ? 'bg-[var(--nile-teal)]/10 border border-[var(--nile-teal)]/20' 
                      : 'hover:bg-[var(--glass-surface)]'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner"
                      style={{ backgroundColor: t.color }}
                    >
                      <t.icon className={`w-4 h-4 ${theme === t.id ? 'text-[var(--nile-teal)]' : 'text-[var(--text-inactive)]'}`} />
                      {theme === t.id && (
                        <div className="absolute inset-0 border-2 border-[var(--nile-teal)] rounded-lg pointer-events-none" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-right">
                      <p className={`text-xs font-bold font-cairo ${theme === t.id ? 'text-[var(--nile-teal)]' : 'text-[var(--text-secondary)]'}`}>
                        {t.label}
                      </p>
                    </div>

                    {theme === t.id && <Check className="w-4 h-4 text-[var(--nile-teal)]" />}
                  </button>
                ))}
              </div>

              <div className="mt-2 p-2 border-t border-[var(--divider)]">
                <p className="text-[10px] text-center text-[var(--text-inactive)] font-bold opacity-50 uppercase tracking-widest">Premium Themes Pack</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
