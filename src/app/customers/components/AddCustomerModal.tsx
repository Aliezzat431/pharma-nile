import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type CustomerFormValues = z.infer<typeof customerSchema>;

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: (data: CustomerFormValues) => Promise<void>;
}

export function AddCustomerModal({ isOpen, onClose, onAddCustomer }: AddCustomerModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { name: '', phone: '', email: '', address: '' }
  });

  const onSubmit = async (data: CustomerFormValues) => {
    await onAddCustomer(data);
    reset();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass-panel p-8 border border-[var(--glass-border)] text-right z-10"
          >
            <div className="flex items-center justify-between mb-8">
              <button type="button" onClick={onClose} className="p-2 hover:bg-[var(--glass-surface)] rounded-full transition-colors text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold font-cairo">إضافة عميل جديد</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 font-cairo ml-1 block">الاسم بالكامل</label>
                <input 
                  type="text" 
                  {...register("name")}
                  className={cn(
                    "w-full bg-[var(--glass-surface)] border focus:border-[var(--nile-teal)]/50 outline-none rounded-2xl p-4 font-cairo text-lg text-right text-white",
                    errors.name ? "border-red-500" : "border-[var(--glass-border)]"
                  )}
                />
                {errors.name && <p className="text-red-400 text-xs font-cairo">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo ml-1 block">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    {...register("email")}
                    className={cn(
                      "w-full bg-[var(--glass-surface)] border focus:border-[var(--nile-teal)]/50 outline-none rounded-2xl p-4 text-right text-white",
                      errors.email ? "border-red-500" : "border-[var(--glass-border)]"
                    )}
                  />
                  {errors.email && <p className="text-red-400 text-xs font-cairo">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo ml-1 block">رقم الهاتف</label>
                  <input 
                    type="text" 
                    {...register("phone")}
                    className={cn(
                      "w-full bg-[var(--glass-surface)] border focus:border-[var(--nile-teal)]/50 outline-none rounded-2xl p-4 text-right text-white font-sans",
                      errors.phone ? "border-red-500" : "border-[var(--glass-border)]"
                    )}
                  />
                  {errors.phone && <p className="text-red-400 text-xs font-cairo">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 font-cairo ml-1 block">العنوان بالتفصيل</label>
                <input 
                  type="text" 
                  {...register("address")}
                  className={cn(
                    "w-full bg-[var(--glass-surface)] border focus:border-[var(--nile-teal)]/50 outline-none rounded-2xl p-4 font-cairo text-right text-white",
                    errors.address ? "border-red-500" : "border-[var(--glass-border)]"
                  )}
                />
                {errors.address && <p className="text-red-400 text-xs font-cairo">{errors.address.message}</p>}
              </div>

              <button type="submit" className="w-full nile-button py-5 font-bold text-xl mt-4 font-cairo cursor-pointer">
                حفظ بيانات العميل
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
