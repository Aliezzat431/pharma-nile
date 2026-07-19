import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';

interface SalesTrendChartProps {
  trendData: any[];
}

export function SalesTrendChart({ trendData }: SalesTrendChartProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 glass-panel p-6 h-[400px] flex flex-col">
      <h2 className="text-lg font-bold font-cairo mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[var(--nile-teal)]" /> نمو المبيعات
      </h2>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--nile-teal)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--nile-teal)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--royal-gold)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--royal-gold)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
            <XAxis dataKey="date" stroke="#666" tick={{fontFamily: 'Cairo', fontSize: 10}} tickMargin={10} axisLine={false} interval="preserveStartEnd" angle={-15} textAnchor="end" />
            <YAxis stroke="#666" tick={{fontFamily: 'Cairo', fontSize: 12}} axisLine={false} tickFormatter={(val) => val + ""} />
            <RechartsTooltip 
              contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontFamily: 'Cairo'}} 
              itemStyle={{fontFamily: 'Cairo'}}
            />
            <Area type="monotone" name="المبيعات" dataKey="sales" stroke="var(--nile-teal)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            <Area type="monotone" name="الأرباح" dataKey="profit" stroke="var(--royal-gold)" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
