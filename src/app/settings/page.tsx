'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Settings as SettingsIcon, Save, CreditCard, Bell, Shield, Smartphone, Loader2, Printer, Percent, Palette, Mail, MessageSquare, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'general' | 'pos' | 'notifications' | 'appearance';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    handleSave();
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'الإعدادات العامة', icon: Shield },
    { id: 'pos', label: 'الفواتير ونقاط البيع', icon: CreditCard },
    { id: 'notifications', label: 'التنبيهات والإشعارات', icon: Bell },
    { id: 'appearance', label: 'المظهر والواجهة', icon: Smartphone },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo">
             <SettingsIcon className="text-[#00CED1] w-8 h-8" />
             إعدادات <span className="text-[#D4AF37]">النظام</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo text-sm">تكوين التفضيلات العامة للصيدلية والتكاملات البرمجية والتحكم الكامل بالنظام.</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {saveSuccess && (
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-green-400 text-sm font-cairo font-medium"
              >
                ✓ تم الحفظ بنجاح
              </motion.span>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00CED1] to-[#009b9e] text-white font-bold hover:shadow-[0_0_15px_rgba(0,206,209,0.4)] transition-all font-cairo disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            حفظ التغييرات
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Settings Navigation */}
        <div className="md:col-span-3 space-y-2">
           {tabs.map((tab) => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full text-right px-4 py-3.5 rounded-xl font-medium flex items-center gap-3 font-cairo transition-all duration-300 relative overflow-hidden group
                 ${activeTab === tab.id 
                   ? 'bg-white/10 text-white border border-white/10 shadow-lg' 
                   : 'text-gray-400 hover:bg-white/5 border border-transparent hover:text-gray-200'
                 }
               `}
             >
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-[#00CED1]" />
                )}
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#00CED1]' : 'group-hover:text-[#00CED1]/70 transition-colors'}`} /> 
                {tab.label}
             </button>
           ))}
        </div>

        {/* Settings Form Area */}
        <div className="md:col-span-9 relative min-h-[500px]">
           <AnimatePresence mode="wait">
             {/* GENERAL TAB */}
             {activeTab === 'general' && (
               <motion.div 
                 key="general"
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
                          <input type="text" defaultValue="صيدلية النيل - الفرع الرئيسي" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors" />
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">البريد الإلكتروني للتواصل</label>
                              <input type="email" dir="ltr" defaultValue="admin@pharmanile.com" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors" />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">رقم الهاتف الشائع</label>
                              <input type="text" dir="ltr" defaultValue="+20 100 123 4567" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors" />
                           </div>
                       </div>

                       <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">العنوان / الموقع الجغرافي</label>
                          <textarea rows={3} defaultValue="القاهرة، مصر - شارع النيل، مبنى رقم ٤٥" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors resize-none" />
                       </div>
                    </div>
                 </div>

                 <div className="glass-panel p-8 relative overflow-hidden">
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#00CED1]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                    <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 font-cairo flex items-center gap-2">
                       <SettingsIcon className="w-5 h-5 text-[#00CED1]" /> تفضيلات النظام والمخزون
                    </h2>
                    
                    <div className="space-y-4">
                       <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4">
                          <div>
                             <h3 className="text-white font-medium font-cairo">طريقة جرد المخزون الافتراضية</h3>
                             <p className="text-sm text-gray-400 font-cairo mt-1">تحدد أي تشغيلة (Batch) يتم سحبها أولاً عند البيع.</p>
                          </div>
                          <select className="bg-black/80 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#D4AF37] font-cairo min-w-[200px] cursor-pointer">
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
                          <input type="number" defaultValue="20" className="w-full md:w-32 bg-black/80 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00CED1] transition-colors" />
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}

             {/* POS TAB */}
             {activeTab === 'pos' && (
               <motion.div 
                 key="pos"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="space-y-6"
               >
                 <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 font-cairo flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#00CED1]" /> إعدادات نقاط البيع (POS)
                    </h2>
                    
                    <div className="space-y-4">
                       <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4">
                          <div>
                             <h3 className="text-white font-medium font-cairo flex items-center gap-2"><Percent className="w-4 h-4 text-gray-400" /> نسبة ضريبة القيمة المضافة</h3>
                             <p className="text-sm text-gray-400 font-cairo mt-1">القيمة المئوية للضريبة ليتم احتسابها تلقائياً بالطباعة.</p>
                          </div>
                          <div className="relative w-full md:w-32">
                             <input type="number" defaultValue="14" className="w-full bg-black/80 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-white outline-none focus:border-[#00CED1] transition-colors" />
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                          </div>
                       </div>

                       <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4">
                          <div>
                             <h3 className="text-white font-medium font-cairo flex items-center gap-2"><Printer className="w-4 h-4 text-gray-400" /> مقاس طابعة الفواتير الحرارية</h3>
                             <p className="text-sm text-gray-400 font-cairo mt-1">ضبط المقاس الحراري لعرض الفاتورة عند الطباعة المباشرة.</p>
                          </div>
                          <select className="bg-black/80 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00CED1] font-cairo min-w-[200px] cursor-pointer">
                             <option value="80mm">80mm (قياسي)</option>
                             <option value="58mm">58mm (صغير)</option>
                             <option value="A4">A4 (مكتبية)</option>
                          </select>
                       </div>

                       <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4">
                          <div>
                             <h3 className="text-white font-medium font-cairo">فترة السماح بالمرتجعات (بالأيام)</h3>
                             <p className="text-sm text-gray-400 font-cairo mt-1">الحد الأقصى للأيام المسموح خلالها بإرجاع فاتورة للعميل.</p>
                          </div>
                          <input type="number" defaultValue="14" className="w-full md:w-32 bg-black/80 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00CED1] transition-colors" />
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}

             {/* NOTIFICATIONS TAB */}
             {activeTab === 'notifications' && (
               <motion.div 
                 key="notifications"
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
                             <input type="checkbox" defaultChecked className="sr-only peer" />
                             <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00CED1]"></div>
                          </div>
                          <div>
                             <h3 className="text-white font-medium font-cairo flex items-center gap-2 group-hover:text-[#00CED1] transition-colors"><Mail className="w-4 h-4" /> التقارير اليومية بالبريد</h3>
                             <p className="text-sm text-gray-400 font-cairo mt-1">استلام ملخص مبيعات ونواقص اليوم بنهاية الوردية عبر الإيميل.</p>
                          </div>
                       </label>

                       <label className="flex items-start gap-4 p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group">
                          <div className="relative flex items-center mt-1">
                             <input type="checkbox" className="sr-only peer" />
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
             )}

             {/* APPEARANCE TAB */}
             {activeTab === 'appearance' && (
               <motion.div 
                 key="appearance"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="space-y-6"
               >
                 <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 font-cairo flex items-center gap-2">
                       <Palette className="w-5 h-5 text-[#FF6b6b]" /> المظهر العام وتخصيص الواجهة
                    </h2>
                    
                    <div className="space-y-6">
                       <div>
                          <h3 className="text-white font-medium font-cairo mb-4">النمط (Theme)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {/* Dark Theme Button */}
                             <button 
                               onClick={() => handleThemeChange('dark')}
                               className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                 theme === 'dark' 
                                   ? 'border-[#00CED1] bg-[#00CED1]/10 text-white' 
                                   : 'border-transparent bg-white/5 text-gray-400 hover:bg-white/10'
                               }`}
                             >
                               <div className="w-full h-16 rounded bg-[#050505] border border-white/10 flex flex-col gap-1 p-2">
                                 <div className="w-full h-2 bg-white/20 rounded"></div>
                                 <div className="w-1/2 h-2 bg-[#00CED1]/50 rounded"></div>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Moon className="w-4 h-4" />
                                 <span className="font-cairo">Dark السمة الداكنة</span>
                               </div>
                             </button>

                             {/* Light Theme Button */}
                             <button 
                               onClick={() => handleThemeChange('light')}
                               className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                 theme === 'light' 
                                   ? 'border-[#00CED1] bg-[#00CED1]/10 text-white' 
                                   : 'border-transparent bg-white/5 text-gray-400 hover:bg-white/10'
                               }`}
                             >
                               <div className="w-full h-16 rounded bg-white border border-gray-200 flex flex-col gap-1 p-2">
                                 <div className="w-full h-2 bg-gray-200 rounded"></div>
                                 <div className="w-1/2 h-2 bg-[#00CED1]/50 rounded"></div>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Sun className="w-4 h-4" />
                                 <span className="font-cairo">Light السمة المضيئة</span>
                               </div>
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
