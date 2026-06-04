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
  payment_method: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  if (!pharmacyId) {
    return {
      todaySales: `ج.م 0`,
      todayProfit: `ج.م 0`,
      activeSessions: `0 موظف`,
      lowStockItems: "0",
      expiringSoon: "0",
      weeklyData: []
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Run all queries in parallel to significantly reduce latency
  const [
    { data: salesData },
    { count: activeCount },
    { data: lowStockData },
    { count: expiryCount },
    { data: weekData }
  ] = await Promise.all([
    // 1. Today's Sales & Profit
    supabase
      .from('orders')
      .select('total, profit_total')
      .eq('pharmacy_id', pharmacyId)
      .gte('created_at', today.toISOString()),
    
    // 2. Active Sessions
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'active'),

    // 3. Low Stock Items (Threshold < 10)
    supabase
      .from('product_inventory')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .lt('total_quantity', 10),

    // 4. Expiring Soon (90 days)
    supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .gt('quantity', 0)
      .lte('expiry_date', ninetyDaysFromNow.toISOString().split('T')[0]),

    // 5. Weekly Data for Chart (last 7 days)
    supabase
      .from('orders')
      .select('total, payment_method, created_at')
      .eq('pharmacy_id', pharmacyId)
      .gte('created_at', weekAgo.toISOString())
  ]);

  const totalSales = salesData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
  const totalProfit = salesData?.reduce((sum, o) => sum + Number(o.profit_total), 0) || 0;
  const lowStockCount = lowStockData?.length || 0;

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
    todaySales: `ج.م ${totalSales.toLocaleString()}`,
    todayProfit: `ج.م ${totalProfit.toLocaleString()}`,
    activeSessions: `${activeCount || 0} موظف`,
    lowStockItems: String(lowStockCount),
    expiringSoon: String(expiryCount || 0),
    weeklyData: Array.from(chartMap.values()),
  };
}

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, total, payment_method')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return [];
  return data || [];
}
