'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, BarChart, CalendarDays, Loader2, Wallet, ArrowDownRight, Printer, FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageGSAP } from '@/hooks/usePageGSAP';
import { useAuth } from '@/hooks/useAuth';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as ReBarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';


const COLORS = ['#00CED1', '#D4AF37', '#FF4E4E'];

const ARABIC_MONTHS: Record<string, string> = {
  'January':   'يناير', 'February':  'فبراير', 'March':     'مارس',
  'April':     'أبريل', 'May':       'مايو',   'June':      'يونيو',
  'July':      'يوليو', 'August':    'أغسطس',  'September': 'سبتمبر',
  'October':   'أكتوبر','November':  'نوفمبر', 'December':  'ديسمبر',
};

const tl = (v?: number | string | null) => {
  const num = Number(v);
  return isNaN(num) ? '٠' : num.toLocaleString('ar-EG');
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-right min-w-[160px] bg-black/90 backdrop-blur-md border border-white/10 rounded-xl" dir="rtl">
      <p className="text-xs font-bold text-gray-400 font-cairo mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-xs font-cairo my-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-white">{Number(p.value || 0).toLocaleString('ar-EG')} ج.م</span>
        </div>
      ))}
    </div>
  );
};

interface Order {
  id: string;
  created_at: string;
  total: number;
  profit_total: number;
  cost_total: number;
  payment_method: string;
  status?: string; 
}

