import React from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Debtor, DebtPayment } from '@/lib/api/debts';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDebtor: Debtor | null;
  paymentHistory: DebtPayment[];
  historyLoading: boolean;
}

export function HistoryModal({ isOpen, onClose, selectedDebtor, paymentHistory, historyLoading }: HistoryModalProps) {
  if (!isOpen || !selectedDebtor) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
        className="relative w-full max-w-2xl glass-panel p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl z-10 max-h-[80vh] flex flex-col text-right"
      >
        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
          <h2 className="text-2xl font-bold font-cairo text-white">سجل الدفعات للعميل: {selectedDebtor.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pl-1">
          {historyLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00CED1] w-8 h-8" /></div>
          ) : paymentHistory.length > 0 ? (
            paymentHistory.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                 <div>
                    <p className="font-bold text-[#00CED1] text-lg font-sans">{(p.amount || 0).toLocaleString()} ج.م</p>
                    <p className="text-xs text-gray-500 font-cairo mt-0.5">{new Date(p.payment_date).toLocaleString('ar-EG')}</p>
                    {p.note && <p className="text-xs text-gray-400 font-cairo mt-1 bg-white/5 px-2 py-1 rounded-md inline-block opacity-90">{p.note}</p>}
                 </div>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-cairo ${p.payment_type === 'full' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-blue-500/20 text-blue-400'}`}>
                    {p.payment_type === 'full' ? 'تصفية كاملة' : 'سداد جزئي'}
                 </span>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-500 font-cairo text-sm">لا توجد عمليات سداد مسجلة لهذا العميل حتى الآن.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
