import { supabase } from '../supabase';

export interface FinancialStats {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  totalTransactions: number;
  paymentMethodDistribution: { name: string, value: number }[];
  dailyRevenue: { date: string, revenue: number, profit: number }[];
}

export interface MonthlyReport {
  year: number;
  month: number;
  month_name: string;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  total_orders: number;
  cash_revenue: number;
  debt_revenue: number;
  sadqah_revenue: number;
  returns_total: number;
}


export async function getFinancialStats(days: number = 30): Promise<FinancialStats | null> {
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

  const { data, error } = await supabase.rpc('get_financial_stats', {
    p_pharmacy_id: pharmacyId,
    p_days: days
  });

  if (error || !data) {
    console.error('Error fetching financial stats via RPC:', error);
    return null;
  }

  return {
    totalSales:        Number(data.total_sales || 0),
    totalCost:         Number(data.total_cost || 0),
    totalProfit:       Number(data.total_profit || 0),
    totalTransactions: Number(data.total_transactions || 0),
    paymentMethodDistribution: [
      { name: 'Cash',   value: Number(data.cash_revenue   || 0) },
      { name: 'Debt',   value: Number(data.debt_revenue   || 0) },
      { name: 'Sadqah', value: Number(data.sadqah_revenue || 0) },
    ],
    dailyRevenue: (data.daily_revenue || []).map((d: { date: string; revenue: number; profit: number }) => ({
      date:    d.date,
      revenue: Number(d.revenue || 0),
      profit:  Number(d.profit  || 0),
    }))
  };
}


export async function getMonthlyReport(
  year?: number,
  monthsBack: number = 12
): Promise<MonthlyReport[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return [];

  const { data, error } = await supabase.rpc('get_monthly_report', {
    p_pharmacy_id: pharmacyId,
    p_year:        year ?? null,
    p_months_back: monthsBack
  });

  if (error) {
    console.error('Error fetching monthly report:', error);
    return [];
  }

  return (data || []).map((row: MonthlyReport) => ({
    year:          row.year,
    month:         row.month,
    month_name:    row.month_name,
    total_revenue: Number(row.total_revenue  || 0),
    total_cost:    Number(row.total_cost     || 0),
    total_profit:  Number(row.total_profit   || 0),
    total_orders:  Number(row.total_orders   || 0),
    cash_revenue:  Number(row.cash_revenue   || 0),
    debt_revenue:  Number(row.debt_revenue   || 0),
    sadqah_revenue:Number(row.sadqah_revenue || 0),
    returns_total: Number(row.returns_total  || 0),
  }));
}


export async function getCurrentMonthSummary() {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return null;

  const now = new Date();

  const { data, error } = await supabase
    .from('monthly_summaries')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .eq('year',  now.getFullYear())
    .eq('month', now.getMonth() + 1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching current month summary:', error);
    return null;
  }
  return data;
}

