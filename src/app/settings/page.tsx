'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Settings as SettingsIcon, Save, CreditCard, Bell, Shield, Smartphone, Loader2, Printer, Percent, Palette, Mail, MessageSquare, Sun, Moon, X, CloudMoon, Leaf, Sparkles, Sunset, Droplets, Zap, Crown, Gem, Hexagon, Coffee, Trees, Ghost, SunMoon, Snowflake, Database, Download, Upload, Waves, CloudSnow } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'general' | 'pos' | 'notifications' | 'appearance' | 'shortcuts' | 'database';

const ALL_THEMES = [
  { id: 'dark', label: 'الوضع الليلي (Default)', icon: Moon, desc: 'الوضع الكلاسيكي الفخم للنظام', color: 'bg-[#050505]' },
  { id: 'light', label: 'الوضع النهاري', icon: Sun, desc: 'وضوح عالي للعمل تحت الإضاءة القوية', color: 'bg-[#f8fafc]' },
  { id: 'midnight', label: 'منتصف الليل', icon: Waves, desc: 'أزرق عميق يجمع بين الهدوء والأناقة', color: 'bg-[#020612]' },
  { id: 'ocean', label: 'أعماق المحيط', icon: Waves, desc: 'سيان مشرق وطاقة لا تنتهي', color: 'bg-[#010b14]' },
  { id: 'forest', label: 'الغابة العميقة', icon: Trees, desc: 'أخضر طبيعي مريح جداً للعين', color: 'bg-[#040d0a]' },
  { id: 'coffee', label: 'وضع القهوة (Coffee)', icon: Coffee, desc: 'ألوان ترابية دافئة تركز على التفاصيل', color: 'bg-[#140d0b]' },
  { id: 'amethyst', label: 'الجمشت الملكي', icon: Sparkles, desc: 'بنفسجي فاخر يعكس هوية بريميوم', color: 'bg-[#0d0b1a]' },
  { id: 'sunset', label: 'وقت الغروب', icon: Zap, desc: 'مزيج دافئ من البرتقالي والأحمر', color: 'bg-[#140806]' },
  { id: 'cyberpunk', label: 'سايبر بانك', icon: Zap, desc: 'تباين عالي وألوان نيون مستقبلية', color: 'bg-[#000000]' },
  { id: 'dracula', label: 'دراكولا', icon: Ghost, desc: 'ألوان ناعمة ومريحة للمكاتب الطويلة', color: 'bg-[#1e1f29]' },
  { id: 'snowy', label: 'وضوح الثلج', icon: CloudSnow, desc: 'أبيض ناصع مع لمسات جليدية نقية', color: 'bg-[#f8fafc]' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const [dbUsage, setDbUsage] = useState<any>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (activeTab === 'database') {
      const fetchDb = async () => {
        setIsDbLoading(true);
        try {
          const res = await fetch('/api/db-usage');
          const data = await res.json();
          if (data.success) {
            setDbUsage(data.data);
          }
        } catch (e) {
          console.error(e);
        }
        setIsDbLoading(false);
      }
      fetchDb();
    }
  }, [activeTab]);

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
    { id: 'shortcuts', label: 'اختصارات التطبيق', icon: Palette },
    { id: 'database', label: 'إدارة البيانات والتنظيف', icon: Zap },
  ];

  const handleCleanData = async (type: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف البيانات القديمة؟ لا يمكن التراجع عن هذه العملية.')) {
      return;
    }

    try {
      setIsDbLoading(true);
      const res = await fetch('/api/db-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message || 'تم تنظيف البيانات بنجاح');
        
        // Refresh usage stats
        const refreshRes = await fetch('/api/db-usage');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setDbUsage(refreshData.data);
        }
      } else {
        alert('حدث خطأ أثناء التنظيف: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('فشل في الاتصال بالخادم لإتمام عملية التنظيف');
    } finally {
      setIsDbLoading(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/db-backup/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pharmacy_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
      alert('فشل في تصدير النسخة الاحتياطية');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/db-backup/import', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) alert('تم استيراد النسخة الاحتياطية بنجاح!');
        else alert('حدث خطأ أثناء الاستيراد: ' + data.error);
      } catch (err) {
        alert('فشل في عملية الاستيراد');
      } finally {
        setIsImporting(false);
      }
    };
    fileInput.click();
  };

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
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium font-cairo">الأنماط الأساسية (Important Themes)</h3>
                        <button
                          onClick={() => setIsThemeModalOpen(true)}
                          className="text-sm text-[#00CED1] hover:text-white transition-colors flex items-center gap-1 font-cairo bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10"
                        >
                          <Palette className="w-4 h-4" />
                          المزيد (See More)
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dark Theme Button */}
                        <button
                          onClick={() => handleThemeChange('dark')}
                          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
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
                          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light'
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
            {/* SHORTCUTS TAB */}
            {activeTab === 'shortcuts' && (
              <motion.div
                key="shortcuts"
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
            )}

            {/* DATABASE MANAGER TAB */}
            {activeTab === 'database' && (
              <motion.div
                key="database"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="glass-panel p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                  <h2 className="text-xl font-bold mb-2 font-cairo flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-400" /> إدارة مساحة قاعدة البيانات (Data Cleaner)
                  </h2>
                  <p className="text-sm text-gray-400 font-cairo border-b border-white/10 pb-6 mb-6">
                    يمكنك توفير مساحة التخزين عن طريق حذف السجلات القديمة غير الضرورية. تحذير: هذه العمليات لا يمكن التراجع عنها.
                  </p>

                  {/* Database Usage Stats Section */}
                  <div className="mb-8 p-6 rounded-2xl border border-[#00CED1]/20 bg-gradient-to-r from-[#00CED1]/5 to-transparent">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#00CED1]" />
                        <h3 className="text-white font-bold font-cairo text-lg">استهلاك مساحة قاعدة البيانات</h3>
                      </div>
                      <span className="text-sm text-[#00CED1] font-cairo bg-[#00CED1]/10 px-3 py-1 rounded-full font-bold">
                        {isDbLoading ? 'جارِ التحميل...' : `${dbUsage?.database?.mbUsed || 0}MB / ${dbUsage?.database?.limitMB || 500}MB مستخدم`}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Circular Progress & Deletable Hover Tooltip */}
                        <div className="flex flex-col md:flex-row items-center gap-8 mt-4">

                          <div className="relative group w-40 h-40 flex-shrink-0 flex items-center justify-center cursor-help">
                            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-2xl transition-all duration-300 group-hover:scale-105" viewBox="0 0 140 140">
                              {/* Background Circle */}
                              <circle cx="70" cy="70" r="60" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                              {/* Progress Circle */}
                              <circle cx="70" cy="70" r="60" fill="transparent" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
                                className="text-[#00CED1] transition-all duration-1000 ease-out"
                                strokeDasharray={377} strokeDashoffset={isDbLoading || isNaN(Number(dbUsage?.database?.sizePercentage)) ? 377 : 377 - (377 * Math.min(100, Number(dbUsage?.database?.sizePercentage))) / 100} 
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center text-center">
                              <span className="text-2xl font-bold text-white font-inter">{isDbLoading ? '-' : `${dbUsage?.database?.sizePercentage || 0}%`}</span>
                              <span className="text-[10px] text-gray-400 font-cairo">مستخدم</span>
                            </div>

                            {/* Hover Tooltip for Deletable Stats */}
                            <div className="absolute top-full mt-2 w-64 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-2 transition-all duration-300 pointer-events-none z-50">
                              <h4 className="text-white font-bold font-cairo text-sm mb-3 border-b border-white/10 pb-2 flex justify-between items-center">
                                <span>تفاصيل قابلة للحذف</span>
                                <Zap className="w-4 h-4 text-orange-400" />
                              </h4>
                              <ul className="space-y-2 font-cairo text-xs text-gray-300">
                                <li className="flex justify-between items-center">
                                  <span>تاريخ الورديات (Sessions)</span>
                                  <span className="text-[#FF6b6b] font-inter font-bold">{dbUsage?.tables?.sessions || 0}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <span>سجلات النظام (Audit Logs)</span>
                                  <span className="text-[#FF6b6b] font-inter font-bold">{dbUsage?.tables?.audit_logs || 0}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <span>فواتير ملغاة معلقة</span>
                                  <span className="text-[#FF6b6b] font-inter font-bold">{dbUsage?.pendingDeleted || 0}</span>
                                </li>
                                <li className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center text-white">
                                  <span>المساحة المستردة المحتملة</span>
                                  <span className="font-bold text-[#00CED1] font-inter cursor-pointer">{(((dbUsage?.tables?.sessions || 0) + (dbUsage?.tables?.audit_logs || 0) + (dbUsage?.pendingDeleted || 0)) * 900 / 1024 / 1024).toFixed(2)} MB</span>
                                </li>
                              </ul>
                              <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">* لا يوصى أو يسمح بحذف السجلات الأساسية (المنتجات، العملاء، الفواتير النشطة) لضمان سلامة الـ ERP. الوزن الأساسي للنظام (حوالي 43MB) تفرضه تكنولوجيا قواعد البيانات.</p>
                            </div>
                          </div>

                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                              <span className="text-[11px] text-gray-400 font-cairo">السجلات المركزية</span>
                              <span className="text-white font-bold font-inter text-xl">{isDbLoading ? '...' : dbUsage?.totalRecords?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                              <span className="text-[11px] text-gray-400 font-cairo">الفواتير المستخرجة</span>
                              <span className="text-white font-bold font-inter text-xl">{isDbLoading ? '...' : dbUsage?.extractedInvoices?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-red-500/10 hover:border-red-500/20 transition-colors">
                              <span className="text-[11px] text-red-300 font-cairo">سجلات مهملة قابلة للحذف</span>
                              <span className="text-red-400 font-bold font-inter text-xl">{isDbLoading ? '...' : ((dbUsage?.tables?.sessions || 0) + (dbUsage?.tables?.audit_logs || 0) + (dbUsage?.pendingDeleted || 0)).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-green-500/10 hover:border-green-500/20 transition-colors">
                              <span className="text-[11px] text-green-300 font-cairo">صحة واستجابة النظام</span>
                              <span className="text-green-400 font-bold font-inter text-xl">{isDbLoading ? '...' : `${dbUsage?.health || 100}%`}</span>
                            </div>
                          </div>

                        </div>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-4 font-cairo flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" /> خيارات التنظيف اليدوي
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Clean Audit Logs */}
                    <div className="flex flex-col gap-4 p-5 rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-all group">
                      <div>
                        <h3 className="text-white font-bold font-cairo text-sm">سجلات النظام القديمة (Audit Logs)</h3>
                        <p className="text-xs text-gray-500 font-cairo mt-1">حذف سجلات نشاط المستخدمين التي مرت عليها أكثر من 60 يوماً.</p>
                      </div>
                      <button 
                        onClick={() => handleCleanData('audit')}
                        className="mt-auto py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-cairo text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Ghost className="w-4 h-4" /> تنظيف السجلات
                      </button>
                    </div>

                    {/* Clean Cancelled Orders */}
                    <div className="flex flex-col gap-4 p-5 rounded-xl border border-orange-500/10 bg-orange-500/5 hover:bg-orange-500/10 transition-all group">
                      <div>
                        <h3 className="text-white font-bold font-cairo text-sm">الفواتير الملغاة والمهملة</h3>
                        <p className="text-xs text-gray-500 font-cairo mt-1">إزالة جميع الفواتير التي لم تكتمل (Cancelled) لتنظيف قاعدة البيانات.</p>
                      </div>
                      <button 
                        onClick={() => handleCleanData('orders')}
                        className="mt-auto py-2.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white font-cairo text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Shield className="w-4 h-4" /> إزالة الفواتير الملغاة
                      </button>
                    </div>

                    {/* Clean Old Sessions */}
                    <div className="flex flex-col gap-4 p-5 rounded-xl border border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 transition-all group">
                      <div>
                        <h3 className="text-white font-bold font-cairo text-sm">ورديات العمل القديمة</h3>
                        <p className="text-xs text-gray-500 font-cairo mt-1">حذف سجلات الورديات المغلقة (Shifts) التي مر عليها أكثر من سنة.</p>
                      </div>
                      <button 
                        onClick={() => handleCleanData('sessions')}
                        className="mt-auto py-2.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white font-cairo text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                         <Moon className="w-4 h-4" /> تنظيف الورديات
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
                    <CloudMoon className="w-8 h-8 text-[#00CED1] flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-bold font-cairo mb-2">منظف البيانات التلقائي المستقبلي (Automated Cleaner)</h4>
                      <p className="text-sm text-gray-400 font-cairo leading-relaxed">
                        عند تمكين الخطط المتقدمة، سيقوم النظام تلقائياً بتنظيف البيانات المؤقتة والسجلات القديمة بشكل أسبوعي أو شهري للحفاظ على سرعة قاعدة البيانات بأعلى كفاءة ممكنة.
                      </p>
                    </div>
                  </div>

                  {/* Backup & Restore Tools */}
                  <h3 className="text-white font-bold text-lg mt-8 mb-4 font-cairo flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#00CED1]" /> النسخ الاحتياطي (Backup & Restore)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4 p-5 rounded-xl border border-[#00CED1]/10 bg-[#00CED1]/5 hover:bg-[#00CED1]/10 transition-all group">
                      <div>
                        <h3 className="text-white font-bold font-cairo text-sm">تصدير قاعدة البيانات</h3>
                        <p className="text-xs text-gray-500 font-cairo mt-1">تنزيل نسخة احتياطية من كل الأدوية، العملاء، السجلات بصيغة JSON بأمان كامل.</p>
                      </div>
                      <button 
                        onClick={handleExportBackup}
                        disabled={isExporting}
                        className="mt-auto py-2.5 rounded-lg bg-[#00CED1]/20 text-[#00CED1] hover:bg-[#00CED1] hover:text-black font-cairo text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isExporting ? 'جاري التحضير...' : 'تحميل نسخة احتياطية (Export)'}
                      </button>
                    </div>

                    <div className="flex flex-col gap-4 p-5 rounded-xl border border-purple-500/10 bg-purple-500/5 hover:bg-purple-500/10 transition-all group">
                      <div>
                        <h3 className="text-white font-bold font-cairo text-sm">استيراد بيانات من الخارج</h3>
                        <p className="text-xs text-gray-500 font-cairo mt-1">رفع ملف JSON يحتوي على نسخة احتياطية سابقة لاسترجاع الداتا الخاصة بك.</p>
                      </div>
                      <button 
                        onClick={handleImportBackup}
                        disabled={isImporting}
                        className="mt-auto py-2.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white font-cairo text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isImporting ? 'جاري الرفع والدمج...' : 'استيراد البيانات (Import)'}
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Theme Modal */}
      <AnimatePresence>
        {isThemeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsThemeModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold font-cairo flex items-center gap-3 text-white">
                  <Palette className="w-6 h-6 text-[#00CED1]" />
                  مكتبة الأنماط المتقدمة
                </h2>
                <button onClick={() => setIsThemeModalOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
                {ALL_THEMES.map(themeItem => (
                  <button
                    key={themeItem.id}
                    onClick={() => handleThemeChange(themeItem.id)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all group ${theme === themeItem.id
                        ? 'border-[#00CED1] bg-[#00CED1]/10 text-white'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className={`w-full h-24 rounded-xl border flex flex-col gap-2 p-3 ${
                       ['light', 'light-neon', 'nature', 'coffee', 'monochrome', 'snowy'].includes(themeItem.id) ? 'bg-gray-100 border-gray-300' : 'bg-[#050505] border-white/10'
                    }`}>
                      <div className={`w-full h-3 rounded ${['light', 'light-neon', 'nature', 'coffee', 'monochrome', 'snowy'].includes(themeItem.id) ? 'bg-black/20' : 'bg-white/20'}`}></div>
                      <div className={`w-2/3 h-3 rounded ${themeItem.color}`}></div>
                      <div className={`w-1/2 h-2 rounded mt-auto ${['light', 'light-neon', 'nature', 'coffee', 'monochrome', 'snowy'].includes(themeItem.id) ? 'bg-black/10' : 'bg-white/10'}`}></div>
                    </div>
                    <div className="flex flex-col items-center gap-1 mt-2 text-center">
                      <div className={`flex items-center gap-2 font-bold font-cairo transition-colors ${theme === themeItem.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                        <themeItem.icon className={`w-5 h-5 ${theme === themeItem.id ? 'text-[#00CED1]' : 'text-gray-400 group-hover:text-[#00CED1]'}`} />
                        {themeItem.label}
                      </div>
                      <span className="text-xs text-gray-500 font-cairo">{themeItem.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
