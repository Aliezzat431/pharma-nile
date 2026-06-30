'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw, 
  ShoppingBag, 
  DollarSign, 
  PlusCircle, 
  Boxes, 
  History, 
  UserPlus,
  ArrowRightLeft,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardStats, getRecentTransactions, DashboardStats, RecentTransaction } from '@/lib/api/dashboard';
import { getCurrentMonthSummary } from '@/lib/api/financials';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import Skeleton from '@/components/ui/Skeleton';
import GlassTable from '@/components/ui/GlassTable';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color?: string;
    name?: string;
    value?: any;
  }>;
  label?: any;
}

const ArabicTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass-card p-3 text-right min-w-[140px]" dir="rtl">
      <p className="text-xs font-bold text-gray-400 font-cairo mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-xs font-cairo">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-white">{Number(p.value).toLocaleString('ar-EG')} ج.م</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrans, setRecentTrans] = useState<RecentTransaction[]>([]);
  const [monthSummary, setMonthSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [s, t, ms] = await Promise.all([
        getDashboardStats(),
        getRecentTransactions(),
        getCurrentMonthSummary(),
      ]);
      setStats(s);
      setRecentTrans(t);
      setMonthSummary(ms);
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { label: "مبيعات اليوم", value: stats?.todaySales || 'ج.م 0', icon: TrendingUp, color: 'text-[#00CED1]', glow: 'bg-[#00CED1]/10' },
    { label: "صافي الأرباح", value: stats?.todayProfit || 'ج.م 0', icon: DollarSign, color: 'text-[#D4AF37]', glow: 'bg-[#D4AF37]/10' },
    { label: "نواقص المخزون", value: stats?.lowStockItems || '0', icon: AlertCircle, color: 'text-red-400', glow: 'bg-red-500/10' },
    { label: "صلاحيات قريبة", value: stats?.expiringSoon || '0', icon: History, color: 'text-orange-400', glow: 'bg-orange-500/10' },
  ];

  const quickActions = [
    { label: 'يلا نبيع (POS)', icon: ShoppingBag, href: '/pos', color: 'bg-gradient-to-br from-[#00CED1] to-[#00CED1]/70' },
    { label: 'استيراد فاتورة AI', icon: Sparkles, href: '/invoices/import', color: 'bg-gradient-to-br from-[#D4AF37]/80 to-[#D4AF37]/40' },
    { label: 'استلام بضاعة', icon: Boxes, href: '/inventory', color: 'bg-white/5 border-white/10' },
    { label: 'عميل جديد', icon: UserPlus, href: '/customers', color: 'bg-white/5 border-white/10' },
  ];

  const weeklyData = stats?.weeklyData || [];

  return (
    <div className="w-full max-w-full mx-auto space-y-10">
      {}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-bold font-cairo tracking-tight"
          >
            نورت صيدليتك، <span className="nile-gradient-text">{user?.user_metadata?.full_name?.split(' ')[0]} </span>👋
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-lg font-cairo font-medium"
          >
            أداء المبيعات جيد اليوم، إليك الأرقام الحالية:
          </motion.p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardData}
            className="glass-card px-6 py-2.5 flex items-center gap-3 hover:bg-white/5 active:scale-95 transition-all text-sm font-bold font-cairo"
          >
            <RefreshCw className={`w-4 h-4 text-[#00CED1] ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </header>
      
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Content = (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
              className="glass-card p-6 flex items-start gap-5 relative overflow-hidden group border border-white/10 hover:border-[var(--nile-teal)]/30 cursor-pointer hover:shadow-[0_20px_40px_-15px_var(--nile-teal-glow)] z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className={`w-14 h-14 rounded-2xl ${stat.glow} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-xl relative z-10`}>
                <stat.icon className={`w-7 h-7 ${stat.color} drop-shadow-[0_0_8px_currentColor]`} />
              </div>
              <div className="flex-1 relative z-10">
                <h3 className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1 font-cairo transition-colors group-hover:text-[var(--text-primary)]">{stat.label}</h3>
                <div className="text-3xl font-black font-inter tracking-tight nile-gradient-text">
                  {loading ? <Skeleton className="h-8 w-24" /> : stat.value}
                </div>
              </div>
              <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-20 ${stat.glow} transition-all duration-700 group-hover:opacity-50 group-hover:scale-150`} />
            </motion.div>
          );

          if (stat.label === "نواقص المخزون") {
            return <Link key={stat.label} href="/shortages">{Content}</Link>;
          }
          return Content;
        })}
      </div>

      {}
      {(monthSummary || loading) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="font-bold font-cairo text-base">ملخص الشهر الحالي</h2>
            </div>
            <Link href="/financials" className="text-[10px] font-bold text-[#00CED1] uppercase hover:underline font-cairo">
              تقرير مفصل
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : monthSummary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'إجمالي المبيعات', value: monthSummary.total_revenue, color: '#00CED1' },
                { label: 'صافي الربح',       value: monthSummary.total_profit,  color: '#D4AF37' },
                { label: 'إجمالي الطلبات',   value: monthSummary.total_orders,  color: '#a78bfa', isCount: true },
                { label: 'مبيعات نقدية',      value: monthSummary.cash_revenue,  color: '#10b981' },
              ].map(m => (
                <div key={m.label} className="glass-card p-4">
                  <p className="text-gray-500 font-cairo text-xs mb-1">{m.label}</p>
                  <p className="font-bold text-lg font-cairo" style={{ color: m.color }}>
                    {m.isCount
                      ? Number(m.value).toLocaleString('ar-EG')
                      : `${Number(m.value).toLocaleString('ar-EG')} ج.م`}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>
      )}

      {}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-cairo flex items-center gap-3">
           <Activity className="w-5 h-5 text-[#00CED1]" />
           عمليات سريعة
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link key={action.label} href={action.href}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 0.4 + i * 0.05, type: "spring", stiffness: 400, damping: 17 }}
                className={`p-4 rounded-2xl flex items-center justify-center gap-4 cursor-pointer transition-all border ${action.color} group shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.href === '/pos' || action.href === '/invoices/import' ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/5'} transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-inner`}>
                  <action.icon className={`w-6 h-6 ${action.href === '/pos' || action.href === '/invoices/import' ? 'text-white' : 'text-[var(--nile-teal)]'}`} />
                </div>
                <span className={`font-cairo font-black text-base tracking-wide z-10 ${action.href === '/pos' || action.href === '/invoices/import' ? 'text-white' : 'text-gray-200'}`}>{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 glass-panel p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-cairo">أداء المبيعات الأسبوعي</h2>
              <p className="text-gray-500 text-sm font-cairo">مقارنة السيولة بالديون — آخر 7 أيام</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase"><div className="w-2 h-2 rounded-full bg-[#00CED1]" /> كاش</div>
               <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase"><div className="w-2 h-1 bg-[#D4AF37] rounded-full" /> آجل</div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : weeklyData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                <Activity className="w-8 h-8 opacity-40" />
                <p className="text-sm font-cairo opacity-50">لا توجد مبيعات في هذا الأسبوع بعد</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="chartTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00CED1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#00CED1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="chartGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#666', fontSize: 11, fontFamily: 'Cairo' }} 
                    dy={12}
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#666', fontSize: 11 }}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                    width={40}
                  />
                  <Tooltip content={<ArabicTooltip />} cursor={{ stroke: '#00CED1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    name="المبيعات"
                    stroke="#00CED1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#chartTeal)" 
                    animationDuration={1500}
                    dot={{ fill: '#00CED1', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#00CED1', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="debts" 
                    name="الديون"
                    stroke="#D4AF37" 
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    fillOpacity={1}
                    fill="url(#chartGold)"
                    dot={{ fill: '#D4AF37', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#D4AF37', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {}
        <div className="glass-panel p-6 flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-cairo">آخر العمليات</h2>
            <Link href="/orders" className="text-[10px] font-bold text-[#00CED1] uppercase hover:underline">عرض الكل</Link>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
             {loading ? (
               <Skeleton count={5} className="h-16 w-full mb-3" />
             ) : recentTrans.length > 0 ? (
               recentTrans.map((tx, idx) => (
                 <div key={idx} className="flex items-center gap-4 p-3 pb-6 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.total > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                     <ArrowRightLeft className="w-5 h-5" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <p className="text-sm font-bold text-white truncate font-cairo">عملية بيع #{tx.id.slice(-4)}</p>
                     <p className="text-[10px] text-gray-500 font-bold">{new Date(tx.created_at).toLocaleTimeString('ar-EG')}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-bold text-[#00CED1]">{tx.total} ج.م</p>
                     <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{tx.payment_method}</p>
                   </div>
                 </div>
               ))
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-10">
                 <History className="w-12 h-12 mb-3" />
                 <p className="text-sm font-cairo">لا توجد مبيعات مؤخراً</p>
               </div>
             )}
          </div>
          
          <div className="pt-4 border-t border-white/5">
             <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 font-cairo leading-relaxed bg-[#00CED1]/5 p-3 rounded-xl border border-[#00CED1]/10">
               <span className="text-[#00CED1]">تنبيه:</span>
               <span>تابع تحصيل الديون المتأخرة لتحسين السيولة.</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

