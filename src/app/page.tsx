'use client';

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertCircle, RefreshCw, ShoppingBag, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDashboardStats, getRecentTransactions, DashboardStats, RecentTransaction } from '@/lib/api/dashboard';
import { useAuth } from '@/hooks/useAuth';

import { supabase } from '@/lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';



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

    // Enable Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchDashboardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'batches' },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { label: "مبيعات اليوم", value: stats?.todaySales || '0 ج.م', icon: TrendingUp, color: 'text-[#00CED1]' },
    { label: "صافي أرباح اليوم", value: stats?.todayProfit ? `${stats.todayProfit} ج.م` : '0 ج.م', icon: DollarSign, color: 'text-[#D4AF37]' },
    { label: "نواقص المخزون", value: stats?.lowStockItems || '0', icon: AlertCircle, color: 'text-red-400' },
    { label: "أدوية قريبة الانتهاء", value: stats?.expiringSoon || '0', icon: RefreshCw, color: 'text-orange-400' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            أهلاً بك يا دكتور، <span className="nile-gradient-text">{user?.user_metadata?.full_name || 'أحمد'}</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-cairo">إليك نظرة سريعة على أداء صيدليتك اليوم.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="glass-card px-5 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors group"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#00CED1] animate-pulse"></div>
          <span className="text-sm font-medium tracking-wide font-cairo">النظام يعمل</span>
          <RefreshCw className={`w-4 h-4 text-gray-500 group-hover:rotate-180 transition-transform ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex flex-col justify-between h-40 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start z-10 font-cairo">
              <h3 className="text-gray-400 font-medium">{stat.label}</h3>
              <stat.icon className={`w-6 h-6 ${stat.color} opacity-80 group-hover:scale-110 transition-transform`} />
            </div>
            <div className="z-10">
              <p className="text-4xl font-bold">{loading ? '...' : stat.value}</p>
            </div>
            
            {/* Ambient Background Glow in card */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-[#00CED1]/10 transition-colors"></div>
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Info Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-panel p-8 h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold font-cairo">أداء المبيعات (أيام الأسبوع)</h2>
            <div className="flex gap-2">
               <span className="flex items-center gap-2 text-xs text-[#00CED1]"><div className="w-2 h-2 rounded-full bg-[#00CED1]" /> المبيعات</span>
               <span className="flex items-center gap-2 text-xs text-[#D4AF37]"><div className="w-2 h-2 rounded-full bg-[#D4AF37]" /> الديون</span>
            </div>
          </div>
          
          <div className="w-full h-full pb-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weeklyData || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00CED1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00CED1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis dataKey="name" stroke="#666" tick={{fontFamily: 'Cairo'}} />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{backgroundColor: '#050505', border: '1px solid #ffffff10', borderRadius: '12px', fontFamily: 'Cairo'}} />
                <Area type="monotone" dataKey="sales" stroke="#00CED1" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                <Area type="monotone" dataKey="debts" stroke="#D4AF37" fillOpacity={0} fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 flex flex-col items-center">
           <h2 className="text-xl font-bold font-cairo mb-8 self-start">توزيع الديون</h2>
           <div className="w-full h-64">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={[
                     { name: 'كاش', value: stats?.weeklyData?.[stats.weeklyData.length - 1]?.sales || 1 },
                     { name: 'ديون', value: stats?.weeklyData?.[stats.weeklyData.length - 1]?.debts || 0 }
                   ]}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   <Cell fill="#00CED1" />
                   <Cell fill="#ffffff10" />
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 space-y-4 w-full">
              <div className="flex justify-between items-center text-sm font-cairo">
                <span className="text-gray-400">سيولة اليوم</span>
                <span className="text-[#00CED1] font-bold">
                  {stats?.weeklyData?.[stats.weeklyData.length - 1] 
                    ? Math.round((stats.weeklyData[stats.weeklyData.length - 1].sales / (stats.weeklyData[stats.weeklyData.length - 1].sales + stats.weeklyData[stats.weeklyData.length - 1].debts || 1)) * 100) 
                    : 100}%
                </span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00CED1]" style={{ width: `${stats?.weeklyData?.[stats.weeklyData.length - 1] ? (stats.weeklyData[stats.weeklyData.length - 1].sales / (stats.weeklyData[stats.weeklyData.length - 1].sales + stats.weeklyData[stats.weeklyData.length - 1].debts || 1)) * 100 : 100}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 font-cairo leading-relaxed">
                * يرجى متابعة تحصيل الديون المتأخرة لتحسين التدفق النقدي.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
