'use client';

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDashboardStats, getRecentTransactions, DashboardStats, RecentTransaction } from '@/lib/api/dashboard';
import { useAuth } from '@/hooks/useAuth';
import ShiftControl from '@/components/shared/ShiftControl';

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
  }, []);

  const statCards = [
    { label: "مبيعات اليوم", value: stats?.todaySales || '0 ج.م', icon: TrendingUp, color: 'text-[#00CED1]' },
    { label: "الجلسات النشطة", value: stats?.activeSessions || '0 موظفين', icon: Activity, color: 'text-[#D4AF37]' },
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
      
      <ShiftControl />

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-cairo">العمليات الأخيرة</h2>
            <button className="text-sm text-[#00CED1] hover:underline font-cairo">عرض الكل</button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <div className="h-full flex items-center justify-center opacity-30">
                <RefreshCw className="animate-spin w-8 h-8" />
              </div>
            ) : recentTrans.length > 0 ? (
              recentTrans.map((tx, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={tx.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#00CED1]/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#00CED1]/10 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-[#00CED1]" />
                    </div>
                    <div>
                      <p className="font-bold text-white font-cairo">فاتورة #{tx.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString('ar-EG')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#D4AF37] font-cairo">{tx.total} ج.م</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-white/5 rounded-xl bg-white/[0.02] opacity-50">
                <p className="text-gray-500 font-cairo">لا توجد عمليات بيع اليوم.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 h-96 flex flex-col">
          <h2 className="text-xl font-bold mb-6 font-cairo">توصيات الذكاء الاصطناعي</h2>
          <div className="flex-1 space-y-4">
             <div className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex gap-3">
                <AlertCircle className="text-[#D4AF37] w-5 h-5 shrink-0" />
                <p className="text-sm text-gray-200 font-cairo">توصية: اطلب كمية جديدة من <strong>بنادول إكسترا</strong> قبل عطلة نهاية الأسبوع.</p>
             </div>
             <div className="p-4 rounded-xl bg-[#00CED1]/10 border border-[#00CED1]/20 flex gap-3">
                <TrendingUp className="text-[#00CED1] w-5 h-5 shrink-0" />
                <p className="text-sm text-gray-200 font-cairo">مبيعات مستحضرات التجميل زادت بنسبة 15% هذا الأسبوع. ممكن تعمل عرض عليها.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
