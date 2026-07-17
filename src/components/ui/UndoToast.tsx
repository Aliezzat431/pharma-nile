'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, X } from 'lucide-react';
import { undoManager, UndoAction } from '@/lib/undo-manager';

export default function UndoToast() {
  const [action, setAction] = useState<UndoAction | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    return undoManager.subscribe((newAction) => {
      setAction(newAction);
    });
  }, []);

  const handleUndo = async () => {
    setIsUndoing(true);
    const result = await undoManager.undo();
    setIsUndoing(false);

    alert(result.message);
  };

  return (
    <AnimatePresence>
      {action && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] min-w-[320px]"
        >
          <div 
            className="glass-panel p-4 flex items-center justify-between gap-6 shadow-2xl backdrop-blur-xl border border-[var(--nile-teal)]"
            style={{ backgroundColor: 'var(--glass-surface-heavy)' }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center neon-glow-teal"
                style={{ backgroundColor: 'var(--nile-teal-glow)', color: 'var(--nile-teal)' }}
              >
                <RotateCcw className={`w-5 h-5 ${isUndoing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-[var(--text-primary)] font-bold font-cairo">هل ترغب في التراجع؟</p>
                <p className="text-xs text-[var(--text-secondary)] font-cairo">تم تنفيذ عملية {action.type === 'SALE' ? 'بيع' : 'تعديل مخزون'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={isUndoing}
                className="px-4 py-2 rounded-xl font-bold font-cairo hover:brightness-110 transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--nile-teal)', color: 'var(--background)' }}
              >
                تراجع
              </button>
              <button 
                onClick={() => undoManager.clear()}
                className="p-2 text-[var(--text-inactive)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {}
            <motion.div 
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 10, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 origin-left w-full rounded-full"
              style={{ backgroundColor: 'var(--nile-teal)' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
