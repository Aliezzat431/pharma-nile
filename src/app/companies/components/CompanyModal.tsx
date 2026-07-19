import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Company } from '@/lib/api/companies';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  submitting: boolean;
  editingCompany: Company | null;
  formData: Omit<Company, 'id' | 'created_at' | 'pharmacy_id'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<Company, 'id' | 'created_at' | 'pharmacy_id'>>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function CompanyModal({
  isOpen,
  onClose,
  submitting,
  editingCompany,
  formData,
  setFormData,
  onSubmit
}: CompanyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => !submitting && onClose()}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass-panel p-8 shadow-2xl border border-[var(--glass-border)] bg-[#050505]/90 text-right z-10"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-cairo text-white">
                {editingCompany ? 'تعديل بيانات الشركة' : 'إضافة شركة جديدة'}
              </h2>
              <button 
                disabled={submitting}
                onClick={onClose} 
                className="p-2 hover:bg-[var(--glass-surface)] rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-30 flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 font-cairo block">اسم الشركة <span className="text-red-400">*</span></label>
                <input 
                  required
                  disabled={submitting}
                  type="text" 
                  className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] focus:border-[var(--nile-teal)]/50 outline-none rounded-xl p-3 font-cairo text-white text-right disabled:opacity-50"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">اسم المندوب</label>
                  <input 
                    disabled={submitting}
                    type="text" 
                    className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] focus:border-[var(--nile-teal)]/50 outline-none rounded-xl p-3 font-cairo text-white text-right disabled:opacity-50"
                    value={formData.contact_person}
                    onChange={e => setFormData({...formData, contact_person: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">رقم الهاتف</label>
                  <input 
                    disabled={submitting}
                    type="text" 
                    className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] focus:border-[var(--nile-teal)]/50 outline-none rounded-xl p-3 text-white text-left font-sans disabled:opacity-50"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 font-cairo block">البريد الإلكتروني</label>
                <input 
                  disabled={submitting}
                  type="email" 
                  className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] focus:border-[var(--nile-teal)]/50 outline-none rounded-xl p-3 text-white text-left font-sans disabled:opacity-50"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 font-cairo block">العنوان</label>
                <input 
                  disabled={submitting}
                  type="text" 
                  className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] focus:border-[var(--nile-teal)]/50 outline-none rounded-xl p-3 font-cairo text-white text-right disabled:opacity-50"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-[var(--nile-teal)] text-black py-4 font-bold text-lg mt-4 font-cairo rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : editingCompany ? (
                  'حفظ التغييرات'
                ) : (
                  'إضافة الشركة'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
