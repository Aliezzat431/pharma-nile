'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Activity, ShoppingBag, Sparkles, Boxes, UserPlus } from 'lucide-react';

export default function QuickActionsGrid() {
 const quickActions = [
 { label: 'يلا نبيع (POS)', icon: ShoppingBag, href: '/pos', color: 'bg-glass-surface from-[var(--nile-teal)] to-[var(--nile-teal)]/70' },
 { label: 'استيراد فاتورة AI', icon: Sparkles, href: '/invoices/import', color: 'bg-glass-surface from-[var(--royal-gold)]/80 to-[var(--royal-gold)]/40' },
 { label: 'استلام بضاعة', icon: Boxes, href: '/inventory', color: 'bg-[var(--glass-surface)] border-[var(--glass-border)]' },
 { label: 'عميل جديد', icon: UserPlus, href: '/customers', color: 'bg-[var(--glass-surface)] border-[var(--glass-border)]' },
 ];

 return (
 <div className="space-y-4">
 <h2 className="text-xl font-bold font-cairo flex items-center gap-3">
 <Activity className="w-5 h-5 text-[var(--nile-teal)]" />
 عمليات سريعة
 </h2>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {quickActions.map((action, i) => (
 <Link key={action.label} href={action.href}>
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 whileHover={{ y: -5, scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 transition={{ delay: 0.4 + i * 0.05, type: "spring", stiffness: 400, damping: 17 }}
 className={`p-4 rounded-2xl flex items-center justify-center gap-4 cursor-pointer transition-all border ${action.color} group shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden`}
 >
 <div className="absolute inset-0 bg-glass-surface /20 opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.href === '/pos' || action.href === '/invoices/import' ? 'bg-[var(--glass-surface)] backdrop-blur-sm shadow-md' : 'bg-[var(--glass-surface-heavy)]'} transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-inner`}>
 <action.icon className={`w-6 h-6 ${action.href === '/pos' || action.href === '/invoices/import' ? 'text-[#0f172a]' : 'text-[var(--nile-teal)]'}`} />
 </div>
 <span className={`font-cairo font-black text-base tracking-wide z-10 ${action.href === '/pos' || action.href === '/invoices/import' ? 'text-[#0f172a]' : 'text-[var(--text-primary)]'}`}>{action.label}</span>
 </motion.div>
 </Link>
 ))}
 </div>
 </div>
 );
}
