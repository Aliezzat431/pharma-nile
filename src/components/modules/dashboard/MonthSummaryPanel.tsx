'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Skeleton from '@/components/ui/Skeleton';
import { CalendarDays } from 'lucide-react';

interface MonthSummaryPanelProps {
 monthSummary: any;
 loading: boolean;
}

export default function MonthSummaryPanel({ monthSummary, loading }: MonthSummaryPanelProps) {
 if (!monthSummary && !loading) return null;

 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="glass-panel p-6"
 >
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <CalendarDays className="w-5 h-5 text-[var(--royal-gold)]" />
 <h2 className="font-bold font-cairo text-base">ملخص الشهر الحالي</h2>
 </div>
 <Link href="/financials" className="text-[10px] font-bold text-[var(--nile-teal)] uppercase hover:underline font-cairo">
 تقرير مفصل
 </Link>
 </div>
 {loading ? (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
 </div>
 ) : monthSummary ? (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { label: 'إجمالي المبيعات', value: monthSummary.total_revenue, color: 'var(--nile-teal)' },
 { label: 'صافي الربح', value: monthSummary.total_profit, color: 'var(--royal-gold)' },
 { label: 'إجمالي الطلبات', value: monthSummary.total_orders, color: '#a78bfa', isCount: true },
 { label: 'مبيعات نقدية', value: monthSummary.cash_revenue, color: '#10b981' },
 ].map(m => (
 <div key={m.label} className="glass-card p-4">
 <p className="text-gray-500 font-cairo text-xs mb-1">{m.label}</p>
 <p className="font-bold text-lg font-cairo" style={{ color: m.color }}>
 {m.isCount
 ? Number(m.value).toLocaleString('ar-EG')
 : `${Number(m.value).toLocaleString('ar-EG')} ج.م`}
 </p>
 </div>
 ))}
 </div>
 ) : null}
 </motion.div>
 );
}
