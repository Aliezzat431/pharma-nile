import { supabase } from '../supabase';

export interface FinancialStats {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  totalTransactions: number;
  paymentMethodDistribution: { name: string, value: number }[];
  dailyRevenue: { date: string, revenue: number, profit: number }[];
}

export async function getFinancialStats(days: number = 30) {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  if (!pharmacyId) {
    return {
      totalSales: 0,
      totalCost: 0,
      totalProfit: 0,
      totalTransactions: 0,
      paymentMethodDistribution: [
        { name: 'Cash', value: 0 },
        { name: 'Debt', value: 0 },
        { name: 'Sadqah', value: 0 },
      ],
      dailyRevenue: []
    };
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .gte('created_at', cutoff.toISOString())
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching financial stats:', error);
    return null;
  }

  const stats: FinancialStats = {
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    totalTransactions: orders?.length || 0,
    paymentMethodDistribution: [
      { name: 'Cash', value: 0 },
      { name: 'Debt', value: 0 },
      { name: 'Sadqah', value: 0 },
    ],
    dailyRevenue: []
  };

  const dailyMap = new Map<string, { revenue: number, profit: number }>();

  orders?.forEach(order => {
    stats.totalSales += Number(order.total);
    stats.totalCost += Number(order.cost_total || 0);
    stats.totalProfit += Number(order.profit_total || 0);

    // Payment distribution
    const method = order.payment_method;
    const distItem = stats.paymentMethodDistribution.find(d => d.name.toLowerCase() === method.toLowerCase());
    if (distItem) distItem.value += Number(order.total);

    // Daily grouping
    const date = new Date(order.created_at).toLocaleDateString();
    const current = dailyMap.get(date) || { revenue: 0, profit: 0 };
    dailyMap.set(date, {
      revenue: current.revenue + Number(order.total),
      profit: current.profit + Number(order.profit_total || 0)
    });
  });

  stats.dailyRevenue = Array.from(dailyMap.entries()).map(([date, val]) => ({
    date,
    revenue: val.revenue,
    profit: val.profit
  })).reverse();

  return stats;
}
