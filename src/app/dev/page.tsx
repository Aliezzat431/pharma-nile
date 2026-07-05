"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle2, Database, RefreshCw,
  Server, Users, ShoppingCart, Package, TrendingUp, Clock,
  Wifi, WifiOff, Bug, Zap, BarChart2, Eye, Code, Terminal,
  Shield, Key, ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TableStat { table: string; rows: number; size: string; }
interface AgentLog { id: string; action: string; status: string; created_at: string; input?: string; output?: string; }
interface SystemCheck { label: string; status: 'ok' | 'warn' | 'error'; detail: string; }

// ─── Helper ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'ok' | 'warn' | 'error' | string }) {
  const map = {
    ok:    'bg-green-500/15 text-green-400 border-green-500/30',
    warn:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/15 text-red-400 border-red-500/30',
  } as const;
  const cls = map[status as keyof typeof map] ?? map.warn;
  const icon = status === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${cls}`}>
      {icon} {status.toUpperCase()}
    </span>
  );
}

function MetricCard({ label, value, icon: Icon, color = 'teal', sublabel }: {
  label: string; value: string | number; icon: any; color?: string; sublabel?: string;
}) {
  const colors: Record<string, string> = {
    teal:   'from-[var(--nile-teal)]/20 to-transparent border-[var(--nile-teal)]/20',
    gold:   'from-[var(--royal-gold)]/20 to-transparent border-[var(--royal-gold)]/20',
    purple: 'from-purple-500/20 to-transparent border-purple-500/20',
    red:    'from-red-500/20 to-transparent border-red-500/20',
    green:  'from-green-500/20 to-transparent border-green-500/20',
  };
  const iconColors: Record<string, string> = {
    teal: 'text-[var(--nile-teal)]', gold: 'text-[var(--royal-gold)]',
    purple: 'text-purple-400', red: 'text-red-400', green: 'text-green-400',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 font-cairo">{label}</span>
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
      </div>
      <span className="text-3xl font-black text-white font-sans">{value}</span>
      {sublabel && <span className="text-xs text-gray-500 font-cairo">{sublabel}</span>}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DevDashboard() {
  const { user } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'db' | 'logs' | 'system'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Data state
  const [metrics, setMetrics] = useState({
    totalUsers: 0, totalPharmacies: 0, totalChains: 0,
    totalProducts: 0, totalOrders: 0, activeUsers: 0,
  });
  const [tableStats, setTableStats] = useState<TableStat[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [dbSize, setDbSize] = useState('—');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const pharmacyId = user?.user_metadata?.pharmacy_id;

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const checks: SystemCheck[] = [];

      // Auth check
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
      checks.push({
        label: 'Supabase Auth',
        status: authErr ? 'error' : 'ok',
        detail: authErr ? authErr.message : `Authenticated as ${authUser?.email}`,
      });

      // Pharmacy count
      const { count: pharmCount, error: pharmErr } = await supabase
        .from('pharmacies').select('*', { count: 'exact', head: true });
      checks.push({
        label: 'Pharmacies Table',
        status: pharmErr ? 'error' : 'ok',
        detail: pharmErr ? pharmErr.message : `${pharmCount} records accessible`,
      });

      // Chains check
      const { count: chainCount, error: chainErr } = await supabase
        .from('chains').select('*', { count: 'exact', head: true });
      checks.push({
        label: 'Chains Table',
        status: chainErr ? 'error' : 'ok',
        detail: chainErr ? chainErr.message : `${chainCount} chains accessible`,
      });

      // Products check
      const { count: productCount, error: prodErr } = await supabase
        .from('products').select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId || '00000000-0000-0000-0000-000000000000');
      checks.push({
        label: 'Products Table (RLS)',
        status: prodErr ? 'error' : 'ok',
        detail: prodErr ? prodErr.message : `${productCount} products in scope`,
      });

      // Orders check
      const { count: orderCount, error: orderErr } = await supabase
        .from('orders').select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId || '00000000-0000-0000-0000-000000000000');
      checks.push({
        label: 'Orders Table (RLS)',
        status: orderErr ? 'error' : 'ok',
        detail: orderErr ? orderErr.message : `${orderCount} orders in scope`,
      });

      // Offline queue check
      let queueSize = 0;
      try {
        const q = localStorage.getItem('offline_returns_queue');
        queueSize = q ? JSON.parse(q).length : 0;
        checks.push({
          label: 'Offline Queue', status: queueSize > 0 ? 'warn' : 'ok',
          detail: queueSize > 0 ? `${queueSize} items pending sync` : 'Queue empty',
        });
      } catch {
        checks.push({ label: 'Offline Queue', status: 'warn', detail: 'Cannot read localStorage' });
      }

      setSystemChecks(checks);

      // Metrics
      setMetrics({
        totalUsers: 0,
        totalPharmacies: pharmCount || 0,
        totalChains: chainCount || 0,
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        activeUsers: 0,
      });

      // Table stats (manual list since pg_stats may be restricted)
      const tables = ['products', 'orders', 'customers', 'invoices', 'returns',
        'stock_transfers', 'financials', 'companies', 'shortages'];
      const stats: TableStat[] = [];
      for (const t of tables) {
        const { count } = await supabase.from(t as any).select('*', { count: 'exact', head: true })
          .eq('pharmacy_id', pharmacyId || '');
        stats.push({ table: t, rows: count || 0, size: '—' });
      }
      setTableStats(stats);

      // Agent logs
      const { data: logs } = await supabase
        .from('agent_logs').select('*').order('created_at', { ascending: false }).limit(30);
      setAgentLogs(logs || []);

      setLastRefresh(new Date());
    } catch (err) {
      console.error('[DevDashboard] fetchAll error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [pharmacyId, supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Copy helper ─────────────────────────────────────────────────────────
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart2 },
    { id: 'db',       label: 'قاعدة البيانات', icon: Database },
    { id: 'logs',     label: 'سجل العمليات', icon: Terminal },
    { id: 'system',   label: 'فحص النظام', icon: Shield },
  ] as const;

  return (
    <div className="px-4 md:px-8 w-full max-w-7xl mx-auto space-y-8 pb-12 font-cairo" dir="rtl">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black flex items-center gap-4 tracking-tight"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-[var(--nile-teal)] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Code className="text-white w-6 h-6" />
            </div>
            <span className="nile-gradient-text">لوحة المطور</span>
          </motion.h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
            Developer Dashboard · System Monitor
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 text-left">
            <Clock className="w-3.5 h-3.5 inline ml-1" />
            آخر تحديث: {lastRefresh.toLocaleTimeString('ar-EG')}
          </div>
          <button
            onClick={fetchAll}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-[var(--nile-teal)] border-[var(--nile-teal)] bg-[var(--nile-teal)]/5'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard label="السلاسل" value={metrics.totalChains} icon={Shield} color="purple" />
              <MetricCard label="الصيدليات" value={metrics.totalPharmacies} icon={Server} color="teal" />
              <MetricCard label="المنتجات" value={metrics.totalProducts} icon={Package} color="gold" />
              <MetricCard label="الطلبات" value={metrics.totalOrders} icon={ShoppingCart} color="green" />
              <MetricCard label="حجم DB" value={dbSize} icon={Database} color="teal" sublabel="تقديري" />
              <MetricCard label="الحالة" value="نشط" icon={Activity} color="green" sublabel="جميع الأنظمة" />
            </div>

            {/* Tech Stack Info */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-[var(--nile-teal)]" /> معلومات البيئة التقنية
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {[
                  { k: 'Framework', v: 'Next.js 15 (App Router)' },
                  { k: 'Database', v: 'Supabase (PostgreSQL 15)' },
                  { k: 'Auth', v: 'Supabase Auth (JWT)' },
                  { k: 'Animations', v: 'Framer Motion 12' },
                  { k: 'Hosting', v: 'Vercel (recommended)' },
                  { k: 'Architecture', v: 'Multi-Chain Multi-Tenant' },
                  { k: 'User Role in Session', v: user?.user_metadata?.role || '—' },
                  { k: 'Pharmacy ID', v: user?.user_metadata?.pharmacy_id || 'N/A (chain_admin)' },
                  { k: 'Chain ID', v: user?.user_metadata?.chain_id || '—' },
                  { k: 'User Email', v: user?.email || '—' },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-gray-400 font-bold">{k}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-xs">{v}</span>
                      <button
                        onClick={() => copyText(v)}
                        className="text-gray-600 hover:text-[var(--nile-teal)] transition-colors"
                        title="Copy"
                      >
                        {copiedText === v ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ DATABASE TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'db' && (
          <motion.div key="db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <Database className="w-5 h-5 text-[var(--nile-teal)]" />
                <h2 className="font-black text-white">إحصائيات الجداول (نطاق الصيدلية الحالية)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400">
                      <th className="text-right py-3 px-5 font-bold">اسم الجدول</th>
                      <th className="text-right py-3 px-5 font-bold">عدد السجلات</th>
                      <th className="text-right py-3 px-5 font-bold">الحجم</th>
                      <th className="text-right py-3 px-5 font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableStats.map((stat, i) => (
                      <tr key={stat.table} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/2' : ''}`}>
                        <td className="py-3 px-5 font-mono text-[var(--nile-teal)] text-xs">{stat.table}</td>
                        <td className="py-3 px-5 text-white font-bold">{stat.rows.toLocaleString()}</td>
                        <td className="py-3 px-5 text-gray-400">{stat.size}</td>
                        <td className="py-3 px-5">
                          <StatusBadge status={stat.rows >= 0 ? 'ok' : 'error'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DB File Reference */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="font-black text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-[var(--nile-teal)]" /> ملفات SQL المرجعية (database/)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { f: 'FULL_DB_SETUP.sql', desc: '⭐ الإعداد الكامل — شغّل أولاً', priority: true },
                  { f: 'chains_migration.sql', desc: 'إضافة جدول السلاسل + RLS متعدد المستأجرين', priority: true },
                  { f: 'fix_rls_triggers.sql', desc: 'trigger التسجيل + RLS hardening' },
                  { f: 'fix_registration_permissions.sql', desc: 'صلاحيات انون والخدمة' },
                  { f: 'database_optimization.sql', desc: 'فهارس، مشاهد، أداء' },
                  { f: 'reset.sql', desc: '⚠️ حذف كل شيء — استخدام حذر فقط', priority: false },
                  { f: 'seed_data.sql', desc: 'بيانات تجريبية للتطوير' },
                  { f: 'debug_stats.sql', desc: 'استعلامات تشخيصية' },
                ].map(({ f, desc, priority }) => (
                  <div key={f} className={`p-3 rounded-xl border flex items-start gap-3 ${
                    priority ? 'border-[var(--nile-teal)]/20 bg-[var(--nile-teal)]/5' : 'border-white/5 bg-white/3'
                  }`}>
                    <Code className={`w-4 h-4 mt-0.5 shrink-0 ${priority ? 'text-[var(--nile-teal)]' : 'text-gray-500'}`} />
                    <div>
                      <p className="font-mono text-xs text-white">{f}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ LOGS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[var(--nile-teal)]" />
                  <h2 className="font-black text-white">سجل عمليات AI Agent (آخر 30)</h2>
                </div>
                <span className="text-xs text-gray-500">{agentLogs.length} سجل</span>
              </div>

              {agentLogs.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  لا توجد سجلات. جدول agent_logs فارغ أو غير موجود بعد.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {agentLogs.map((log) => (
                    <div key={log.id} className="hover:bg-white/5 transition-colors">
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="w-full text-right p-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <StatusBadge status={log.status === 'success' ? 'ok' : log.status === 'error' ? 'error' : 'warn'} />
                          <code className="text-xs text-[var(--nile-teal)] truncate">{log.action}</code>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString('ar-EG')}
                          </span>
                          {expandedLog === log.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>
                      {expandedLog === log.id && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {log.input && (
                            <div className="bg-black/40 rounded-xl p-3 font-mono text-xs text-green-400 overflow-auto max-h-32">
                              <span className="text-gray-500 block mb-1">INPUT:</span>
                              {log.input}
                            </div>
                          )}
                          {log.output && (
                            <div className="bg-black/40 rounded-xl p-3 font-mono text-xs text-blue-300 overflow-auto max-h-32">
                              <span className="text-gray-500 block mb-1">OUTPUT:</span>
                              {log.output}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ SYSTEM TAB ════════════════════════════════════════════════════ */}
        {activeTab === 'system' && (
          <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* System Checks */}
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--nile-teal)]" />
                <h2 className="font-black text-white">فحص اتصال قاعدة البيانات والصلاحيات</h2>
              </div>
              <div className="divide-y divide-white/5">
                {systemChecks.map((check) => (
                  <div key={check.label} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={check.status} />
                      <span className="font-bold text-sm text-white">{check.label}</span>
                    </div>
                    <span className="text-xs text-gray-400 text-left max-w-xs truncate">{check.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Known Issues */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="font-black text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-amber-400" /> مشكلات شائعة ونصائح
              </h2>
              <div className="space-y-3">
                {[
                  {
                    severity: 'warn',
                    title: 'chain_admin ليس لديه pharmacy_id',
                    detail: 'هذا متوقع. يجب التحقق من userRole !== "chain_admin" قبل رفض الوصول في LayoutWrapper.',
                  },
                  {
                    severity: 'warn',
                    title: 'استخدام .single() بدلاً من .maybeSingle()',
                    detail: 'قد يتسبب في خطأ PGRST116 عند عدم وجود سجل. استبدل دائماً بـ .maybeSingle().',
                  },
                  {
                    severity: 'warn',
                    title: 'JWT metadata قد تكون قديمة',
                    detail: 'بعد تغيير الدور، يجب تسجيل الخروج والدخول مجدداً لتحديث الـ JWT.',
                  },
                  {
                    severity: 'ok',
                    title: 'وضع عدم الاتصال (Offline)',
                    detail: 'POS يعمل كاملاً بدون إنترنت. البيانات تُحفظ في localStorage وتُزامن عند العودة.',
                  },
                  {
                    severity: 'warn',
                    title: 'أذونات anon على جداول chains/pharmacies',
                    detail: 'يجب منح SELECT لـ anon لعمل صفحة تسجيل الدخول (اختيار السلسلة والصيدلية).',
                  },
                ].map((issue) => (
                  <div
                    key={issue.title}
                    className={`p-4 rounded-xl border flex gap-3 ${
                      issue.severity === 'ok'
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-amber-500/20 bg-amber-500/5'
                    }`}
                  >
                    {issue.severity === 'ok'
                      ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-bold text-sm text-white">{issue.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{issue.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Env Variables Check */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="font-black text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-[var(--nile-teal)]" /> متغيرات البيئة المطلوبة
              </h2>
              <div className="space-y-2">
                {[
                  { key: 'NEXT_PUBLIC_SUPABASE_URL', present: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
                  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
                  { key: 'SUPABASE_SERVICE_ROLE_KEY', present: false, note: 'server-only' },
                  { key: 'GEMINI_API_KEY', present: false, note: 'server-only' },
                ].map(({ key, present, note }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <code className="text-xs text-[var(--nile-teal)]">{key}</code>
                    <div className="flex items-center gap-2">
                      {note && <span className="text-xs text-gray-500">{note}</span>}
                      <StatusBadge status={present ? 'ok' : 'warn'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
