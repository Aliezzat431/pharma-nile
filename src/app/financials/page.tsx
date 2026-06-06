'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, PieChart as PieChartIcon, 
  ArrowDownRight, RefreshCw, BarChart, 
  Calendar, Download, Loader2, Wallet, CalendarDays,
  TrendingDown, Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getFinancialStats, getMonthlyReport, FinancialStats, MonthlyReport } from '@/lib/api/financials';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart as ReBarChart, Bar, Cell, 
  PieChart, Pie, TooltipProps, Legend
} from 'recharts';

const COLORS = ['#00CED1', '#D4AF37', '#FF4E4E'];

// Arabic month name mapping
const ARABIC_MONTHS: Record<string, string> = {
  'January':   'يناير',
  'February':  'فبراير',
  'March':     'مارس',
  'April':     'أبريل',
  'May':       'مايو',
  'June':      'يونيو',
  'July':      'يوليو',
  'August':    'أغسطس',
  'September': 'سبتمبر',
  'October':   'أكتوبر',
  'November':  'نوفمبر',
  'December':  'ديسمبر',
};

const tl = (v?: number) => Number(v || 0).toLocaleString('ar-EG');

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-right min-w-[160px]" dir="rtl">
      <p className="text-xs font-bold text-gray-400 font-cairo mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3 text-xs font-cairo">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-white">{Number(p.value).toLocaleString('ar-EG')} ج.م</span>
        </div>
      ))}
    </div>
  );
};

