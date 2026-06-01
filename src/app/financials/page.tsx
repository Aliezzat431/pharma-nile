'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, PieChart as PieChartIcon, 
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart, 
  Calendar, Download, Loader2, Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getFinancialStats, FinancialStats } from '@/lib/api/financials';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart as ReBarChart, Bar, Cell, 
  PieChart, Pie
} from 'recharts';

const COLORS = ['#00CED1', '#D4AF37', '#FF4E4E'];

export default function FinancialsPage() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    fetchStats();
  }, [range]);

  const fetchStats = async () => {
    setLoading(true);
    const data = await getFinancialStats(range);
    setStats(data);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            التقارير <span className="nile-gradient-text">المالية</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-cairo">تحليل الأرباح، المبيعات والتدفقات النقدية.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="glass-panel px-4 py-2 text-sm bg-transparent outline-none font-cairo"
          >
            <option value={7} className="bg-[#050505]">آخر 7 أيام</option>
            <option value={30} className="bg-[#050505]">آخر 30 يوم</option>
            <option value={90} className="bg-[#050505]">آخر 3 أشهر</option>
          </select>
          <button className="nile-button flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="font-cairo">تصدير PDF</span>
          </button>
        </div>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي المبيعات', value: stats?.totalSales, icon: Wallet, color: '#00CED1' },
          { label: 'إجمالي الأرباح', value: stats?.totalProfit, icon: TrendingUp, color: '#D4AF37' },
          { label: 'إجمالي التكاليف', value: stats?.totalCost, icon: ArrowDownRight, color: '#FF4E4E' },
          { label: 'متوسط الفاتورة', value: stats && stats.totalTransactions ? (stats.totalSales / stats.totalTransactions).toFixed(1) : 0, icon: BarChart, color: '#94a3b8' }
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
               <p className="text-gray-400 font-cairo text-sm">{item.label}</p>
               <item.icon className="w-5 h-5 opacity-40 group-hover:scale-110 transition-transform" style={{ color: item.color }} />
            </div>
            <p className="text-3xl font-bold font-sans">
              {loading ? '...' : Number(item.value).toLocaleString()} <span className="text-xs font-normal text-gray-500">ج.م</span>
            </p>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity" style={{ backgroundColor: item.color }} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 glass-panel p-8 h-[450px]">
           <h2 className="text-xl font-bold font-cairo mb-8">منحنى المبيعات والأرباح</h2>
           <div className="w-full h-full pb-10">
              {loading ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-[#00CED1]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.dailyRevenue}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00CED1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#00CED1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                    <XAxis dataKey="date" stroke="#444" tick={{fontSize: 10, fontFamily: 'Cairo'}} />
                    <YAxis stroke="#444" tick={{fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#050505', border: '1px solid #ffffff10', borderRadius: '12px', fontFamily: 'Cairo'}}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#00CED1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                    <Area type="monotone" dataKey="profit" stroke="#D4AF37" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
           </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="glass-panel p-8 flex flex-col justify-between">
           <h2 className="text-xl font-bold font-cairo mb-8">طرق الدفع</h2>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={stats?.paymentMethodDistribution}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats?.paymentMethodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="space-y-4">
              {stats?.paymentMethodDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between font-cairo">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-gray-400 text-sm">{item.name === 'Cash' ? 'نقدي' : item.name === 'Debt' ? 'آجل' : 'صدقات'}</span>
                   </div>
                   <span className="font-bold text-sm">{item.value.toLocaleString()} ج.م</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
