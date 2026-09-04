'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats, getRecentTransactions, DashboardStats, RecentTransaction } from '@/lib/api/dashboard';
import { getCurrentMonthSummary } from '@/lib/api/financials';
import { supabase } from '@/lib/supabase';

import DashboardHeader from '@/components/modules/dashboard/DashboardHeader';
import DashboardStatsGrid from '@/components/modules/dashboard/DashboardStatsGrid';
import MonthSummaryPanel from '@/components/modules/dashboard/MonthSummaryPanel';
import QuickActionsGrid from '@/components/modules/dashboard/QuickActionsGrid';
import WeeklyPerformanceChart from '@/components/modules/dashboard/WeeklyPerformanceChart';
import RecentTransactionsList from '@/components/modules/dashboard/RecentTransactionsList';

export default function Dashboard() {
 const [stats, setStats] = useState<DashboardStats | null>(null);
 const [recentTrans, setRecentTrans] = useState<RecentTransaction[]>([]);
 const [monthSummary, setMonthSummary] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 const fetchDashboardData = async () => {
 setLoading(true);
 try {
 const [s, t, ms] = await Promise.all([
 getDashboardStats(),
 getRecentTransactions(),
 getCurrentMonthSummary(),
 ]);
 setStats(s);
 setRecentTrans(t);
 setMonthSummary(ms);
 } catch (err) {
 console.error("Dashboard fetch error", err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchDashboardData();

 const channel = supabase
 .channel('dashboard-sync')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchDashboardData())
 .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => fetchDashboardData())
 .subscribe();

 return () => {
 supabase.removeChannel(channel);
 };
 }, []);

 const weeklyData = stats?.weeklyData || [];

 return (
 <main className="w-full max-w-full mx-auto space-y-10">
 <DashboardHeader onRefresh={fetchDashboardData} loading={loading} />
 
 <DashboardStatsGrid stats={stats} loading={loading} />

 <MonthSummaryPanel monthSummary={monthSummary} loading={loading} />

 <QuickActionsGrid />

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <WeeklyPerformanceChart weeklyData={weeklyData} loading={loading} />
 
 <RecentTransactionsList transactions={recentTrans} loading={loading} />
 </div>
 </main>
 );
}


