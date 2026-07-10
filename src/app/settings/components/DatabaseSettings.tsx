'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Database, Ghost, Shield, Moon, CloudMoon, Loader2,
  Download, Upload, RefreshCw, CheckCircle2, AlertTriangle,
  Trash2, HardDrive, Activity, BarChart2, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';


type ToastType = 'success' | 'error' | 'info';
function Toast({ msg, type, onClose }: { msg: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const styles: Record<ToastType, string> = {
    success: 'border-green-500/40 bg-green-500/10 text-green-300',
    error:   'border-red-500/40   bg-red-500/10   text-red-300',
    info:    'border-[var(--nile-teal)]/40 bg-[var(--nile-teal)]/10 text-[var(--nile-teal)]',
  };
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertTriangle : Activity;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl ${styles[type]}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm font-bold font-cairo">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </motion.div>
  );
}


interface DbStats {
  database: { mbUsed: number; limitMB: number; sizePercentage: number };
  tables: Record<string, number>;
  totalRecords: number;
  extractedInvoices: number;
  pendingDeleted: number;
  cleanableCount: number;
  health: number;
}


export function DatabaseSettings() {
  const { session, user } = useAuth();
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [cleaningType, setCleaningType] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const token = session?.access_token;
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    setToast({ msg, type });
  }, []);

  
  const fetchStats = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/db-usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setDbStats(data.data);
      else showToast(data.error ?? 'فشل تحميل إحصائيات قاعدة البيانات', 'error');
    } catch {
      showToast('لا يمكن الوصول إلى خادم الإحصائيات', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  
  const handleClean = async (type: string, label: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف "${label}"؟ لا يمكن التراجع عن هذه العملية.`)) return;
    setCleaningType(type);
    try {
      const res = await fetch('/api/db-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-pharmacy-id': pharmacyId ?? '',
        },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`تم تنظيف ${data.count ?? 0} سجل بنجاح`, 'success');
        fetchStats();
      } else {
        showToast(data.error ?? 'فشل التنظيف', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setCleaningType(null);
    }
  };

  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/db-backup/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pharmanile_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('تم تحميل النسخة الاحتياطية بنجاح', 'success');
    } catch (e: any) {
      showToast(`فشل التصدير: ${e.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file: File = e.target.files[0];
      if (!file) return;
      setIsImporting(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/db-backup/import', {
          method: 'POST',
          body: fd,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const s = data.stats;
          showToast(
            `تم الاستيراد بنجاح — ${s.products} منتج، ${s.customers} عميل، ${s.batches} دفعة`,
            'success'
          );
          fetchStats();
        } else {
          showToast(data.error ?? 'فشل الاستيراد', 'error');
        }
      } catch {
        showToast('خطأ في قراءة الملف أو الاتصال بالخادم', 'error');
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  
  const pct    = dbStats?.database.sizePercentage ?? 0;
  const radius = 60;
  const circ   = 2 * Math.PI * radius;
  const dash   = circ - (circ * Math.min(pct, 100)) / 100;

  const tableHighlights = [
    { key: 'products',               label: 'المنتجات',      color: 'text-[var(--nile-teal)]' },
    { key: 'batches',                label: 'الدفعات',       color: 'text-blue-400' },
    { key: 'customers',              label: 'العملاء',       color: 'text-purple-400' },
    { key: 'orders',                 label: 'الطلبات',       color: 'text-[var(--royal-gold)]' },
    { key: 'audit_logs',             label: 'سجلات التدقيق', color: 'text-red-400' },
    { key: 'sessions',               label: 'الورديات',      color: 'text-orange-400' },
    { key: 'financial_transactions', label: 'المعاملات المالية', color: 'text-green-400' },
    { key: 'stock_transfers',        label: 'تحويلات المخزون', color: 'text-cyan-400' },
  ];

  return (
    <>
      <AnimatePresence>
        {toast && (
          <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >

        {}
        <div className="glass-panel p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-cairo flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[var(--nile-teal)]" />
              إدارة مساحة قاعدة البيانات
            </h2>
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              title="تحديث الإحصائيات"
            >
              <RefreshCw className={`w-4 h-4 text-[var(--nile-teal)] ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {}
          <div className="mb-8 p-6 rounded-2xl border border-[var(--nile-teal)]/20 bg-gradient-to-r from-[var(--nile-teal)]/5 to-transparent">
            <div className="flex flex-col md:flex-row items-center gap-8">

              {}
              <div className="relative group w-40 h-40 flex-shrink-0 flex items-center justify-center cursor-help">
                <svg className="w-full h-full -rotate-90 drop-shadow-2xl transition-all duration-300 group-hover:scale-105" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                  <circle
                    cx="70" cy="70" r={radius}
                    fill="transparent" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
                    className="text-[var(--nile-teal)] transition-all duration-1000 ease-out"
                    strokeDasharray={circ}
                    strokeDashoffset={isLoading ? circ : dash}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  {isLoading
                    ? <Loader2 className="w-6 h-6 text-[var(--nile-teal)] animate-spin" />
                    : <>
                        <span className="text-2xl font-bold text-white">{pct}%</span>
                        <span className="text-[10px] text-gray-400 font-cairo">مستخدم</span>
                      </>
                  }
                </div>

                {}
                <div className="absolute top-full mt-2 w-64 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                  <h4 className="text-white font-bold font-cairo text-sm mb-3 border-b border-white/10 pb-2">قابل للتنظيف</h4>
                  <ul className="space-y-2 font-cairo text-xs text-gray-300">
                    <li className="flex justify-between"><span>سجلات التدقيق</span><span className="text-red-400 font-bold">{dbStats?.tables?.audit_logs ?? 0}</span></li>
                    <li className="flex justify-between"><span>الورديات</span><span className="text-orange-400 font-bold">{dbStats?.tables?.sessions ?? 0}</span></li>
                    <li className="flex justify-between"><span>طلبات ملغاة</span><span className="text-yellow-400 font-bold">{dbStats?.pendingDeleted ?? 0}</span></li>
                    <li className="border-t border-white/10 pt-2 flex justify-between text-white">
                      <span>المساحة التقديرية المستردة</span>
                      <span className="font-bold text-[var(--nile-teal)]">
                        {(((dbStats?.cleanableCount ?? 0) * 900) / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {}
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-[11px] text-gray-400 font-cairo">إجمالي السجلات</span>
                  <span className="text-white font-bold font-inter text-xl">
                    {isLoading ? '...' : (dbStats?.totalRecords ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-[11px] text-gray-400 font-cairo">الفواتير المكتملة</span>
                  <span className="text-white font-bold font-inter text-xl">
                    {isLoading ? '...' : (dbStats?.extractedInvoices ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-red-500/10">
                  <span className="text-[11px] text-red-300 font-cairo">سجلات قابلة للتنظيف</span>
                  <span className="text-red-400 font-bold font-inter text-xl">
                    {isLoading ? '...' : (dbStats?.cleanableCount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-green-500/10">
                  <span className="text-[11px] text-green-300 font-cairo">صحة النظام</span>
                  <span className="text-green-400 font-bold font-inter text-xl">
                    {isLoading ? '...' : `${dbStats?.health ?? 100}%`}
                  </span>
                </div>
              </div>
            </div>

            {}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-400 font-cairo mb-1.5">
                <span>المساحة المستخدمة (تقديري)</span>
                <span>{isLoading ? '...' : `${dbStats?.database.mbUsed ?? 0} MB / ${dbStats?.database.limitMB ?? 500} MB`}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--nile-teal)] to-[var(--royal-gold)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {}
          <h3 className="text-white font-bold text-base mb-4 font-cairo flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[var(--nile-teal)]" /> توزيع السجلات حسب الجدول
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {tableHighlights.map(({ key, label, color }) => (
              <div key={key} className="p-3 rounded-xl bg-white/3 border border-white/5 text-center hover:bg-white/5 transition-colors">
                <p className="text-[11px] text-gray-400 font-cairo mb-1">{label}</p>
                <p className={`text-lg font-bold font-inter ${color}`}>
                  {isLoading ? '—' : (dbStats?.tables?.[key] ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {}
          <h3 className="text-white font-bold text-lg mb-4 font-cairo flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400" /> خيارات التنظيف اليدوي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                type: 'audit',
                label: 'سجلات التدقيق القديمة',
                desc: 'حذف سجلات نشاط المستخدمين الأقدم من 60 يوماً.',
                icon: Trash2,
                border: 'border-red-500/10',
                bg: 'bg-red-500/5 hover:bg-red-500/10',
                btn: 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white',
              },
              {
                type: 'orders',
                label: 'الفواتير الملغاة',
                desc: 'إزالة جميع الطلبات ذات الحالة (cancelled) من قاعدة البيانات.',
                icon: Ghost,
                border: 'border-orange-500/10',
                bg: 'bg-orange-500/5 hover:bg-orange-500/10',
                btn: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white',
              },
              {
                type: 'sessions',
                label: 'ورديات العمل القديمة',
                desc: 'حذف سجلات الورديات المغلقة التي مر عليها أكثر من سنة.',
                icon: Moon,
                border: 'border-blue-500/10',
                bg: 'bg-blue-500/5 hover:bg-blue-500/10',
                btn: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white',
              },
            ].map(({ type, label, desc, icon: Icon, border, bg, btn }) => (
              <div key={type} className={`flex flex-col gap-4 p-5 rounded-xl border ${border} ${bg} transition-all`}>
                <div>
                  <h3 className="text-white font-bold font-cairo text-sm">{label}</h3>
                  <p className="text-xs text-gray-500 font-cairo mt-1">{desc}</p>
                </div>
                <button
                  onClick={() => handleClean(type, label)}
                  disabled={!!cleaningType}
                  className={`mt-auto py-2.5 rounded-lg font-cairo text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${btn}`}
                >
                  {cleaningType === type
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Icon className="w-4 h-4" />
                  }
                  {cleaningType === type ? 'جارِ التنظيف...' : 'تنظيف'}
                </button>
              </div>
            ))}
          </div>

          {}
          <div className="mt-6 p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
            <CloudMoon className="w-7 h-7 text-[var(--nile-teal)] flex-shrink-0" />
            <div>
              <h4 className="text-white font-bold font-cairo mb-1">منظف البيانات التلقائي</h4>
              <p className="text-sm text-gray-400 font-cairo leading-relaxed">
                في الخطط المتقدمة، يقوم النظام تلقائياً بتنظيف البيانات المؤقتة والسجلات القديمة بشكل دوري للحفاظ على أداء قاعدة البيانات.
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="glass-panel p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--nile-teal)]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          <h2 className="text-xl font-bold mb-2 font-cairo flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--nile-teal)]" /> النسخ الاحتياطي واستعادة البيانات
          </h2>
          <p className="text-sm text-gray-400 font-cairo border-b border-white/10 pb-6 mb-6">
            قم بتصدير نسخة احتياطية كاملة من بيانات صيدليتك بصيغة JSON أو استيراد بيانات من نظام آخر بشكل آمن.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {}
            <div className="flex flex-col gap-5 p-6 rounded-2xl border border-[var(--nile-teal)]/15 bg-[var(--nile-teal)]/5 hover:bg-[var(--nile-teal)]/10 transition-all">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-[var(--nile-teal)]/15">
                  <Download className="w-6 h-6 text-[var(--nile-teal)]" />
                </div>
                <div>
                  <h3 className="text-white font-bold font-cairo">تصدير قاعدة البيانات</h3>
                  <p className="text-xs text-gray-400 font-cairo mt-1 leading-relaxed">
                    تحميل نسخة احتياطية شاملة تحتوي على المنتجات، الدفعات، العملاء، الطلبات، والمعاملات المالية.
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 font-cairo space-y-1">
                <div className="flex justify-between"><span>المنتجات</span><span className="text-[var(--nile-teal)]">{dbStats?.tables?.products ?? '—'} سجل</span></div>
                <div className="flex justify-between"><span>العملاء</span><span className="text-[var(--nile-teal)]">{dbStats?.tables?.customers ?? '—'} سجل</span></div>
                <div className="flex justify-between"><span>الطلبات</span><span className="text-[var(--nile-teal)]">{dbStats?.tables?.orders ?? '—'} سجل</span></div>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="py-3 rounded-xl bg-[var(--nile-teal)]/20 text-[var(--nile-teal)] hover:bg-[var(--nile-teal)] hover:text-black font-cairo text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? 'جارِ التحضير...' : 'تحميل نسخة احتياطية (Export)'}
              </button>
            </div>

            {}
            <div className="flex flex-col gap-5 p-6 rounded-2xl border border-purple-500/15 bg-purple-500/5 hover:bg-purple-500/10 transition-all">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-purple-500/15">
                  <Upload className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold font-cairo">استيراد بيانات</h3>
                  <p className="text-xs text-gray-400 font-cairo mt-1 leading-relaxed">
                    رفع ملف JSON (من تصدير سابق أو نظام خارجي). سيقوم النظام تلقائياً بمطابقة الحقول وإدراج البيانات.
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-xs text-gray-500 font-cairo space-y-1">
                <p className="text-white font-bold mb-2">التنسيقات المدعومة:</p>
                <p>✓ تصدير Pharma-Nile (JSON)</p>
                <p>✓ تصدير أنظمة خارجية (JSON مع حقول مشابهة)</p>
                <p>✓ دعم تلقائي لأسماء الحقول العربية والإنجليزية</p>
              </div>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="py-3 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white font-cairo text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isImporting ? 'جارِ الاستيراد...' : 'استيراد البيانات (Import)'}
              </button>
            </div>
          </div>
        </div>

      </motion.div>
    </>
  );
}
