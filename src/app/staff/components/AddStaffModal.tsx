import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { staffCreateSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Users as UsersIcon, Mail, UserPlus, X, Loader2 } from 'lucide-react';

type StaffFormValues = z.infer<typeof staffCreateSchema>;

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaff: (data: StaffFormValues) => Promise<void>;
  addLoading: boolean;
}

export function AddStaffModal({ isOpen, onClose, onAddStaff, addLoading }: AddStaffModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<StaffFormValues>({
    resolver: zodResolver(staffCreateSchema) as any,
    defaultValues: { email: '', password: '', full_name: '', role: 'staff' }
  });

  const onSubmit = async (data: StaffFormValues) => {
    await onAddStaff(data);
    reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-xl p-8 z-10 border-white/10 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#00CED1]/10 rounded-2xl text-[#00CED1]">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-cairo text-white">موظف جديد</h2>
              <p className="text-gray-400 text-sm font-cairo">أنشئ حساباً جديداً لأحد أفراد العمل</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4 text-right">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo block">الاسم الكامل</label>
              <div className={cn("glass-panel p-3 flex items-center gap-3", errors.full_name && "border-red-500/50")}>
                <UsersIcon className="w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  {...register("full_name")}
                  className="flex-1 bg-transparent border-none outline-none font-cairo text-white"
                  placeholder="أدخل الاسم الرباعي..."
                />
              </div>
              {errors.full_name && <p className="text-red-400 text-xs font-cairo">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo block">البريد الإلكتروني</label>
              <div className={cn("glass-panel p-3 flex items-center gap-3", errors.email && "border-red-500/50")}>
                <Mail className="w-4 h-4 text-gray-500" />
                <input 
                  type="email" 
                  {...register("email")}
                  className="flex-1 bg-transparent border-none outline-none font-inter text-white text-left"
                  placeholder="staff@pharmanile.com"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs font-cairo">{errors.email.message}</p>}
            </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo block">الراتب الأساسي</label>
                  <div className={cn("glass-panel p-3", errors.salary && "border-red-500/50")}>
                    <input 
                      type="number" 
                      {...register("salary")}
                      className="w-full bg-transparent border-none outline-none font-inter text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo block">الحوافز</label>
                  <div className={cn("glass-panel p-3", errors.incentives && "border-red-500/50")}>
                    <input 
                      type="number" 
                      {...register("incentives")}
                      className="w-full bg-transparent border-none outline-none font-inter text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo block">كلمة المرور</label>
                  <div className={cn("glass-panel p-3", errors.password && "border-red-500/50")}>
                    <input 
                      type="password" 
                      {...register("password")}
                      className="w-full bg-transparent border-none outline-none font-inter text-white text-left"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && <p className="text-red-400 text-xs font-cairo">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo block">الصلاحيات</label>
                  <div className="glass-panel p-3">
                    <select 
                      {...register("role")}
                      className="w-full bg-transparent border-none outline-none font-cairo text-sm text-white"
                    >
                      <option value="staff" className="bg-[#111]">موظف صيدلية</option>
                      <option value="admin" className="bg-[#111]">مدير نظام</option>
                    </select>
                  </div>
                  {errors.role && <p className="text-red-400 text-xs font-cairo">{errors.role.message}</p>}
                </div>
              </div>

          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-white/5 font-bold font-cairo text-white hover:bg-white/5 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={addLoading}
              className="flex-[2] py-4 rounded-2xl bg-[#00CED1] text-black font-bold font-cairo shadow-[0_0_20px_rgba(0,206,209,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              إنشاء الحساب الآن
            </button>
          </div>
        </form>
        
        <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-[#00CED1]/10 rounded-full blur-[80px] -z-10" />
      </motion.div>
    </div>
  );
}
