import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Activity, ShoppingBag, Package } from 'lucide-react';

interface SalesSummaryCardsProps {
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  totalItemsSold: number;
}

export function SalesSummaryCards({ totalRevenue, totalProfit, averageOrderValue, totalItemsSold }: SalesSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="glass-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between z-10 relative">
          <div className="font-cairo">
            <p className="text-gray-400 text-xs">إجمالي المبيعات</p>
            <p className="text-2xl font-bold text-white mt-1" dir="ltr">{totalRevenue.toLocaleString('ar-EG')} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--nile-teal)]/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[var(--nile-teal)]" />
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-[var(--nile-teal)]/10 rounded-full blur-xl group-hover:bg-[var(--nile-teal)]/20 transition-all"></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between z-10 relative">
          <div className="font-cairo">
            <p className="text-gray-400 text-xs">إجمالي الأرباح</p>
            <p className="text-2xl font-bold text-[var(--royal-gold)] mt-1" dir="ltr">{totalProfit.toLocaleString('ar-EG')} <span className="text-sm font-normal text-[var(--royal-gold)]/50">ج.م</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--royal-gold)]/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[var(--royal-gold)]" />
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-[var(--royal-gold)]/10 rounded-full blur-xl group-hover:bg-[var(--royal-gold)]/20 transition-all"></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between z-10 relative">
          <div className="font-cairo">
            <p className="text-gray-400 text-xs">متوسط قيمة الطلب</p>
            <p className="text-2xl font-bold text-white mt-1" dir="ltr">{Math.round(averageOrderValue).toLocaleString('ar-EG')} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between z-10 relative">
          <div className="font-cairo">
            <p className="text-gray-400 text-xs">المنتجات المباعة</p>
            <p className="text-2xl font-bold text-white mt-1">{totalItemsSold}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-green-400" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
