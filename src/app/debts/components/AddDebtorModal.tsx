import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { debtorSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';

type DebtorFormValues = z.infer<typeof debtorSchema>;

interface AddDebtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDebtor: (data: DebtorFormValues) => Promise<void>;
}

export function AddDebtorModal({ isOpen, onClose, onAddDebtor }: AddDebtorModalProps) {
  const { register: registerAdd, handleSubmit: handleSubmitAdd, formState: { errors: errorsAdd }, reset: resetAdd } = useForm<DebtorFormValues>({
    resolver: zodResolver(debtorSchema) as any,
    defaultValues: { name: '', phone: '' }
  });

  const onSubmit = async (data: DebtorFormValues) => {
    await onAddDebtor(data);
    resetAdd();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md glass-panel p-8 bg-[#0a0a0a] border border-[var(--glass-border)] rounded-2xl z-10 text-right"
      >
        <h2 className="text-2xl font-bold font-cairo mb-6 text-white">إضافة عميل ديون جديد</h2>
        <form onSubmit={handleSubmitAdd(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 font-cairo block">اسم العميل بالكامل</label>
            <input 
              type="text" 
              {...registerAdd('name')}
              className={cn(
                "w-full bg-[var(--glass-surface)] border outline-none rounded-xl p-3 font-cairo text-white focus:border-[var(--nile-teal)] transition-colors",
                errorsAdd.name ? "border-red-500" : "border-[var(--glass-border)]"
              )}
            />
            {errorsAdd.name && <p className="text-red-400 text-xs font-cairo">{errorsAdd.name.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 font-cairo block">رقم الهاتف</label>
            <input 
              type="text" 
              {...registerAdd('phone')}
              className={cn(
                "w-full bg-[var(--glass-surface)] border outline-none rounded-xl p-3 text-white focus:border-[var(--nile-teal)] transition-colors font-sans",
                errorsAdd.phone ? "border-red-500" : "border-[var(--glass-border)]"
              )}
              placeholder="01xxxxxxxxx" 
            />
            {errorsAdd.phone && <p className="text-red-400 text-xs font-cairo">{errorsAdd.phone.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-[var(--nile-teal)] text-black py-3 rounded-xl font-bold font-cairo hover:bg-[var(--nile-teal)]/90 transition-colors">إضافة العميل</button>
            <button type="button" onClick={onClose} className="px-4 bg-[var(--glass-surface)] border border-[var(--glass-border)] text-white rounded-xl font-cairo hover:bg-[var(--glass-surface-heavy)]">إلغاء</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
