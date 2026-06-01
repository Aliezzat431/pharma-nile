import { supabase } from '../supabase';

export interface DashboardStats {
  todaySales: string;
  todayProfit: string;
  activeSessions: string;
  lowStockItems: string;
  expiringSoon: string;
  weeklyData: { name: string, sales: number, debts: number }[];
}

export interface RecentTransaction {
  id: string;
  created_at: string;
  total: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Today's Sales & Profit
  const { data: salesData } = await supabase
    .from('orders')
    .select('total, profit_total')
    .gte('created_at', today.toISOString());
  
  const totalSales = salesData?.reduce((acc, order) => acc + Number(order.total), 0) || 0;
  const totalProfit = salesData?.reduce((acc, order) => acc + Number(order.profit_total || 0), 0) || 0;

  // 2. Active Sessions
  const { count: activeCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // 3. Low Stock Items (Threshold < 10)
  // We check the product_inventory view if available, otherwise products/batches
  const { data: lowStockData } = await supabase
    .from('product_inventory')
    .select('*')
    .lt('total_quantity', 10);
  
  const lowStockCount = lowStockData?.length || 0;

  // 4. Expiring Soon (90 days)
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
  
  const { count: expiryCount } = await supabase
    .from('batches')
    .select('*', { count: 'exact', head: true })
    .gt('quantity', 0)
    .lte('expiry_date', ninetyDaysFromNow.toISOString().split('T')[0]);

  // 5. Weekly Data for Chart (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: weekData } = await supabase
    .from('orders')
    .select('total, payment_method, created_at')
    .gte('created_at', weekAgo.toISOString());

  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const chartMap = new Map();
  
  // Pre-fill last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = days[d.getDay()];
    chartMap.set(dayName, { name: dayName, sales: 0, debts: 0 });
  }

  weekData?.forEach(o => {
    const dayName = days[new Date(o.created_at).getDay()];
    if (chartMap.has(dayName)) {
      const current = chartMap.get(dayName);
      if (o.payment_method === 'debt') {
        current.debts += Number(o.total);
      } else {
        current.sales += Number(o.total);
      }
    }
  });

  return {
    todaySales: `E£ ${totalSales.toLocaleString()}`,
    todayProfit: `E£ ${totalProfit.toLocaleString()}`,
    activeSessions: `${activeCount || 0} Staff`,
    lowStockItems: String(lowStockCount),
    expiringSoon: String(expiryCount || 0),
    weeklyData: Array.from(chartMap.values()),
  };
}

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, total')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return [];
  return data || [];
}
