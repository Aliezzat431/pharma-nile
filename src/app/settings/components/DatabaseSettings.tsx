import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Database, Ghost, Shield, Moon, CloudMoon, Loader2, Download, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function DatabaseSettings() {
  const { session, user } = useAuth();
  const [dbUsage, setDbUsage] = useState<any>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const pharmacyId = user?.user_metadata?.pharmacy_id;
  const token = session?.access_token;

  useEffect(() => {
    if (!token || !pharmacyId) return;

    const fetchDb = async () => {
      setIsDbLoading(true);
      try {
        const res = await fetch('/api/db-usage', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-pharmacy-id': pharmacyId
          }
        });
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
  }, [token, pharmacyId]);

  const handleCleanData = async (type: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف البيانات القديمة؟ لا يمكن التراجع عن هذه العملية.')) {
      return;
    }

    try {
      setIsDbLoading(true);
      const res = await fetch('/api/db-cleanup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-pharmacy-id': pharmacyId
        },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message || 'تم تنظيف البيانات بنجاح');

        const refreshRes = await fetch('/api/db-usage', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-pharmacy-id': pharmacyId
          }
        });
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
      const res = await fetch('/api/db-backup/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-pharmacy-id': pharmacyId
        }
      });
      if (!res.ok) throw new Error('فشل في تحميل النسخة الاحتياطية');
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
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-pharmacy-id': pharmacyId
          }
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
    <motion.div
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

        {/* Storage Details */}
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
              {/* Circular Chart */}
              <div className="flex flex-col md:flex-row items-center gap-8 mt-4">

                <div className="relative group w-40 h-40 flex-shrink-0 flex items-center justify-center cursor-help">
                  <svg className="w-full h-full transform -rotate-90 filter drop-shadow-2xl transition-all duration-300 group-hover:scale-105" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="60" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                    <circle cx="70" cy="70" r="60" fill="transparent" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
                      className="text-[#00CED1] transition-all duration-1000 ease-out"
                      strokeDasharray={377} strokeDashoffset={isDbLoading || isNaN(Number(dbUsage?.database?.sizePercentage)) ? 377 : 377 - (377 * Math.min(100, Number(dbUsage?.database?.sizePercentage))) / 100} 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-white font-inter">{isDbLoading ? '-' : `${dbUsage?.database?.sizePercentage || 0}%`}</span>
                    <span className="text-[10px] text-gray-400 font-cairo">مستخدم</span>
                  </div>

                  {/* Tooltip */}
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
          {/* Audit Logs */}
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

          {/* Cancelled Orders */}
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

          {/* Sessions */}
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
              وعند تمكين الخطط المتقدمة، سيقوم النظام تلقائياً بتنظيف البيانات المؤقتة والسجلات القديمة بشكل أسبوعي أو شهري للحفاظ على سرعة قاعدة البيانات بأعلى كفاءة ممكنة.
            </p>
          </div>
        </div>

        {/* Backup & Restore */}
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
  );
}
