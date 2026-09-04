'use client';

import Link from 'next/link';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowRightLeft, History } from 'lucide-react';
import { RecentTransaction } from '@/lib/api/dashboard';

interface RecentTransactionsListProps {
 transactions: RecentTransaction[];
 loading: boolean;
}

export default function RecentTransactionsList({ transactions, loading }: RecentTransactionsListProps) {
 return (
 <div className="glass-panel p-6 flex flex-col space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-bold font-cairo">آخر العمليات</h2>
 <Link href="/orders" className="text-[10px] font-bold text-[var(--nile-teal)] uppercase hover:underline">عرض الكل</Link>
 </div>
 
 <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
 {loading ? (
 <Skeleton count={5} className="h-16 w-full mb-3" />
 ) : transactions.length > 0 ? (
 transactions.map((tx, idx) => (
 <div key={idx} className="flex items-center gap-4 p-3 pb-6 rounded-xl hover:bg-[var(--glass-surface)] transition-colors border border-transparent hover:border-[var(--glass-border)] group">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.total > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
 <ArrowRightLeft className="w-5 h-5" />
 </div>
 <div className="flex-1 overflow-hidden">
 <p className="text-sm font-bold text-white truncate font-cairo">عملية بيع #{tx.id.slice(-4)}</p>
 <p className="text-[10px] text-gray-500 font-bold">{new Date(tx.created_at).toLocaleTimeString('ar-EG')}</p>
 </div>
 <div className="text-right">
 <p className="text-sm font-bold text-[var(--nile-teal)]">{tx.total} ج.م</p>
 <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{tx.payment_method}</p>
 </div>
 </div>
 ))
 ) : (
 <div className="empty-state">
 <History className="w-12 h-12 mb-3" />
 <p className="text-sm font-cairo">لا توجد مبيعات مؤخراً</p>
 </div>
 )}
 </div>
 
 <div className="pt-4 border-t border-[var(--glass-border)]">
 <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 font-cairo leading-relaxed bg-[var(--nile-teal)]/5 p-3 rounded-xl border border-[var(--nile-teal)]/10">
 <span className="text-[var(--nile-teal)]">تنبيه:</span>
 <span>تابع تحصيل الديون المتأخرة لتحسين السيولة.</span>
 </div>
 </div>
 </div>
 );
}
