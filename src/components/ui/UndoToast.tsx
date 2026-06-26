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
          <div className="glass-panel border-[#00CED1]/30 p-4 flex items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00CED1]/10 flex items-center justify-center text-[#00CED1]">
                <RotateCcw className={`w-5 h-5 ${isUndoing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-white font-bold font-cairo">هل ترغب في التراجع؟</p>
                <p className="text-xs text-gray-400 font-cairo">تم تنفيذ عملية {action.type === 'SALE' ? 'بيع' : 'تعديل مخزون'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={isUndoing}
                className="px-4 py-2 bg-[#00CED1] text-black rounded-xl font-bold font-cairo hover:bg-[#47eaed] transition-colors disabled:opacity-50"
              >
                تراجع
              </button>
              <button 
                onClick={() => undoManager.clear()}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {}
            <motion.div 
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 10, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 bg-[#00CED1] origin-left w-full rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

