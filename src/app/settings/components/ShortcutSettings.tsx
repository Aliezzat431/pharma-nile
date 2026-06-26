import { motion } from 'framer-motion';
import { Palette, MessageSquare } from 'lucide-react';

export function ShortcutSettings() {
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
          <Palette className="w-5 h-5 text-[#00CED1]" /> دليل اختصارات لوحة المفاتيح
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { keys: ['Ctrl', 'K'], label: 'فتح شريط البحث الذكي (Command Palette)', description: 'البحث عن أي صفحة أو إجراء بشكل سريع.' },
            { keys: ['Alt', 'Shift', 'D'], label: 'الذهاب إلى لوحة التحكم', description: 'العودة للصفحة الرئيسية والمخططات.' },
            { keys: ['Alt', 'Shift', 'P'], label: 'فتح نقطة البيع (POS)', description: 'بدء عملية بيع جديدة فوراً.' },
            { keys: ['Alt', 'Shift', 'I'], label: 'المخزون (Inventory)', description: 'إدارة مخزون الأدوية والباتشات.' },
            { keys: ['Alt', 'Shift', 'S'], label: 'النواقص (Shortages)', description: 'عرض قائمة النواقص وطلبات التوريد.' },
            { keys: ['Alt', 'Shift', 'C'], label: 'العملاء', description: 'إدارة حسابات وديون العملاء.' },
            { keys: ['Alt', 'Shift', 'G'], label: 'الإعدادات', description: 'تغيير تفضيلات النظام.' },
          ].map((shortcut, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
              <div className="flex flex-col gap-1.5 flex-1">
                <h3 className="text-white font-bold font-cairo text-sm group-hover:text-[#00CED1] transition-colors">{shortcut.label}</h3>
                <p className="text-xs text-gray-500 font-cairo">{shortcut.description}</p>
              </div>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((k, j) => (
                  <div key={j} className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded bg-white/10 border border-white/10 text-[10px] font-bold font-inter text-[#00CED1] shadow-lg min-w-[30px] text-center">
                      {k}
                    </kbd>
                    {j < shortcut.keys.length - 1 && <span className="text-gray-600 font-bold">+</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-[#00CED1]/5 to-transparent border border-[#00CED1]/10">
          <h4 className="text-[#00CED1] font-bold font-cairo mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> نصيحة للمحترفين
          </h4>
          <p className="text-sm text-gray-400 font-cairo leading-relaxed">
            استخدام اختصارات لوحة المفاتيح يزيد من سرعة إنجاز العمليات اليومية بنسبة تزيد عن ٤٠٪. حاول التعود على <strong>Alt + Shift</strong> للتنقل السريع بين النوافذ دون الحاجة لاستخدام الفأرة.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
