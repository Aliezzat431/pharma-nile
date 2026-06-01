'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, 
  DollarSign, Package, Loader2, Calendar, ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  order_id: string;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  profit_total: number;
  payment_method: string;
  status: string;
  order_items: OrderItem[];
}

export default function SalesDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select("id, created_at, total, profit_total, payment_method, status, order_items ( id, name, price, quantity, order_id )")
        .eq('status', 'completed');

      const now = new Date();
      let fromDate = new Date();
      if (dateRange === 'today') {
        fromDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        fromDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        fromDate.setMonth(now.getMonth() - 1);
      }
      
      if (dateRange !== 'all') {
        query = query.gte('created_at', fromDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching sales data", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalProfit = orders.reduce((sum, order) => sum + Number(order.profit_total || 0), 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const totalItemsSold = orders.reduce((sum, order) => 
    sum + order.order_items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0)
  , 0);

  const generateTrendData = () => {
    const grouped: Record<string, { date: string, sales: number, profit: number }> = {};
    const now = new Date();
    let daysToShow = 30;
    if (dateRange === 'today') daysToShow = 1;
    if (dateRange === 'week') daysToShow = 7;
    
    for(let i = daysToShow - 1; i >= 0; i--) {
       const d = new Date(now);
       d.setDate(d.getDate() - i);
       const dateStr = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
       grouped[dateStr] = { date: dateStr, sales: 0, profit: 0 };
    }

    orders.forEach(order => {
      const dateStr = new Date(order.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      if (!grouped[dateStr]) {
         grouped[dateStr] = { date: dateStr, sales: 0, profit: 0 };
      }
      grouped[dateStr].sales += Number(order.total);
      grouped[dateStr].profit += Number(order.profit_total || 0);
    });

    return Object.values(grouped);
  };
  const trendData = generateTrendData();

  const generateTopProductsData = () => {
    const productSales: Record<string, number> = {};
    orders.forEach(order => {
      order.order_items.forEach(item => {
        if (!productSales[item.name]) productSales[item.name] = 0;
        productSales[item.name] += Number(item.quantity);
      });
    });
    
    return Object.entries(productSales)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };
  const topProductsData = generateTopProductsData();

  const generatePaymentData = () => {
    const paymentSums: Record<string, number> = { cash: 0, debt: 0, sadqah: 0 };
    orders.forEach(order => {
      const method = order.payment_method || 'cash';
      if (paymentSums[method] !== undefined) {
        paymentSums[method] += Number(order.total);
      } else {
        paymentSums[method] = Number(order.total);
      }
    });

    return [
      { name: 'نقدي', value: paymentSums['cash'], color: '#00CED1' },
      { name: 'آجل / ديون', value: paymentSums['debt'], color: '#D4AF37' },
      { name: 'صدقة', value: paymentSums['sadqah'], color: '#ec4899' },
    ].filter(d => d.value > 0);
  };
  const paymentData = generatePaymentData();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo text-foreground">
            <TrendingUp className="text-[#00CED1]" />
            تحليلات <span className="text-[#00CED1]">المبيعات</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo">نظرة شاملة على أداء المبيعات والأرباح لمتجرك</p>
        </div>
        <div className="flex bg-black/40 border border-white/5 rounded-xl p-1 overflow-hidden font-cairo">
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: 'هذا الأسبوع' },
            { id: 'month', label: 'هذا الشهر' },
            { id: 'all', label: 'الكل' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDateRange(tab.id as any)}
              className={"px-4 py-2 text-sm rounded-lg transition-all " + (dateRange === tab.id ? "bg-[#00CED1]/20 text-[#00CED1] font-bold" : "text-gray-400 hover:text-white")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#00CED1]" />
          <p className="font-cairo">جاري تحليل البيانات...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="glass-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between z-10 relative">
                <div className="font-cairo">
                  <p className="text-gray-400 text-xs">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold text-white mt-1">{totalRevenue.toLocaleString('ar-EG')} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#00CED1]/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#00CED1]" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-[#00CED1]/10 rounded-full blur-xl group-hover:bg-[#00CED1]/20 transition-all"></div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between z-10 relative">
                <div className="font-cairo">
                  <p className="text-gray-400 text-xs">إجمالي الأرباح</p>
                  <p className="text-2xl font-bold text-[#D4AF37] mt-1">{totalProfit.toLocaleString('ar-EG')} <span className="text-sm font-normal text-[#D4AF37]/50">ج.م</span></p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#D4AF37]" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-[#D4AF37]/10 rounded-full blur-xl group-hover:bg-[#D4AF37]/20 transition-all"></div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between z-10 relative">
                <div className="font-cairo">
                  <p className="text-gray-400 text-xs">متوسط قيمة الطلب</p>
                  <p className="text-2xl font-bold text-white mt-1">{Math.round(averageOrderValue).toLocaleString('ar-EG')} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 relative overflow-hidden group">
              <div className="flex items-center justify-between z-10 relative">
                <div className="font-cairo">
                  <p className="text-gray-400 text-xs">المنتجات المباعة</p>
                  <p className="text-2xl font-bold text-white mt-1">{totalItemsSold}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 glass-panel p-6 h-[400px] flex flex-col">
              <h2 className="text-lg font-bold font-cairo mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00CED1]" /> نمو المبيعات
              </h2>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00CED1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00CED1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                    <XAxis dataKey="date" stroke="#666" tick={{fontFamily: 'Cairo', fontSize: 12}} tickMargin={10} axisLine={false} />
                    <YAxis 
                      stroke="#666" 
                      tick={{fontFamily: 'Cairo', fontSize: 12}} 
                      axisLine={false} 
                      tickFormatter={(val) => `${Number(val ?? 0).toLocaleString('ar-EG')} ج.م`} 
                    />
                    <RechartsTooltip 
                      contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontFamily: 'Cairo'}} 
                      itemStyle={{fontFamily: 'Cairo'}}
                      formatter={(val: any) => [`${Number(val ?? 0).toLocaleString('ar-EG')} ج.م`, ""]}
                    />
                    <Area type="monotone" name="المبيعات" dataKey="sales" stroke="#00CED1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" name="الأرباح" dataKey="profit" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-6 h-[400px] flex flex-col">
              <h2 className="text-lg font-bold font-cairo mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[#D4AF37]" /> طرق الدفع
              </h2>
              <div className="flex-1 w-full flex items-center justify-center min-h-0">
                {paymentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="rgba(0,0,0,0)"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={"cell-" + index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontFamily: 'Cairo'}}
                        formatter={(val: any) => [`${Number(val ?? 0).toLocaleString('ar-EG')} ج.م`, ""]}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontFamily: 'Cairo', fontSize: '12px', paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 font-cairo text-sm">لا توجد مبيعات في هذه الفترة</p>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-3 glass-panel p-6 h-[400px] flex flex-col">
              <h2 className="text-lg font-bold font-cairo mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#00CED1]" /> المنتجات الأكثر مبيعاً
              </h2>
              <div className="flex-1 w-full min-h-0">
                {topProductsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#666" tick={{fontFamily: 'Cairo'}} />
                      <YAxis dataKey="name" type="category" stroke="#ccc" tick={{fontFamily: 'Cairo', fill: '#fff'}} width={150} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontFamily: 'Cairo'}}
                        cursor={{fill: '#ffffff05'}}
                        formatter={(val: number) => [val + " علبة/قطعة", "الكمية المباعة"]}
                      />
                      <Bar dataKey="qty" fill="#00CED1" radius={[0, 4, 4, 0]} barSize={24}>
                        {topProductsData.map((entry, index) => (
                           <Cell key={"cell-" + index} fill={index === 0 ? '#00CED1' : '#D4AF37'} opacity={1 - index * 0.15} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 font-cairo text-sm">لا توجد مبيعات في هذه الفترة</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
