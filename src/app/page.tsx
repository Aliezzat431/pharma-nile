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
  ArrowRightLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getDashboardStats, getRecentTransactions, DashboardStats, RecentTransaction } from '@/lib/api/dashboard';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import Skeleton from '@/components/ui/Skeleton';
import GlassTable from '@/components/ui/GlassTable';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTrans, setRecentTrans] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        getDashboardStats(),
        getRecentTransactions()
      ]);
      setStats(s);
      setRecentTrans(t);
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
    { label: "مبيعات اليوم", value: stats?.todaySales || '0 ج.م', icon: TrendingUp, color: 'text-[#00CED1]', glow: 'bg-[#00CED1]/10' },
    { label: "صافي الأرباح", value: stats?.todayProfit ? <span dir="ltr">{stats.todayProfit} ج.م</span> : '0 ج.م', icon: DollarSign, color: 'text-[#D4AF37]', glow: 'bg-[#D4AF37]/10' },
    { label: "نواقص المخزون", value: stats?.lowStockItems || '0', icon: AlertCircle, color: 'text-red-400', glow: 'bg-red-500/10' },
    { label: "صلاحيات قريبة", value: stats?.expiringSoon || '0', icon: History, color: 'text-orange-400', glow: 'bg-orange-500/10' },
  ];

  const quickActions = [
    { label: 'يلا نبيع (POS)', icon: ShoppingBag, href: '/pos', color: 'bg-gradient-to-br from-[#00CED1] to-[#00CED1]/70' },
    { label: 'إضافة صنف', icon: PlusCircle, href: '/products', color: 'bg-white/5 border-white/10' },
    { label: 'استلام بضاعة', icon: Boxes, href: '/inventory', color: 'bg-white/5 border-white/10' },
    { label: 'عميل جديد', icon: UserPlus, href: '/customers', color: 'bg-white/5 border-white/10' },
  ];

  return (
    <div className="w-full max-w-full mx-auto space-y-10">
      {/* Hero Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-bold font-cairo tracking-tight"
          >
            نورت صيدليتك، <span className="nile-gradient-text">{user?.user_metadata?.full_name?.split(' ')[0] } </span>👋
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
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Content = (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex items-start gap-5 relative overflow-hidden group border-white/5 cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-2xl ${stat.glow} flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-xl`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1 font-cairo">{stat.label}</h3>
                <div className="text-2xl font-bold font-inter tracking-tight">
                  {loading ? <Skeleton className="h-8 w-24" /> : stat.value}
                </div>
              </div>
              
              {/* Visual background element */}
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[40px] opacity-20 ${stat.glow}`} />
            </motion.div>
          );

          if (stat.label === "نواقص المخزون") {
            return <Link key={stat.label} href="/shortages">{Content}</Link>;
          }
          return Content;
        })}
      </div>

      {/* Quick Actions & Productivity */}
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
                transition={{ delay: 0.4 + i * 0.05 }}
                className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.02] border ${action.color} group shadow-lg`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.href === '/pos' ? 'bg-white/20' : 'bg-[#00CED1]/10'} group-hover:rotate-6 transition-transform`}>
                  <action.icon className={`w-5 h-5 ${action.href === '/pos' ? 'text-white' : 'text-[#00CED1]'}`} />
                </div>
                <span className={`font-cairo font-bold text-sm ${action.href === '/pos' ? 'text-white' : 'text-gray-300'}`}>{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 glass-panel p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-cairo">أداء المبيعات الأسبوعي</h2>
              <p className="text-gray-500 text-sm font-cairo">مقارنة السيولة بالديون</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase"><div className="w-2 h-2 rounded-full bg-[#00CED1]" /> كاش</div>
               <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase"><div className="w-2 h-1 bg-[#D4AF37] rounded-full" /> آجل</div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.weeklyData || []}>
                  <defs>
                    <linearGradient id="chartTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00CED1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00CED1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#666', fontSize: 11, fontFamily: 'Cairo'}} 
                    dy={12}
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#666', fontSize: 12}} 
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontFamily: 'Cairo'}}
                    cursor={{ stroke: '#00CED1', strokeWidth: 1, strokeDasharray: '4 4'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    name="المبيعات"
                    stroke="#00CED1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#chartTeal)" 
                    animationDuration={2000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="debts" 
                    name="الديون"
                    stroke="#D4AF37" 
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    fill="transparent" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Transactions Feed */}
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

