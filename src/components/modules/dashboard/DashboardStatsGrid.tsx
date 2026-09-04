'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Skeleton from '@/components/ui/Skeleton';
import { DashboardStats } from '@/lib/api/dashboard';
import { TrendingUp, DollarSign, AlertCircle, History } from 'lucide-react';

interface DashboardStatsGridProps {
 stats: DashboardStats | null;
 loading: boolean;
}

export default function DashboardStatsGrid({ stats, loading }: DashboardStatsGridProps) {
 const statCards = [
 { label: "مبيعات اليوم", value: stats?.todaySales || 'ج.م 0', icon: TrendingUp, color: 'text-[var(--nile-teal)]', glow: 'bg-[var(--nile-teal)]/10' },
 { label: "صافي الأرباح", value: stats?.todayProfit || 'ج.م 0', icon: DollarSign, color: 'text-[var(--royal-gold)]', glow: 'bg-[var(--royal-gold)]/10' },
 { label: "نواقص المخزون", value: stats?.lowStockItems || '0', icon: AlertCircle, color: 'text-red-400', glow: 'bg-red-500/10' },
 { label: "صلاحيات قريبة", value: stats?.expiringSoon || '0', icon: History, color: 'text-orange-400', glow: 'bg-orange-500/10' },
 ];

 return (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {statCards.map((stat, i) => {
 const Content = (
 <motion.div
 key={stat.label}
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 whileHover={{ y: -8, scale: 1.02 }}
 transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
 className="glass-card p-6 flex items-start gap-5 relative overflow-hidden group border border-[var(--glass-border)] hover:border-[var(--nile-teal)]/30 cursor-pointer hover:shadow-[0_20px_40px_-15px_var(--nile-teal-glow)] z-10"
 >
 <div className="absolute inset-0 bg-glass-surface /5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
 <div className={`w-14 h-14 rounded-2xl ${stat.glow} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-xl relative z-10`}>
 <stat.icon className={`w-7 h-7 ${stat.color} drop-shadow-[0_0_8px_currentColor]`} />
 </div>
 <div className="flex-1 relative z-10">
 <h3 className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1 font-cairo transition-colors group-hover:text-[var(--text-primary)]">{stat.label}</h3>
 <div className="text-3xl font-black font-inter tracking-tight text-nile-teal font-medium">
 {loading ? <Skeleton className="h-8 w-24" /> : stat.value}
 </div>
 </div>
 <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-20 ${stat.glow} transition-all duration-700 group-hover:opacity-50 group-hover:scale-150`} />
 </motion.div>
 );

 if (stat.label === "نواقص المخزون") {
 return <Link key={stat.label} href="/shortages">{Content}</Link>;
 }
 return Content;
 })}
 </div>
 );
}
