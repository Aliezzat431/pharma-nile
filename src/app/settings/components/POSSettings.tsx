import { motion } from 'framer-motion';
import { CreditCard, Printer } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';

export function POSSettings() {
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
      <div className="glass-panel p-8">
        <h2 className="text-xl font-bold mb-6 border-b border-[var(--glass-border)] pb-4 font-cairo flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[var(--nile-teal)]" /> إعدادات نقاط البيع (POS)
        </h2>

        <div className="space-y-4">

          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-[var(--glass-border)] bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4">
            <div>
              <h3 className="text-white font-medium font-cairo flex items-center gap-2"><Printer className="w-4 h-4 text-gray-400" /> مقاس طابعة الفواتير الحرارية</h3>
              <p className="text-sm text-gray-400 font-cairo mt-1">ضبط المقاس الحراري لعرض الفاتورة عند الطباعة المباشرة.</p>
            </div>
            <select 
              value={preferences.printerSize}
              onChange={e => updatePreference('printerSize', e.target.value as any)}
              className="bg-black/80 border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[var(--nile-teal)] font-cairo min-w-[200px] cursor-pointer"
            >
              <option value="80mm">80mm (قياسي)</option>
              <option value="58mm">58mm (صغير)</option>
              <option value="A4">A4 (مكتبية)</option>
            </select>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-[var(--glass-border)] bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4">
            <div>
              <h3 className="text-white font-medium font-cairo">فترة السماح بالمرتجعات (بالأيام)</h3>
              <p className="text-sm text-gray-400 font-cairo mt-1">الحد الأقصى للأيام المسموح خلالها بإرجاع فاتورة للعميل.</p>
            </div>
            <input 
              type="number" 
              value={preferences.returnDaysLimit}
              onChange={e => {
                const val = parseInt(e.target.value);
                updatePreference('returnDaysLimit', isNaN(val) ? 0 : val);
              }}
              className="w-full md:w-32 bg-black/80 border border-[var(--glass-border)] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[var(--nile-teal)] transition-colors" 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
