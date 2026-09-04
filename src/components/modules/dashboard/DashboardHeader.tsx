'use client';

import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface DashboardHeaderProps {
 onRefresh: () => void;
 loading: boolean;
}

export default function DashboardHeader({ onRefresh, loading }: DashboardHeaderProps) {
 const { user } = useAuth();
 
 return (
 <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className="space-y-1">
 <motion.h1 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className="text-4xl md:text-5xl font-bold font-cairo tracking-tight"
 >
 نورت صيدليتك، <span className="text-nile-teal font-medium">{user?.user_metadata?.full_name?.split(' ')[0]} </span>
 </motion.h1>
 <motion.p 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.1 }}
 className="text-gray-500 text-lg font-cairo font-medium"
 >
 أداء المبيعات جيد اليوم، إليك الأرقام الحالية:
 </motion.p>
 </div>
 
 <div className="flex items-center gap-3">
 <button 
 onClick={onRefresh}
 className="glass-card px-6 py-2.5 flex items-center gap-3 hover:bg-[var(--glass-surface)] active:scale-95 transition-all text-sm font-bold font-cairo"
 >
 <RefreshCw className={`w-4 h-4 text-[var(--nile-teal)] ${loading ? 'animate-spin' : ''}`} />
 <span>تحديث البيانات</span>
 </button>
 </div>
 </header>
 );
}
