import { supabase } from '../supabase';

export interface DashboardStats {
  todaySales: string;
  activeSessions: string;
  lowStockItems: string;
  expiringSoon: string;
}

export interface RecentTransaction {
  id: string;
  created_at: string;
  total: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Today's Sales
  const { data: salesData } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', today.toISOString());
  
  const totalSales = salesData?.reduce((acc, order) => acc + Number(order.total), 0) || 0;

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

  return {
    todaySales: `E£ ${totalSales.toLocaleString()}`,
    activeSessions: `${activeCount || 0} Staff`,
    lowStockItems: String(lowStockCount),
    expiringSoon: String(expiryCount || 0),
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
