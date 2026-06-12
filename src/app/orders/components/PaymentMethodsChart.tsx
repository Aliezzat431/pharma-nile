import React from 'react';
import { motion } from 'framer-motion';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface PaymentMethodsChartProps {
  paymentData: any[];
}

export function PaymentMethodsChart({ paymentData }: PaymentMethodsChartProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-6 h-[400px] flex flex-col">
      <h2 className="text-lg font-bold font-cairo mb-4 flex items-center gap-2">
        <PieChartIcon className="w-5 h-5 text-[#D4AF37]" /> طرق الدفع
      </h2>
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        {paymentData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
               <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="rgba(0,0,0,0)"
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontFamily: 'Cairo'}}
                formatter={(val: any) => val?.toLocaleString('ar-EG') + " ج.م"}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontFamily: 'Cairo', fontSize: '12px', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 font-cairo text-sm">لا توجد مبيعات في هذه الفترة</p>
        )}
      </div>
    </motion.div>
  );
}
