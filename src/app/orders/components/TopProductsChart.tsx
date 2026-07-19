import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface TopProductsChartProps {
  topProductsData: any[];
}

export function TopProductsChart({ topProductsData }: TopProductsChartProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-3 glass-panel p-6 h-[400px] flex flex-col">
      <h2 className="text-lg font-bold font-cairo mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-[var(--nile-teal)]" /> المنتجات الأكثر مبيعاً
      </h2>
      <div className="flex-1 w-full min-h-0">
        {topProductsData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#666" tick={{fontFamily: 'Cairo'}} />
              <YAxis dataKey="name" type="category" stroke="#ccc" tick={{fontFamily: 'Cairo', fill: '#fff'}} width={150} axisLine={false} tickLine={false} />
              <RechartsTooltip 
                contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontFamily: 'Cairo'}}
                cursor={{fill: '#ffffff05'}}
                formatter={(val: any) => [val + " علبة/قطعة", "الكمية المباعة"]}
              />
              <Bar dataKey="qty" fill="var(--nile-teal)" radius={[0, 4, 4, 0]} barSize={24}>
                {topProductsData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--nile-teal)' : 'var(--royal-gold)'} opacity={1 - index * 0.15} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 font-cairo text-sm">لا توجد مبيعات في هذه الفترة</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
