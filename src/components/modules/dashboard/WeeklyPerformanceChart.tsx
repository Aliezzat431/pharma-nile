'use client';

import Skeleton from '@/components/ui/Skeleton';
import { Activity } from 'lucide-react';
import { 
 AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
 ResponsiveContainer 
} from 'recharts';
import ArabicTooltip from './ArabicTooltip';

interface WeeklyPerformanceChartProps {
 weeklyData: any[];
 loading: boolean;
}

export default function WeeklyPerformanceChart({ weeklyData, loading }: WeeklyPerformanceChartProps) {
 return (
 <div className="lg:col-span-2 glass-panel p-8 space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-xl font-bold font-cairo">أداء المبيعات الأسبوعي</h2>
 <p className="text-gray-500 text-sm font-cairo">مقارنة السيولة بالديون — آخر 7 أيام</p>
 </div>
 <div className="flex gap-4">
 <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase"><div className="w-2 h-2 rounded-full bg-[var(--nile-teal)]" /> كاش</div>
 <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase"><div className="w-2 h-1 bg-[var(--royal-gold)] rounded-full" /> آجل</div>
 </div>
 </div>
 
 <div className="h-[300px] w-full">
 {loading ? (
 <Skeleton className="w-full h-full" />
 ) : weeklyData.length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
 <Activity className="w-8 h-8 opacity-40" />
 <p className="text-sm font-cairo opacity-50">لا توجد مبيعات في هذا الأسبوع بعد</p>
 </div>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
 <defs>
 <linearGradient id="chartTeal" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--nile-teal)" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="var(--nile-teal)" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="chartGold" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--royal-gold)" stopOpacity={0.1}/>
 <stop offset="95%" stopColor="var(--royal-gold)" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
 <XAxis 
 dataKey="name" 
 axisLine={false} 
 tickLine={false} 
 tick={{ fill: '#666', fontSize: 11, fontFamily: 'Cairo' }} 
 dy={12}
 interval={0}
 />
 <YAxis 
 axisLine={false} 
 tickLine={false} 
 tick={{ fill: '#666', fontSize: 11 }}
 tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
 width={40}
 />
 <Tooltip content={<ArabicTooltip />} cursor={{ stroke: 'var(--nile-teal)', strokeWidth: 1, strokeDasharray: '4 4' }} />
 <Area 
 type="monotone" 
 dataKey="sales" 
 name="المبيعات"
 stroke="var(--nile-teal)" 
 strokeWidth={3}
 fillOpacity={1} 
 fill="url(#chartTeal)" 
 animationDuration={1500}
 dot={{ fill: 'var(--nile-teal)', strokeWidth: 0, r: 4 }}
 activeDot={{ r: 6, fill: 'var(--nile-teal)', stroke: '#fff', strokeWidth: 2 }}
 />
 <Area 
 type="monotone" 
 dataKey="debts" 
 name="الديون"
 stroke="var(--royal-gold)" 
 strokeWidth={2}
 strokeDasharray="6 6"
 fillOpacity={1}
 fill="url(#chartGold)"
 dot={{ fill: 'var(--royal-gold)', strokeWidth: 0, r: 3 }}
 activeDot={{ r: 5, fill: 'var(--royal-gold)', stroke: '#fff', strokeWidth: 2 }}
 />
 </AreaChart>
 </ResponsiveContainer>
 )}
 </div>
 </div>
 );
}