export default function FinancialsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  const pageRef = usePageGSAP();
  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  useEffect(() => {
    if (pharmacyId) fetchFinancialData();
  }, [range, pharmacyId]);

  const fetchFinancialData = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select("id, created_at, total, profit_total, cost_total, payment_method")
        .eq('status', 'completed')
        .eq('pharmacy_id', pharmacyId);

      const now = new Date();
      
      if (activeTab === 'daily') {
         const fromDate = new Date();
         fromDate.setDate(now.getDate() - range);
         query = query.gte('created_at', fromDate.toISOString());
      }
      
      query = query.order('created_at', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalProfit = orders.reduce((sum, o) => sum + Number(o.profit_total || 0), 0);
    const totalCost = orders.reduce((sum, o) => sum + Number(o.cost_total || 0), 0);
    
    const paymentDist: Record<string, number> = {};
    orders.forEach(o => {
      paymentDist[o.payment_method] = (paymentDist[o.payment_method] || 0) + Number(o.total);
    });

    return { totalSales, totalProfit, totalCost, paymentDist };
  }, [orders]);

  const dailyChartData = useMemo(() => {
    const grouped: Record<string, any> = {};
    const now = new Date();
    for(let i = range - 1; i >= 0; i--) {
       const d = new Date(now);
       d.setDate(d.getDate() - i);
       const dateStr = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
       grouped[dateStr] = { date: dateStr, revenue: 0, profit: 0 };
    }
    orders.forEach(o => {
      const dateStr = new Date(o.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      if (grouped[dateStr]) {
        grouped[dateStr].revenue += Number(o.total);
        grouped[dateStr].profit += Number(o.profit_total || 0);
      }
    });
    return Object.values(grouped);
  }, [orders, range]);

  const monthlyChartData = useMemo(() => {
    
    
    const grouped: Record<string, any> = {};
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const monthName = ARABIC_MONTHS[d.toLocaleString('en-US', { month: 'long' })];
      
      if (!grouped[key]) grouped[key] = { name: monthName, revenue: 0, profit: 0, year: d.getFullYear() };
      grouped[key].revenue += Number(o.total);
      grouped[key].profit += Number(o.profit_total || 0);
    });
    return Object.values(grouped).sort((a, b) => a.year - b.year);
  }, [orders]);

  const handleExportCSV = () => {
    const headers = ["التاريخ", "الإجمالي", "الربح", "التكلفة", "طريقة الدفع"];
    const rows = orders.map(o => [
      new Date(o.created_at).toLocaleDateString('ar-EG'),
      o.total, o.profit_total, o.cost_total, o.payment_method
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div ref={pageRef} className="px-4 md:px-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl font-black flex items-center gap-4 font-cairo tracking-tight">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-[var(--nile-teal)] flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] relative">
              <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md" />
              <TrendingUp className="text-black w-6 h-6 z-10" />
            </motion.div>
            <span className="nile-gradient-text">التقارير المالية</span>
          </motion.h1>
        </div>
        
        <div className="flex gap-3 flex-wrap">
           <div className="flex gap-2">
              <button onClick={() => window.print()} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"><Printer className="w-5 h-5" /></button>
              <button onClick={handleExportCSV} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#00CED1] transition-all border border-white/10"><FileSpreadsheet className="w-5 h-5" /></button>
           </div>

          <div className="glass-card p-1 flex gap-1 bg-white/5 rounded-xl border border-white/10">
            <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-xl text-sm font-cairo font-bold transition-all ${activeTab === 'daily' ? 'bg-[var(--nile-teal)]/25 text-[color:var(--nile-teal)]' : 'text-gray-400 hover:text-white'}`}>يومي</button>
            <button onClick={() => setActiveTab('monthly')} className={`px-4 py-2 rounded-xl text-sm font-cairo font-bold transition-all ${activeTab === 'monthly' ? 'bg-[var(--royal-gold)]/25 text-[color:var(--royal-gold)]' : 'text-gray-400 hover:text-white'}`}>شهري</button>
          </div>

          {activeTab === 'daily' && (
            <select value={range} onChange={(e) => setRange(Number(e.target.value))} className="glass-panel px-4 py-2 text-sm bg-transparent outline-none font-cairo border border-white/10 rounded-xl">
              <option value={7} className="bg-[#050505]">آخر 7 أيام</option>
              <option value={30} className="bg-[#050505]">آخر 30 يوم</option>
              <option value={90} className="bg-[#050505]">آخر 3 أشهر</option>
            </select>
          )}
        </div>
      </header>

      {loading ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3 min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#00CED1]" />
          <p className="font-cairo">جاري تحليل البيانات المالية...</p>
        </div>
      ) : (
        <>
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'إجمالي المبيعات', value: stats.totalSales, icon: Wallet, color: '#00CED1' },
              { label: 'صافي الأرباح', value: stats.totalProfit, icon: TrendingUp, color: '#D4AF37' },
              { label: 'إجمالي التكاليف', value: stats.totalCost, icon: ArrowDownRight, color: '#FF4E4E' },
              { label: 'عدد العمليات', value: orders.length, icon: BarChart, color: '#94a3b8' }
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-panel p-6 relative overflow-hidden group border border-white/5 rounded-2xl bg-white/5">
                <div className="flex justify-between items-start mb-4">
                   <p className="text-gray-400 font-cairo text-sm">{item.label}</p>
                   <item.icon className="w-5 h-5 opacity-40 group-hover:scale-110 transition-transform" style={{ color: item.color }} />
                </div>
                <p className="text-3xl font-bold font-sans">{tl(item.value)} <span className="text-xs font-normal text-gray-500">{typeof item.value === 'number' && item.value > 100 ? 'ج.م' : ''}</span></p>
              </motion.div>
            ))}
          </div>

          {activeTab === 'daily' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel p-8 h-[450px] border border-white/5 rounded-2xl bg-white/5">
                 <h2 className="text-xl font-bold font-cairo mb-8">منحنى الدخل والأرباح</h2>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00CED1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#00CED1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                      <XAxis dataKey="date" stroke="#444" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                      <YAxis stroke="#444" tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="إيرادات" stroke="#00CED1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                      <Area type="monotone" dataKey="profit" name="أرباح" stroke="#D4AF37" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
              <div className="glass-panel p-8 flex flex-col justify-between border border-white/5 rounded-2xl bg-white/5">
                 <h2 className="text-xl font-bold font-cairo mb-6">توزيع طرق الدفع</h2>
                 <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={Object.entries(stats.paymentDist).map(([name, value], i) => ({ name, value }))} innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                            {Object.entries(stats.paymentDist).map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                          </Pie>
                          <Tooltip formatter={(v: any) => [`${Number(v || 0).toLocaleString('ar-EG')} ج.م`]} />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-4 mt-4">
                    {Object.entries(stats.paymentDist).map(([name, value], i) => (
                      <div key={name} className="flex items-center justify-between font-cairo">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                            <span className="text-gray-400 text-sm">{name === 'cash' ? 'نقدي' : name === 'debt' ? 'آجل' : name}</span>
                         </div>
                         <span className="font-bold text-sm">{tl(value)} ج.م</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 h-[420px] border border-white/5 rounded-2xl bg-white/5">
              <h2 className="text-xl font-bold font-cairo mb-6">الأداء الشهري</h2>
              <ResponsiveContainer width="100%" height="85%">
                <ReBarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Cairo', fill: '#666' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="revenue" name="الإيرادات" fill="#00CED1" radius={[4,4,0,0]} />
                  <Bar dataKey="profit" name="الأرباح" fill="#D4AF37" radius={[4,4,0,0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}