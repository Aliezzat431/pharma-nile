import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';

export function GeneralSettings() {
  const { preferences, updatePreference, isLoaded } = usePreferences();

  if (!isLoaded) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 font-cairo flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#D4AF37]" /> بيانات الصيدلية الأساسية
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">اسم الصيدلية</label>
            <input 
              type="text" 
              value={preferences.pharmacyName} 
              onChange={e => updatePreference('pharmacyName', e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">البريد الإلكتروني للتواصل</label>
              <input 
                type="email" 
                dir="ltr" 
                value={preferences.email} 
                onChange={e => updatePreference('email', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">رقم الهاتف الشائع</label>
              <input 
                type="text" 
                dir="ltr" 
                value={preferences.phone} 
                onChange={e => updatePreference('phone', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">العنوان / الموقع الجغرافي</label>
            <textarea 
              rows={3} 
              value={preferences.address} 
              onChange={e => updatePreference('address', e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors resize-none" 
            />
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#00CED1]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 font-cairo flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#00CED1]" /> تفضيلات النظام والمخزون
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4">
            <div>
              <h3 className="text-white font-medium font-cairo">طريقة جرد المخزون الافتراضية</h3>
              <p className="text-sm text-gray-400 font-cairo mt-1">تحدد أي تشغيلة (Batch) يتم سحبها أولاً عند البيع.</p>
            </div>
            <select 
              value={preferences.inventoryMethod}
              onChange={e => updatePreference('inventoryMethod', e.target.value as any)}
              className="bg-black/80 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#D4AF37] font-cairo min-w-[200px] cursor-pointer"
            >
              <option value="FEFO">FEFO (الأقرب انتهاءً)</option>
              <option value="FIFO">FIFO (الأقدم دخولاً)</option>
              <option value="LIFO">LIFO (الأحدث دخولاً)</option>
            </select>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4">
            <div>
              <h3 className="text-white font-medium font-cairo">حد التنبيه لنواقص المخزون الشامل</h3>
              <p className="text-sm text-gray-400 font-cairo mt-1">تنبيه النظام عندما يقل إجمالي رصيد الصنف عن هذا الرقم.</p>
            </div>
            <input 
              type="number" 
              value={preferences.stockAlertThreshold}
              onChange={e => {
                const val = parseInt(e.target.value);
                updatePreference('stockAlertThreshold', isNaN(val) ? 0 : val);
              }}
              className="w-full md:w-32 bg-black/80 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00CED1] transition-colors" 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
