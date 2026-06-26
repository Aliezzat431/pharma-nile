'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, 
  DollarSign, Package, Loader2, Calendar, ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageGSAP } from '@/hooks/usePageGSAP';
import { SalesSummaryCards } from './components/SalesSummaryCards';
import { SalesTrendChart } from './components/SalesTrendChart';
import { PaymentMethodsChart } from './components/PaymentMethodsChart';
import { TopProductsChart } from './components/TopProductsChart';

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

  // GSAP page-entry
  const pageRef = usePageGSAP();

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
    <div ref={pageRef} className="w-full max-w-7xl mx-auto space-y-6 pb-12 p-2 sm:p-4">
      <header data-gsap="fade-up" className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo text-foreground">
            <TrendingUp className="text-[#00CED1]" />
            تحليلات <span className="text-[#00CED1]">المبيعات</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo">نظرة شاملة على أداء المبيعات والأرباح لمتجرك</p>
        </div>
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
      </header>

      {loading ? (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3">
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
        </>
      )}
    </div>
  );
}