export default function FinancialsPage() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [range, setRange] = useState(30);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => { fetchStats(); }, [range]);

  useEffect(() => {
    fetchMonthly();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const data = await getFinancialStats(range);
    setStats(data);
    setLoading(false);
  };

  const fetchMonthly = async () => {
    setLoadingMonthly(true);
    const data = await getMonthlyReport(undefined, 12);
    setMonthlyData(data);
    setLoadingMonthly(false);
  };

  // Format monthly data for bar chart
  const monthlyChartData = [...monthlyData].reverse().map(m => ({
    name: ARABIC_MONTHS[m.month_name?.trim()?.split(' ')[0]] || m.month_name?.split(' ')[0] || `${m.month}/${m.year}`,
    revenue: m.total_revenue,
    profit:  m.total_profit,
    orders:  m.total_orders,
  }));

  const currentMonth = monthlyData[0];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            التقارير <span className="nile-gradient-text">المالية</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-cairo">تحليل الأرباح، المبيعات والتدفقات النقدية — محدّث لحظياً.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Tab switcher */}
          <div className="glass-card p-1 flex gap-1">
            <button onClick={() => setActiveTab('daily')}
                    className={`px-4 py-2 rounded-xl text-sm font-cairo transition-all ${activeTab === 'daily' ? 'bg-[#00CED1]/20 text-[#00CED1]' : 'text-gray-400 hover:text-white'}`}>
              يومي
            </button>
            <button onClick={() => setActiveTab('monthly')}
                    className={`px-4 py-2 rounded-xl text-sm font-cairo transition-all flex items-center gap-1.5 ${activeTab === 'monthly' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-gray-400 hover:text-white'}`}>
              <CalendarDays className="w-3.5 h-3.5" />
              شهري
            </button>
          </div>

          {activeTab === 'daily' && (
            <select 
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              className="glass-panel px-4 py-2 text-sm bg-transparent outline-none font-cairo"
            >
              <option value={7} className="bg-[#050505]">آخر 7 أيام</option>
              <option value={30} className="bg-[#050505]">آخر 30 يوم</option>
              <option value={90} className="bg-[#050505]">آخر 3 أشهر</option>
            </select>
          )}
        </div>
      </header>

      {/* ── CURRENT MONTH HERO ─────────────────────────────── */}
      {currentMonth && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-5" 
               style={{ background: 'radial-gradient(ellipse at top left, #00CED1, transparent 60%)' }} />
          <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
                <p className="text-xs text-gray-400 font-cairo">ملخص الشهر الحالي</p>
              </div>
              <h2 className="text-2xl font-bold font-cairo text-white">
                {ARABIC_MONTHS[currentMonth.month_name?.trim()?.split(' ')[0]] || currentMonth.month_name} {currentMonth.year}
              </h2>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'إجمالي المبيعات', value: currentMonth.total_revenue, color: '#00CED1', suffix: 'ج.م' },
                { label: 'صافي الربح',       value: currentMonth.total_profit,  color: '#D4AF37', suffix: 'ج.م' },
                { label: 'عدد الطلبات',       value: currentMonth.total_orders,  color: '#a78bfa', suffix: '' },
                { label: 'المرتجعات',          value: currentMonth.returns_total, color: '#f87171', suffix: 'ج.م' },
              ].map(m => (
                <div key={m.label} className="glass-card p-4">
                  <p className="text-gray-500 font-cairo text-xs mb-1">{m.label}</p>
                  <p className="font-bold text-xl font-cairo" style={{ color: m.color }}>
                    {tl(m.value)}{m.suffix && ` ${m.suffix}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment breakdown bar */}
          <div className="mt-5 relative z-10">
            <p className="text-xs text-gray-500 font-cairo mb-2">توزيع طرق الدفع هذا الشهر</p>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'نقدي',   value: currentMonth.cash_revenue,   color: '#00CED1' },
                { label: 'آجل',    value: currentMonth.debt_revenue,   color: '#D4AF37' },
                { label: 'صدقات', value: currentMonth.sadqah_revenue, color: '#f472b6' },
              ].map(p => {
                const pct = currentMonth.total_revenue > 0
                  ? ((p.value / currentMonth.total_revenue) * 100).toFixed(1)
                  : '0';
                return (
                  <div key={p.label} className="flex items-center gap-2 text-xs font-cairo">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-gray-400">{p.label}</span>
                    <span className="font-bold" style={{ color: p.color }}>{pct}%</span>
                    <span className="text-gray-600">({tl(p.value)} ج.م)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── DAILY TAB ──────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <>
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'إجمالي المبيعات', value: stats?.totalSales,       icon: Wallet,       color: '#00CED1' },
              { label: 'إجمالي الأرباح',  value: stats?.totalProfit,      icon: TrendingUp,   color: '#D4AF37' },
              { label: 'إجمالي التكاليف', value: stats?.totalCost,        icon: ArrowDownRight, color: '#FF4E4E' },
              { label: 'متوسط الفاتورة',   value: stats && stats.totalTransactions
                  ? (stats.totalSales / stats.totalTransactions)
                  : 0,                                                      icon: BarChart,     color: '#94a3b8' }
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
                  {loading ? '...' : Number(item.value || 0).toLocaleString()} <span className="text-xs font-normal text-gray-500">ج.م</span>
                </p>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity" style={{ backgroundColor: item.color }} />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Daily Revenue Chart */}
            <div className="lg:col-span-2 glass-panel p-8 h-[450px]">
               <h2 className="text-xl font-bold font-cairo mb-8">منحنى المبيعات والأرباح اليومي</h2>
               <div className="w-full h-full pb-10">
                  {loading ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-[#00CED1]" /></div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.dailyRevenue}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#00CED1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#00CED1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                        <XAxis dataKey="date" stroke="#444" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                        <YAxis stroke="#444" tick={{ fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" name="إيرادات" stroke="#00CED1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                        <Area type="monotone" dataKey="profit"  name="أرباح"   stroke="#D4AF37" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
               </div>
            </div>

            {/* Payment Methods Distribution */}
            <div className="glass-panel p-8 flex flex-col justify-between">
               <h2 className="text-xl font-bold font-cairo mb-8">طرق الدفع</h2>
               <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                          data={stats?.paymentMethodDistribution}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats?.paymentMethodDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v.toLocaleString('ar-EG')} ج.م`]} />
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
        </>
      )}

      {/* ── MONTHLY TAB ────────────────────────────────────── */}
      {activeTab === 'monthly' && (
        <>
          {/* Monthly Bar Chart */}
          <div className="glass-panel p-8 h-[420px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-cairo">الأداء الشهري — آخر 12 شهر</h2>
              <p className="text-xs text-gray-500 font-cairo">من جدول monthly_summaries (بيانات فورية)</p>
            </div>
            {loadingMonthly ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#D4AF37]" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="85%">
                <ReBarChart data={monthlyChartData} margin={{ top: 5, right: 5, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Cairo', fill: '#666' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false}
                         tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span className="font-cairo text-xs text-gray-400">{v}</span>} />
                  <Bar dataKey="revenue" name="الإيرادات" fill="#00CED1" fillOpacity={0.9} radius={[4,4,0,0]} />
                  <Bar dataKey="profit"  name="الأرباح"   fill="#D4AF37" fillOpacity={0.9} radius={[4,4,0,0]} />
                </ReBarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly table */}
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold font-cairo mb-6 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#D4AF37]" />
              ملخص شهري تفصيلي
            </h2>
            {loadingMonthly ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-[#D4AF37]" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right font-cairo text-sm">
                  <thead className="text-xs text-gray-500 bg-white/5">
                    <tr>
                      <th className="px-4 py-3 rounded-tr-xl">الشهر</th>
                      <th className="px-4 py-3">الإيرادات</th>
                      <th className="px-4 py-3">الأرباح</th>
                      <th className="px-4 py-3">التكاليف</th>
                      <th className="px-4 py-3">الطلبات</th>
                      <th className="px-4 py-3">نقدي</th>
                      <th className="px-4 py-3">آجل</th>
                      <th className="px-4 py-3 rounded-tl-xl">مرتجعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((m, i) => {
                      const monthLabel = ARABIC_MONTHS[m.month_name?.trim()?.split(' ')[0]] || m.month_name?.split(' ')[0];
                      const isCurrentMonth = i === 0;
                      return (
                        <motion.tr
                          key={`${m.year}-${m.month}`}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isCurrentMonth ? 'bg-[#00CED1]/5' : ''}`}
                        >
                          <td className="px-4 py-3 font-bold text-white">
                            {monthLabel} {m.year}
                            {isCurrentMonth && (
                              <span className="mr-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[#00CED1]/20 text-[#00CED1]">الحالي</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#00CED1] font-bold">{tl(m.total_revenue)} ج.م</td>
                          <td className="px-4 py-3 text-green-400 font-bold">{tl(m.total_profit)} ج.م</td>
                          <td className="px-4 py-3 text-red-400">{tl(m.total_cost)} ج.م</td>
                          <td className="px-4 py-3 text-gray-300">{m.total_orders}</td>
                          <td className="px-4 py-3 text-[#00CED1]">{tl(m.cash_revenue)}</td>
                          <td className="px-4 py-3 text-[#D4AF37]">{tl(m.debt_revenue)}</td>
                          <td className="px-4 py-3 text-red-400/70">{tl(m.returns_total)}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
                {monthlyData.length === 0 && (
                  <div className="text-center py-12 text-gray-500 font-cairo">
                    لا توجد بيانات شهرية — تأكد من تطبيق ملف database_optimization.sql
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
