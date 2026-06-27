import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { debtPaymentSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Debtor } from '@/lib/api/debts';

type PaymentFormValues = z.infer<typeof debtPaymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDebtor: Debtor | null;
  onRecordPayment: (data: PaymentFormValues) => Promise<void>;
}

export function PaymentModal({ isOpen, onClose, selectedDebtor, onRecordPayment }: PaymentModalProps) {
  const { register: registerPayment, handleSubmit: handleSubmitPayment, formState: { errors: errorsPayment }, reset: resetPayment, setValue: setPaymentValue, watch: watchPayment } = useForm<PaymentFormValues>({
    resolver: zodResolver(debtPaymentSchema) as any,
    defaultValues: { payment_type: 'partial', note: '' }
  });
  const currentPaymentType = watchPayment('payment_type');

  const onSubmit = async (data: PaymentFormValues) => {
    await onRecordPayment(data);
    resetPayment();
  };

  // Allow passing down a reset prop manually when modal opens, or handle it higher up
  React.useEffect(() => {
    if (isOpen) {
      resetPayment();
    }
  }, [isOpen, resetPayment]);

  if (!isOpen || !selectedDebtor) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="relative w-full max-w-md glass-panel p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl z-10 text-right"
      >
        <h2 className="text-2xl font-bold font-cairo mb-1 text-white">تسجيل عملية سداد</h2>
        <p className="text-gray-400 font-cairo text-sm mb-6">العميل: <span className="text-[#00CED1] font-bold">{selectedDebtor.name}</span></p>
        
        <form onSubmit={handleSubmitPayment(onSubmit)} className="space-y-6">
           <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 font-cairo block">المبلغ المسدد</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.01" 
                {...registerPayment('amount')}
                className={cn(
                  "w-full bg-white/5 border outline-none rounded-xl p-3 pr-4 pl-12 text-2xl font-bold text-[#00CED1] font-sans text-left",
                  errorsPayment.amount ? "border-red-500" : "border-white/10"
                )}
                placeholder="0.00" 
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-cairo text-xs">ج.م</span>
            </div>
            {errorsPayment.amount && <p className="text-red-400 text-xs font-cairo">{errorsPayment.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 font-cairo block">نوع السداد</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setPaymentValue('payment_type', 'partial')}
                className={`py-3 rounded-xl font-cairo text-sm border transition-all ${currentPaymentType === 'partial' ? 'bg-[#00CED1]/10 border-[#00CED1] text-[#00CED1] font-bold' : 'bg-white/5 border-white/10 text-gray-400'}`}
              >سداد جزئي</button>
              <button 
                type="button"
                onClick={() => {
                  setPaymentValue('payment_type', 'full');
                  setPaymentValue('amount', selectedDebtor.total_debt);
                }}
                className={`py-3 rounded-xl font-cairo text-sm border transition-all ${currentPaymentType === 'full' ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-white/5 border-white/10 text-gray-400'}`}
              >كلي (تصفية الحساب)</button>
            </div>
            {errorsPayment.payment_type && <p className="text-red-400 text-xs font-cairo">{errorsPayment.payment_type.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 font-cairo block">ملاحظات (اختياري)</label>
            <textarea 
              {...registerPayment('note')}
              className={cn(
                "w-full bg-white/5 border outline-none rounded-xl p-3 font-cairo resize-none h-20 text-white focus:border-[#00CED1] text-sm",
                errorsPayment.note ? "border-red-500" : "border-white/10"
              )}
              placeholder="مثال: استلام نقدي بموجب إيصال" 
            />
            {errorsPayment.note && <p className="text-red-400 text-xs font-cairo">{errorsPayment.note.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-[#00CED1] text-black py-3 rounded-xl font-bold font-cairo hover:bg-[#00CED1]/90 transition-colors">تأكيد السداد</button>
            <button type="button" onClick={onClose} className="px-4 bg-white/5 border border-white/10 text-white rounded-xl font-cairo hover:bg-white/10">إلغاء</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
