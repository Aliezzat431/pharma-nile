import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';

export function NotificationSettings() {
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
        <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 font-cairo flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#D4AF37]" /> قنوات التنبيه والإشعارات
        </h2>

        <div className="space-y-4">
          <label className="flex items-start gap-4 p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group">
            <div className="relative flex items-center mt-1">
              <input 
                type="checkbox" 
                checked={preferences.emailReports} 
                onChange={e => updatePreference('emailReports', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00CED1]"></div>
            </div>
            <div>
              <h3 className="text-white font-medium font-cairo flex items-center gap-2 group-hover:text-[#00CED1] transition-colors"><Mail className="w-4 h-4" /> التقارير اليومية بالبريد</h3>
              <p className="text-sm text-gray-400 font-cairo mt-1">استلام ملخص مبيعات ونواقص اليوم بنهاية الوردية عبر الإيميل.</p>
            </div>
          </label>

          <label className="flex items-start gap-4 p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group">
            <div className="relative flex items-center mt-1">
              <input 
                type="checkbox" 
                checked={preferences.expiryAlerts} 
                onChange={e => updatePreference('expiryAlerts', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00CED1]"></div>
            </div>
            <div>
              <h3 className="text-white font-medium font-cairo flex items-center gap-2 group-hover:text-[#25D366] transition-colors"><MessageSquare className="w-4 h-4" /> تنبيهات صلاحيات المنتجات</h3>
              <p className="text-sm text-gray-400 font-cairo mt-1">إرسال إشعار فوري لمدير الصيدلية عند اقتراب صلاحية منتج من الانتهاء.</p>
            </div>
          </label>
        </div>
      </div>
    </motion.div>
  );
}
