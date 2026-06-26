import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface PillsConfirmModalProps {
  isOpen: boolean;
  type: 'UNIT_CHANGE' | 'CHECKOUT' | null;
  items: any[];
  currentIndex: number;
  pendingTargetUnit?: string;
  pillsInput: string;
  setPillsInput: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onConfirm: () => void;
}

export function PillsConfirmModal({
  isOpen,
  type,
  items,
  currentIndex,
  pendingTargetUnit,
  pillsInput,
  setPillsInput,
  onClose,
  onConfirm,
}: PillsConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card w-full max-w-md overflow-hidden relative border border-[#00CED1]/30"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h2 className="text-xl font-bold font-cairo text-white">تأكيد كمية الوحدة</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-300 font-cairo mb-6 leading-relaxed">
              {type === 'UNIT_CHANGE'
                ? `أنت تحاول تغيير الوحدة إلى "${pendingTargetUnit}" للمنتج "${items[0]?.name}".`
                : `عملية الدفع تتطلب تأكيد كمية وحدة "${items[currentIndex]?.unit}" للمنتج "${items[currentIndex]?.name}".`
              }
              <br /><br />
              كم <strong>{type === 'UNIT_CHANGE' ? pendingTargetUnit : items[currentIndex]?.unit}</strong> في الشريط الواحد؟
            </p>

            <div className="flex items-center gap-4 mb-2">
              <input
                type="number"
                value={pillsInput}
                onChange={(e) => setPillsInput(e.target.value)}
                className="w-full bg-[#050505]/50 border border-white/20 rounded-xl px-4 py-3 text-2xl text-center text-[#00CED1] font-bold outline-none focus:border-[#00CED1] transition-colors"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
              />
            </div>

            {type === 'CHECKOUT' && items.length > 1 && (
              <div className="text-xs text-gray-500 font-cairo text-center mt-4 bg-white/5 py-1 px-3 rounded-full inline-block mx-auto">
                منتج {currentIndex + 1} من {items.length}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 flex gap-3 bg-[#050505]/50">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-cairo text-gray-400 hover:bg-white/5 transition-colors border border-white/10"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl font-cairo text-white bg-[#00CED1]/20 border border-[#00CED1]/50 hover:bg-[#00CED1]/40 transition-colors font-bold"
            >
              تأكيد
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
