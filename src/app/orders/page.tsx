'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, 
  DollarSign, Package, Loader2, Calendar, ShoppingBag, Printer, FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageGSAP } from '@/hooks/usePageGSAP';
import { useAuth } from '@/hooks/useAuth';
import { SalesSummaryCards } from './components/SalesSummaryCards';
import { SalesTrendChart } from './components/SalesTrendChart';
import { PaymentMethodsChart } from './components/PaymentMethodsChart';
import { TopProductsChart } from './components/TopProductsChart';
import { usePagination } from '@/hooks/usePagination'; 
import Pagination from '@/components/ui/Pagination';   

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

const PAGE_SIZE = 10; 

export default function SalesDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  
  const pageRef = usePageGSAP();
  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  useEffect(() => {
    if (pharmacyId) {
      fetchSalesData();
    }
  }, [dateRange, pharmacyId]);

  const fetchSalesData = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select("id, created_at, total, profit_total, payment_method, status, order_items ( id, name, price, quantity, order_id )")
        .eq('status', 'completed')
        .eq('pharmacy_id', pharmacyId);

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

      
      query = query.order('created_at', { ascending: false });

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

  
  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    orders,
    { pageSize: PAGE_SIZE }
  );

  
  const handleExportCSV = () => {
    const headers = ["التاريخ", "رقم الطلب", "المنتجات", "الإجمالي", "الربح", "طريقة الدفع"];
    const rows = orders.map(o => [
      new Date(o.created_at).toLocaleDateString('ar-EG'),
      o.id.slice(0, 8),
      o.order_items.map(i => `${i.name} (${i.quantity})`).join(', '),
      o.total,
      o.profit_total,
      o.payment_method === 'cash' ? 'نقدي' : o.payment_method === 'debt' ? 'آجل' : 'صدقة'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={pageRef} className="w-full max-w-7xl mx-auto space-y-6 pb-12 p-2 sm:p-4">
      <header data-gsap="fade-up" className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo text-foreground">
            <TrendingUp className="text-[#00CED1]" />
            تحليلات <span className="text-[#00CED1]">المبيعات</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo">نظرة شاملة على أداء المبيعات والأرباح لمتجرك</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
           {}
           <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
                title="طباعة التقرير"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button 
                onClick={handleExportCSV}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#00CED1] transition-all border border-white/10"
                title="تصدير Excel"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </button>
           </div>

           {}
           <div className="flex flex-nowrap bg-black/40 border border-white/5 rounded-xl p-1 overflow-hidden font-cairo w-full lg:w-auto overflow-x-auto snap-x">
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'هذا الأسبوع' },
              { id: 'month', label: 'هذا الشهر' },
              { id: 'all', label: 'الكل' }
            ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDateRange(tab.id as any)}
                  className={"flex-1 lg:flex-none px-4 py-2 text-sm rounded-lg transition-all whitespace-nowrap snap-center " + (dateRange === tab.id ? "bg-[#00CED1]/20 text-[#00CED1] font-bold" : "text-gray-400 hover:text-white")}
                >
                  {tab.label}
                </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3 min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#00CED1]" />
          <p className="font-cairo">جاري تحليل البيانات...</p>
        </div>
      ) : (
        <>
          <SalesSummaryCards 
            totalRevenue={totalRevenue} 
            totalProfit={totalProfit} 
            averageOrderValue={averageOrderValue} 
            totalItemsSold={totalItemsSold} 
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <SalesTrendChart trendData={trendData} />
            <PaymentMethodsChart paymentData={paymentData} />
            <TopProductsChart topProductsData={topProductsData} />
          </div>

          {}
          <div className="mt-12">
            <h3 className="text-xl font-bold font-cairo mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#00CED1]" />
              تفاصيل العمليات الأخيرة
            </h3>
            
            <div className="glass-panel overflow-hidden border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 font-cairo text-gray-400 text-sm">
                      <th className="p-4 font-semibold">رقم العملية</th>
                      <th className="p-4 font-semibold">التاريخ</th>
                      <th className="p-4 font-semibold">طريقة الدفع</th>
                      <th className="p-4 font-semibold">عدد الأصناف</th>
                      <th className="p-4 font-semibold">الإجمالي</th>
                      <th className="p-4 font-semibold">الربح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((order) => (
                      <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}</td>
                        <td className="p-4 text-sm text-gray-300">
                          {new Date(order.created_at).toLocaleDateString('ar-EG')} 
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(order.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            order.payment_method === 'cash' ? 'bg-emerald-500/10 text-emerald-400' :
                            order.payment_method === 'debt' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-pink-500/10 text-pink-400'
                          }`}>
                            {order.payment_method === 'cash' ? 'نقدي' : order.payment_method === 'debt' ? 'آجل' : 'صدقة'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          {order.order_items.reduce((acc, item) => acc + item.quantity, 0)} صنف
                        </td>
                        <td className="p-4 text-sm font-bold text-white">{Number(order.total).toLocaleString()} ج.م</td>
                        <td className="p-4 text-sm text-emerald-400">{Number(order.profit_total || 0).toLocaleString()} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {}
              {totalPages > 1 && (
                <div className="p-4 border-t border-white/5">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}