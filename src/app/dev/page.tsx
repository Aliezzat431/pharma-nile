"use client";

import {
  useState, useEffect, useCallback, useRef, useMemo, memo
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle2, Database, RefreshCw,
  Server, ShoppingCart, Package, Clock, Bug, BarChart2,
  Code, Terminal, Shield, Key, ChevronDown, ChevronUp,
  Copy, Check, Cpu, HardDrive, Globe, Command,
  WifiOff, AlertCircle, User, Calendar, Info, XCircle
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────
const NULL_UUID = '00000000-0000-0000-0000-000000000000';
const REFRESH_COOLDOWN_MS = 5_000;
const TERMINAL_LS_KEY = 'pharmanile_terminal_history';
const MAX_TERMINAL_LINES = 500;

const BOOT_LINES = [
  '══════════════════════════════════════════════════════════════',
  '⚙  PHARMANILE SHIELD KERNEL DEV-CONSOLE v2.4.0',
  '🔌 GATEWAY  : Connected to Supabase Engine (PostgreSQL 15)',
  '🔐 SYSTEM   : ACCESS GRANTED — METADATA INJECTED',
  '══════════════════════════════════════════════════════════════',
  'Type "help" to display operational commands.',
  '',
];

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'db' | 'logs' | 'system' | 'terminal';
type CheckStatus = 'ok' | 'warn' | 'error';
type ErrorCategory = 'Auth' | 'DB' | 'Network' | 'Unknown';

interface TableStat  { table: string; rows: number }
interface AgentLog   { id: string; action: string; status: string; created_at: string; input?: string; output?: string }
interface SystemCheck { label: string; status: CheckStatus; detail: string; category: ErrorCategory }
interface FetchError  { category: ErrorCategory; message: string; ts: number }

// ─── Memoised Sub-components ──────────────────────────────────────────────────

const StatusBadge = memo(function StatusBadge({ status }: { status: CheckStatus | string }) {
  const styles: Record<string, string> = {
    ok:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    warn:    'bg-amber-500/10  text-amber-400  border-amber-500/25',
    error:   'bg-rose-500/10   text-rose-400   border-rose-500/25',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  };
  const cls = styles[status] ?? styles.warn;
  const Icon = status === 'ok' || status === 'success' ? CheckCircle2 : AlertTriangle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${cls}`}>
      <Icon className="w-3 h-3" />
      {status.toUpperCase()}
    </span>
  );
});

const MetricCard = memo(function MetricCard({
  label, value, icon: Icon, color = 'teal', sublabel,
}: { label: string; value: string | number; icon: any; color?: string; sublabel?: string }) {
  const border: Record<string, string> = {
    teal:   'border-[var(--nile-teal)]/20 from-[var(--nile-teal)]/8',
    gold:   'border-[var(--royal-gold)]/20 from-[var(--royal-gold)]/8',
    purple: 'border-purple-500/20 from-purple-500/8',
    green:  'border-emerald-500/20 from-emerald-500/8',
  };
  const iconCls: Record<string, string> = {
    teal: 'text-[var(--nile-teal)]', gold: 'text-[var(--royal-gold)]',
    purple: 'text-purple-400', green: 'text-emerald-400',
  };
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      className={`bg-gradient-to-br ${border[color] ?? border.teal} to-transparent border rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-md`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400">{label}</span>
        <Icon className={`w-4.5 h-4.5 ${iconCls[color] ?? iconCls.teal}`} />
      </div>
      <span className="text-3xl font-black text-white tracking-tight">{value}</span>
      {sublabel && <span className="text-[10px] text-gray-500">{sublabel}</span>}
    </motion.div>
  );
});

// ─── Error Banner ─────────────────────────────────────────────────────────────
const categoryIcon: Record<ErrorCategory, React.ElementType> = {
  Auth: Key, DB: Database, Network: Globe, Unknown: AlertCircle,
};
const ErrorBanner = memo(function ErrorBanner({ errors, onDismiss }: { errors: FetchError[]; onDismiss: () => void }) {
  if (!errors.length) return null;
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white mb-1">أخطاء أثناء التحديث</p>
        <ul className="space-y-1">
          {errors.map((e, i) => {
            const EIcon = categoryIcon[e.category];
            return (
              <li key={i} className="flex items-start gap-2 text-xs text-rose-300">
                <EIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>[{e.category}] {e.message}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <button onClick={onDismiss} className="text-gray-500 hover:text-white transition-colors shrink-0">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DevDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // ─── Role Guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    const role = user?.user_metadata?.role;
    if (!role || !['admin', 'developer'].includes(role)) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // ─── State ──────────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState<TabId>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh,  setLastRefresh]  = useState<Date>(new Date());
  const [nextAllowedRefresh, setNextAllowedRefresh] = useState(0); // epoch ms
  const [copiedText,   setCopiedText]   = useState<string | null>(null);
  const [fetchErrors,  setFetchErrors]  = useState<FetchError[]>([]);
  const [expandedLog,  setExpandedLog]  = useState<string | null>(null);

  // Simulated hardware metrics
  const [systemLoad, setSystemLoad] = useState({ cpu: 12, memory: 44, latencyMs: 45 });

  // Dashboard data
  const [metrics,      setMetrics]      = useState({ totalPharmacies: 0, totalChains: 0, totalProducts: 0, totalOrders: 0 });
  const [tableStats,   setTableStats]   = useState<TableStat[]>([]);
  const [agentLogs,    setAgentLogs]    = useState<AgentLog[]>([]);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [dbSize,       setDbSize]       = useState('—');

  // Terminal
  const savedHistory = useMemo<string[]>(() => {
    if (typeof window === 'undefined') return BOOT_LINES;
    try { return JSON.parse(localStorage.getItem(TERMINAL_LS_KEY) ?? 'null') || BOOT_LINES; }
    catch { return BOOT_LINES; }
  }, []);
  const [terminalHistory, setTerminalHistory] = useState<string[]>(savedHistory);
  const [terminalInput,   setTerminalInput]   = useState('');
  const [cmdHistoryIdx,   setCmdHistoryIdx]   = useState(-1);
  const cmdHistory = useRef<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  const pharmacyId = user?.user_metadata?.pharmacy_id ?? NULL_UUID;

  // ─── Side effects ────────────────────────────────────────────────────────────
  // Fluctuate simulated CPU/RAM
  useEffect(() => {
    const t = setInterval(() => {
      setSystemLoad(prev => ({
        ...prev,
        cpu:    Math.floor(Math.random() * 14) + 6,
        memory: 42 + Math.floor(Math.random() * 6),
      }));
    }, 4_500);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeTab === 'terminal') terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory, activeTab]);

  // Persist terminal to localStorage (trim to MAX_TERMINAL_LINES)
  useEffect(() => {
    const trimmed = terminalHistory.slice(-MAX_TERMINAL_LINES);
    try { localStorage.setItem(TERMINAL_LS_KEY, JSON.stringify(trimmed)); } catch { /* ignore */ }
  }, [terminalHistory]);

  // ─── Parallel Data Fetch ─────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const now = Date.now();
    if (isRefreshing || now < nextAllowedRefresh) return;

    setIsRefreshing(true);
    setNextAllowedRefresh(now + REFRESH_COOLDOWN_MS);
    const errors: FetchError[] = [];

    try {
      // --- AUTH check (timed) ---
      const authStart = performance.now();
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
      const authLatencyMs = Math.round(performance.now() - authStart);

      const checks: SystemCheck[] = [];

      if (authErr) {
        errors.push({ category: 'Auth', message: authErr.message, ts: Date.now() });
      }
      checks.push({
        label: 'Supabase Auth API',
        status: authErr ? 'error' : 'ok',
        detail: authErr ? authErr.message : `نشط · ${authUser?.email} · ${authLatencyMs}ms`,
        category: 'Auth',
      });

      // --- ALL DB counts in parallel ---
      const dbStart = performance.now();
      const prodQuery = supabase.from('products').select('*', { count: 'exact', head: true });
      const orderQuery = supabase.from('orders').select('*', { count: 'exact', head: true });
      const [
        pharmRes, chainRes, prodRes, orderRes,
      ] = await Promise.all([
        supabase.from('pharmacies').select('*', { count: 'exact', head: true }),
        supabase.from('chains').select('*', { count: 'exact', head: true }),
        user?.user_metadata?.pharmacy_id ? prodQuery.eq('pharmacy_id', user.user_metadata.pharmacy_id) : prodQuery,
        user?.user_metadata?.pharmacy_id ? orderQuery.eq('pharmacy_id', user.user_metadata.pharmacy_id) : orderQuery,
      ]);
      const dbLatencyMs = Math.round(performance.now() - dbStart);
      setSystemLoad(prev => ({ ...prev, latencyMs: dbLatencyMs }));

      for (const { error } of [pharmRes, chainRes, prodRes, orderRes]) {
        if (error) errors.push({ category: 'DB', message: error.message, ts: Date.now() });
      }

      checks.push(
        {
          label: 'جداول الصيدليات',
          status: pharmRes.error ? 'error' : 'ok',
          detail: pharmRes.error ? pharmRes.error.message : `${pharmRes.count ?? 0} سجل · ${dbLatencyMs}ms`,
          category: 'DB',
        },
        {
          label: 'جداول السلاسل',
          status: chainRes.error ? 'error' : 'ok',
          detail: chainRes.error ? chainRes.error.message : `${chainRes.count ?? 0} سلسلة`,
          category: 'DB',
        },
        {
          label: 'عزل المنتجات (RLS)',
          status: prodRes.error ? 'error' : 'ok',
          detail: prodRes.error ? prodRes.error.message : `${prodRes.count ?? 0} منتج في النطاق`,
          category: 'DB',
        },
        {
          label: 'عزل الأوامر (RLS)',
          status: orderRes.error ? 'error' : 'ok',
          detail: orderRes.error ? orderRes.error.message : `${orderRes.count ?? 0} أوردر`,
          category: 'DB',
        },
      );

      // --- Offline queue ---
      try {
        const raw = localStorage.getItem('offline_returns_queue');
        const queueSize = raw ? (JSON.parse(raw) as any[]).length : 0;
        checks.push({
          label: 'قائمة الانتظار المحلية',
          status: queueSize > 0 ? 'warn' : 'ok',
          detail: queueSize > 0 ? `${queueSize} عمليات بانتظار المزامنة` : 'فارغة ومستقرة',
          category: 'Unknown',
        });
      } catch {
        checks.push({ label: 'قائمة الانتظار المحلية', status: 'warn', detail: 'تعذّر القراءة', category: 'Unknown' });
      }

      setSystemChecks(checks);
      setMetrics({
        totalPharmacies: pharmRes.count ?? 0,
        totalChains:     chainRes.count ?? 0,
        totalProducts:   prodRes.count  ?? 0,
        totalOrders:     orderRes.count ?? 0,
      });

      // --- Table stats all in parallel ---
      const TABLES = ['products','orders','customers','invoices','returns',
                      'stock_transfers','financials','companies','shortages'];
      const tableResults = await Promise.all(
        TABLES.map(t =>
          supabase.from(t as any)
            .select('*', { count: 'exact', head: true })
            .eq('pharmacy_id', pharmacyId)
            .then(r => ({ table: t, rows: r.count ?? -1 }))
        )
      );
      setTableStats(tableResults);

      const totalRows = tableResults.reduce((s, r) => s + (r.rows > 0 ? r.rows : 0), 0);
      const estKb = totalRows * 0.45;
      setDbSize(estKb >= 1024 ? `${(estKb / 1024).toFixed(1)} MB` : `${estKb.toFixed(0)} KB`);

      // --- Agent logs ---
      const { data: logs, error: logsErr } = await supabase
        .from('agent_action_logs').select('*').order('created_at', { ascending: false }).limit(30);

      if (logsErr) errors.push({ category: 'DB', message: logsErr.message, ts: Date.now() });

      setAgentLogs((logs ?? []).map((l: any) => ({
        id:         l.id,
        action:     `${l.action_type ?? 'OPERATION'} → ${l.table_name ?? 'unknown'} (${l.record_id ?? 'N/A'})`,
        status:     l.undone ? 'warn' : 'success',
        created_at: l.created_at,
        input:  l.previous_payload ? JSON.stringify(l.previous_payload, null, 2) : undefined,
        output: l.new_payload      ? JSON.stringify(l.new_payload,      null, 2) : undefined,
      })));

    } catch (e: any) {
      errors.push({ category: 'Network', message: e?.message ?? 'Unknown network error', ts: Date.now() });
    } finally {
      setFetchErrors(errors);
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }
  }, [isRefreshing, nextAllowedRefresh, pharmacyId, supabase]);

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  // ─── Memoised derived values ─────────────────────────────────────────────────
  const integrityScore = useMemo(() => {
    if (!systemChecks.length) return 100;
    return Math.round(systemChecks.filter(c => c.status === 'ok').length / systemChecks.length * 100);
  }, [systemChecks]);

  const refreshCooldownActive = Date.now() < nextAllowedRefresh && !isRefreshing;

  // ─── Copy helper ─────────────────────────────────────────────────────────────
  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  }, []);

  // ─── Terminal ────────────────────────────────────────────────────────────────
  const pushLines = useCallback((lines: string[]) => {
    setTerminalHistory(prev => [...prev, ...lines, '']);
  }, []);

  const handleCommandSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const raw = terminalInput.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    cmdHistory.current = [raw, ...cmdHistory.current].slice(0, 50);
    setCmdHistoryIdx(-1);
    setTerminalInput('');

    const stamp = `[${new Date().toLocaleTimeString()}]`;
    let out: string[] = [`${stamp} $ ${raw}`];

    switch (cmd) {
      case 'help':
        out = [...out,
          '┌─ Available Commands ─────────────────────────────┐',
          '│  help       Show this guide                      │',
          '│  whoami     Show current session identity        │',
          '│  date       Print current date/time              │',
          '│  version    Show system version info             │',
          '│  neofetch   Visual system overview / ASCII art   │',
          '│  status     Auth & RLS security report           │',
          '│  ping       Test DB gateway latency              │',
          '│  sysload    CPU / RAM / latency gauges           │',
          '│  db-stats   Table row counts in scope            │',
          '│  logs       Last 4 AI agent operations           │',
          '│  errors     List last fetch errors               │',
          '│  clear      Clear terminal buffer                │',
          '└──────────────────────────────────────────────────┘',
        ]; break;

      case 'whoami':
        out = [...out,
          `User     : ${user?.email ?? 'N/A'}`,
          `Role     : ${user?.user_metadata?.role ?? 'N/A'}`,
          `Pharmacy : ${user?.user_metadata?.pharmacy_id ?? 'N/A (System Developer)'}`,
          `Chain    : ${user?.user_metadata?.chain_id ?? '—'}`,
          `UID      : ${user?.id ?? 'N/A'}`,
        ]; break;

      case 'date':
        out = [...out, new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'medium' })];
        break;

      case 'version':
        out = [...out,
          'PharmaNile OS     : v2.4.0',
          'Next.js           : 15 (App Router)',
          'Supabase SDK      : v2',
          'Framer Motion     : 12',
          'Database Engine   : PostgreSQL 15',
          'Console Build     : DEV-CONSOLE-KERNEL-2024',
        ]; break;

      case 'neofetch':
        out = [...out,
          '   .--.       PharmaNile Node-Server',
          '  |o_o |      OS        : Next.js 15 (Edge Runtime)',
          '  |:_/ |      Kernel    : Supabase Engine SDK v2',
          ' //   \\ \\     RAM       : ' + systemLoad.memory + '%',
          '(|     | )    CPU       : ' + systemLoad.cpu + '%',
          '/\'\\_ _/`\\    DB Latency: ' + systemLoad.latencyMs + 'ms',
          '\\___)=(___/   Role      : DEVELOPER_ADMIN (STAMPED)',
        ]; break;

      case 'clear':
        setTerminalHistory([]);
        return;

      case 'status':
        out = [...out,
          '─── 🔒 SECURITY REPORT ──────────────────────────',
          `JWT Auth     : ${user ? 'OK' : 'MISSING'}`,
          `Email        : ${user?.email ?? 'N/A'}`,
          `Role         : ${user?.user_metadata?.role ?? 'N/A'}`,
          `RLS Mode     : ENFORCED (Multi-Tenant)`,
          `Integrity    : ${integrityScore}%`,
          `Errors       : ${fetchErrors.length} pending`,
        ]; break;

      case 'ping':
        out = [...out,
          `PING supabase.co Gateway`,
          `Reply: bytes=32 time=${systemLoad.latencyMs}ms TTL=54`,
          `Reply: bytes=32 time=${Math.max(1, systemLoad.latencyMs - 2)}ms TTL=54`,
          `State: ${systemLoad.latencyMs < 100 ? 'EXCELLENT' : systemLoad.latencyMs < 300 ? 'GOOD' : 'HIGH LATENCY'}`,
        ]; break;

      case 'db-stats':
        out = [...out, '─── TABLE STATS (BRANCH SCOPE) ─────────────────',
          ...tableStats.map(s =>
            `  ${s.table.padEnd(18)} : ${s.rows === -1 ? 'REJECTED (RLS)' : s.rows}`
          ),
        'DB Est. Size : ' + dbSize,
        ]; break;

      case 'sysload': {
        const bar = (n: number, max: number) =>
          '█'.repeat(Math.round(n / max * 20)) + '░'.repeat(20 - Math.round(n / max * 20));
        out = [...out,
          `CPU  [${bar(systemLoad.cpu, 100)}] ${systemLoad.cpu}%`,
          `RAM  [${bar(systemLoad.memory, 100)}] ${systemLoad.memory}%`,
          `PING [${bar(Math.min(systemLoad.latencyMs, 500), 500)}] ${systemLoad.latencyMs}ms`,
        ]; break;
      }

      case 'logs':
        out = [...out, '─── AI AGENT LOGS (LAST 4) ──────────────────────',
          ...(agentLogs.length
            ? agentLogs.slice(0, 4).map(l =>
                `  [${new Date(l.created_at).toLocaleTimeString()}] ${l.status.toUpperCase()} ${l.action}`)
            : ['  No logs found.']),
        ]; break;

      case 'errors':
        out = [...out, '─── FETCH ERRORS ────────────────────────────────',
          ...(fetchErrors.length
            ? fetchErrors.map(e => `  [${e.category}] ${e.message}`)
            : ['  No errors recorded ✓']),
        ]; break;

      default:
        out = [...out, `nile-bash: command not found: "${cmd}"`, `Run "help" for available commands.`];
    }

    pushLines(out);
  }, [terminalInput, user, systemLoad, tableStats, dbSize, agentLogs, fetchErrors, integrityScore, pushLines]);

  // Arrow-key navigation through command history
  const handleTerminalKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!cmdHistory.current.length) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCmdHistoryIdx(prev => {
        const next = Math.min(prev + 1, cmdHistory.current.length - 1);
        setTerminalInput(cmdHistory.current[next] ?? '');
        return next;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCmdHistoryIdx(prev => {
        const next = Math.max(prev - 1, -1);
        setTerminalInput(next === -1 ? '' : (cmdHistory.current[next] ?? ''));
        return next;
      });
    }
  }, []);

  // ─── Tabs ────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview' as const, label: 'نظرة عامة',      icon: BarChart2  },
    { id: 'db'       as const, label: 'قاعدة البيانات',  icon: Database   },
    { id: 'logs'     as const, label: 'سجل العمليات',    icon: Activity   },
    { id: 'system'   as const, label: 'فحص النظام',      icon: Shield     },
    { id: 'terminal' as const, label: 'الكونسول',        icon: Terminal   },
  ];

  // ─── Guard: show nothing until auth resolves ─────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[var(--nile-teal)] animate-spin" />
      </div>
    );
  }


  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="px-3 sm:px-6 md:px-8 w-full max-w-7xl mx-auto space-y-6 pb-12 font-cairo text-right" dir="rtl">

      {/* ══ HEADER ══════════════════════════════════════════════════════════════ */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6
                         bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl relative overflow-hidden
                         shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--nile-teal)]/5 to-purple-500/5 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-[var(--nile-teal)]
                          flex items-center justify-center shadow-[0_0_25px_rgba(20,184,166,0.35)] shrink-0">
            <Code className="text-white w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">لوحة المطور</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-sans flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
              PharmaNile OS v2.4.0 · DEV Console
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative z-10">
          {/* Simulated hardware pills */}
          <div className="hidden xl:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-[11px] text-gray-400 font-mono">
            <span className="flex items-center gap-1.5"><Cpu   className="w-3.5 h-3.5 text-purple-400" />CPU: {systemLoad.cpu}%</span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-amber-400" />RAM: {systemLoad.memory}%</span>
            <span className="w-px h-3 bg-white/10" />
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-[var(--nile-teal)]" />DB: {systemLoad.latencyMs}ms</span>
          </div>

          <div className="text-[11px] text-gray-400 flex items-center gap-2 bg-white/5 px-3 py-2 border border-white/5 rounded-2xl">
            <Clock className="w-3.5 h-3.5 text-[var(--nile-teal)]" />
            <span className="font-mono text-white font-bold">{lastRefresh.toLocaleTimeString('ar-EG')}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fetchAll}
            disabled={isRefreshing || refreshCooldownActive}
            title={refreshCooldownActive ? 'انتظر 5 ثواني قبل التحديث التالي' : 'تحديث'}
            className="flex items-center gap-2 px-4 py-2
                       bg-gradient-to-r from-[var(--nile-teal)] to-teal-500
                       hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white text-sm font-black rounded-2xl
                       shadow-[0_0_15px_rgba(20,184,166,0.2)] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث الأنظمة</span>
          </motion.button>
        </div>
      </header>

      {/* ══ ERROR BANNER ════════════════════════════════════════════════════════ */}
      <ErrorBanner errors={fetchErrors} onDismiss={() => setFetchErrors([])} />

      {/* ══ TABS ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-white/5 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white bg-white/5 border border-white/10'
                : 'text-gray-500 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--nile-teal)]/10 to-transparent border-t border-l border-[var(--nile-teal)]/30 pointer-events-none"
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
            )}
            <tab.icon className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? 'text-[var(--nile-teal)]' : ''}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.18 }} className="space-y-6">

            {/* Integrity gauge + load monitors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Circular gauge */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center justify-between gap-5 relative overflow-hidden bg-slate-950/20">
                <div className="absolute right-0 top-0 w-20 h-20 bg-[var(--nile-teal)]/5 blur-3xl rounded-full" />
                <div className="space-y-2 min-w-0">
                  <h3 className="text-base font-black text-white">مؤشر أمان النظام</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">نسبة الفحوصات الناجحة</p>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${integrityScore >= 80 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {integrityScore >= 80 ? 'المستويات آمنة' : 'تحقق من الأخطاء'}
                  </span>
                </div>
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="7" fill="none" />
                    <motion.circle
                      cx="50" cy="50" r="42"
                      stroke="var(--nile-teal)" strokeWidth="7" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42}
                      animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - integrityScore / 100) }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ filter: 'drop-shadow(0 0 5px var(--nile-teal))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white leading-none">{integrityScore}%</span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">INTEGRITY</span>
                  </div>
                </div>
              </div>

              {/* Load bars */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-slate-950/20 col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5 relative overflow-hidden">
                {[
                  { label: 'حمل المعالج (CPU)', value: systemLoad.cpu, max: 100, color: 'bg-purple-500' },
                  { label: 'الذاكرة (RAM)',      value: systemLoad.memory, max: 100, color: 'bg-amber-400' },
                  { label: 'كمون DB',             value: Math.min(systemLoad.latencyMs, 500), max: 500, color: 'bg-[var(--nile-teal)]', display: `${systemLoad.latencyMs}ms` },
                ].map(({ label, value, max, color, display }) => (
                  <div key={label} className="flex flex-col justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-gray-400 block">{label}</span>
                      <span className="text-xl font-black text-white font-sans mt-1 block">{display ?? `${value}%`}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <motion.div animate={{ width: `${value / max * 100}%` }} className={`${color} h-full rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="السلاسل"    value={metrics.totalChains}     icon={Shield}      color="purple" />
              <MetricCard label="الصيدليات"  value={metrics.totalPharmacies}  icon={Server}      color="teal"   />
              <MetricCard label="المنتجات"   value={metrics.totalProducts}    icon={Package}     color="gold"   />
              <MetricCard label="الطلبات"    value={metrics.totalOrders}      icon={ShoppingCart} color="green"  />
            </div>

            {/* Env info grid */}
            <div className="p-5 sm:p-6 bg-slate-900/30 border border-white/5 rounded-3xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-[var(--nile-teal)]" />
                <h3 className="text-base font-black text-white">معلومات البيئة</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm">
                {[
                  { k: 'Framework',          v: 'Next.js 15 (App Router)'          },
                  { k: 'Database Engine',    v: 'Supabase (PostgreSQL 15)'          },
                  { k: 'Auth Method',        v: 'Supabase Auth (JWT Claims)'        },
                  { k: 'Animation',          v: 'Framer Motion 12'                  },
                  { k: 'User Role (meta)',   v: user?.user_metadata?.role ?? '—'    },
                  { k: 'Pharmacy ID',        v: user?.user_metadata?.pharmacy_id ?? 'N/A' },
                  { k: 'Chain ID',           v: user?.user_metadata?.chain_id       ?? '—' },
                  { k: 'Email',              v: user?.email                          ?? '—' },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between items-center p-3 bg-slate-950/20 border border-white/5 rounded-xl hover:bg-white/5 transition-all">
                    <span className="text-gray-400 font-bold text-[11px]">{k}</span>
                    <div className="flex items-center gap-2">
                      <code className="text-white text-[11px] select-all truncate max-w-[160px]">{v}</code>
                      <button onClick={() => copyText(String(v))} className="text-gray-600 hover:text-[var(--nile-teal)] transition-colors p-0.5">
                        {copiedText === v ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ DATABASE TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'db' && (
          <motion.div key="db" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.18 }} className="space-y-5">
            <div className="bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
              <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-[var(--nile-teal)]" />
                  <h3 className="font-black text-white text-base">إحصائيات الجداول (RLS)</h3>
                </div>
                <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2.5 py-1 rounded-lg">حجم تقديري: {dbSize}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] text-gray-500 font-bold">
                      <th className="py-3 px-5">الجدول</th>
                      <th className="py-3 px-5">السجلات</th>
                      <th className="py-3 px-5">حالة RLS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableStats.map(s => (
                      <tr key={s.table} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-[var(--nile-teal)] text-xs">{s.table}</td>
                        <td className="py-3.5 px-5 text-white font-bold font-sans">
                          {s.rows === -1 ? <span className="text-rose-400 text-xs">DENIED</span> : s.rows.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5"><StatusBadge status={s.rows >= 0 ? 'ok' : 'error'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ LOGS TAB ══════════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.18 }}>
            <div className="bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
              <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-[var(--nile-teal)] animate-pulse" />
                  <h3 className="font-black text-white text-base">سجل العمليات — AI Agent</h3>
                </div>
                <span className="text-[10px] text-gray-500 bg-white/5 px-2.5 py-1 rounded-lg font-bold">{agentLogs.length} سجل</span>
              </div>
              {agentLogs.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">لا توجد عمليات مسجلة بعد.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {agentLogs.map(log => (
                    <div key={log.id} className="hover:bg-white/3 transition-all">
                      <button onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              className="w-full text-right p-4 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <StatusBadge status={log.status} />
                          <code className="text-xs text-[var(--nile-teal)] font-mono font-bold truncate">{log.action}</code>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-gray-500 font-mono">{new Date(log.created_at).toLocaleTimeString('ar-EG')}</span>
                          {expandedLog === log.id ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </div>
                      </button>
                      {expandedLog === log.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    className="px-4 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden">
                          {[{ label: 'الحالة السابقة', val: log.input, cls: 'text-rose-300' },
                            { label: 'الحالة الجديدة',  val: log.output, cls: 'text-emerald-300' }].map(({ label, val, cls }) => (
                            <div key={label} className="space-y-1.5">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">{label}</span>
                              <pre className={`bg-black/70 border border-white/5 rounded-xl p-3.5 font-mono text-[10.5px] ${cls} overflow-auto max-h-40 select-all leading-relaxed`}>
                                {val ?? '// لا توجد بيانات'}
                              </pre>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ SYSTEM CHECKS TAB ═════════════════════════════════════════════════ */}
        {activeTab === 'system' && (
          <motion.div key="system" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.18 }} className="space-y-5">
            <div className="bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
              <div className="p-4 sm:p-5 border-b border-white/5 flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-[var(--nile-teal)]" />
                <h3 className="font-black text-white text-base">نتائج فحص الاتصال والأمان</h3>
              </div>
              {systemChecks.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-sm">اضغط «تحديث الأنظمة» لتشغيل الفحوصات.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {systemChecks.map(c => (
                    <div key={c.label} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={c.status} />
                        <div>
                          <span className="font-bold text-sm text-white block">{c.label}</span>
                          <span className="text-[10px] text-gray-500 font-bold">[{c.category}]</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 select-all">{c.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Known issues */}
            <div className="p-5 sm:p-6 bg-slate-900/30 border border-white/5 rounded-3xl backdrop-blur-md space-y-4">
              <h3 className="font-black text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-amber-400" /> المشكلات الشائعة والحلول
              </h3>
              {[
                { ok: false, title: 'pharmacy_id فارغ لـ chain_admin', detail: 'متوقع — LayoutWrapper يجب أن يستثني chain_admin من الرفض.' },
                { ok: false, title: 'استخدام .single() بدل .maybeSingle()', detail: 'قد يطلق PGRST116 — استخدم maybeSingle() دائماً.' },
                { ok: true,  title: 'وضع الطوارئ المحلي', detail: 'POS يعمل بدون إنترنت ويزامن عند الإتاحة.' },
              ].map((item, i) => (
                <div key={i} className={`flex gap-3 p-4 rounded-2xl border ${item.ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                  {item.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold text-sm text-white">{item.title}</p>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Env variables */}
            <div className="p-5 sm:p-6 bg-slate-900/30 border border-white/5 rounded-3xl backdrop-blur-md space-y-3">
              <h3 className="font-black text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-[var(--nile-teal)]" /> متغيرات البيئة
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'NEXT_PUBLIC_SUPABASE_URL',      status: !!process.env.NEXT_PUBLIC_SUPABASE_URL         },
                  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', status: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY    },
                  { key: 'SUPABASE_SERVICE_ROLE_KEY',     status: false, note: 'server-only'                    },
                  { key: 'GEMINI_API_KEY',                status: false, note: 'server-only'                    },
                ].map(({ key, status, note }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-950/20 border border-white/5 rounded-xl">
                    <code className="text-[11px] text-[var(--nile-teal)] select-all truncate mr-2">{key}</code>
                    <div className="flex items-center gap-2 shrink-0">
                      {note && <span className="text-[9px] text-gray-500">{note}</span>}
                      <StatusBadge status={status ? 'ok' : 'warn'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ TERMINAL TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'terminal' && (
          <motion.div key="terminal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.18 }}>
            <div className="bg-black/90 border border-[var(--nile-teal)]/25 rounded-3xl overflow-hidden
                            shadow-[0_12px_40px_rgba(20,184,166,0.12)] flex flex-col h-[480px] sm:h-[540px]">
              {/* Traffic lights header */}
              <div className="bg-slate-950 px-4 py-3 border-b border-[var(--nile-teal)]/15 flex items-center justify-between select-none shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-gray-500 font-sans ms-3">nile-developer-shell.bash</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-sans font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  ONLINE
                  <button
                    onClick={() => { setTerminalHistory([]); localStorage.removeItem(TERMINAL_LS_KEY); }}
                    className="ms-3 text-gray-600 hover:text-rose-400 transition-colors font-bold"
                    title="مسح السجل"
                  >CLR</button>
                </div>
              </div>

              {/* Output buffer */}
              <div
                className="flex-1 p-4 sm:p-5 overflow-y-auto text-left text-[11px] space-y-px leading-6 font-mono cursor-text"
                onClick={() => inputRef.current?.focus()}
              >
                {terminalHistory.map((line, i) => {
                  let cls = 'text-gray-300';
                  if (line.startsWith('[') && line.includes('$')) cls = 'text-emerald-400 font-bold';
                  else if (line.includes('ERROR') || line.includes('REJECTED') || line.includes('DENIED')) cls = 'text-rose-400';
                  else if (line.includes('WARNING') || line.startsWith('┌') || line.startsWith('│') || line.startsWith('└')) cls = 'text-amber-300';
                  else if (line.startsWith('══') || line.startsWith('─')) cls = 'text-[var(--nile-teal)]';
                  return <div key={i} className={`${cls} whitespace-pre-wrap select-text`}>{line || '\u00A0'}</div>;
                })}
                <div ref={terminalEndRef} />
              </div>

              {/* Input row */}
              <form onSubmit={handleCommandSubmit}
                    className="bg-slate-950 px-4 py-3 border-t border-[var(--nile-teal)]/15 flex items-center gap-2 shrink-0">
                <span className="text-emerald-400 font-bold font-mono text-xs select-none shrink-0">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  placeholder='→ اكتب أمراً (help للتعرف على الأوامر)...'
                  dir="ltr"
                  className="flex-1 bg-transparent text-emerald-300 text-xs font-mono border-none outline-none
                             focus:ring-0 p-0 text-left placeholder:text-gray-700 placeholder:italic
                             focus:border-none focus:shadow-none focus:box-shadow-none"
                  autoFocus
                />
              </form>
            </div>
            <p className="text-center text-[10px] text-gray-600 mt-2 font-sans">
              ↑ ↓ للتنقل في سجل الأوامر · Enter للتنفيذ · اكتب "clear" لمسح الشاشة
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
