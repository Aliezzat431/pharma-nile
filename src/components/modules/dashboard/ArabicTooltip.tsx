import React from 'react';

interface CustomTooltipProps {
 active?: boolean;
 payload?: Array<{
 color?: string;
 name?: string;
 value?: any;
 }>;
 label?: any;
}

const ArabicTooltip = ({ active, payload, label }: CustomTooltipProps) => {
 if (!active || !payload || !payload.length) return null;
 return (
 <div className="glass-card p-3 text-right min-w-[140px]" dir="rtl">
 <p className="text-xs font-bold text-gray-400 font-cairo mb-2">{label}</p>
 {payload.map((p: any, i: number) => (
 <div key={i} className="flex items-center justify-between gap-3 text-xs font-cairo">
 <span style={{ color: p.color }}>{p.name}</span>
 <span className="font-bold text-white">{Number(p.value).toLocaleString('ar-EG')} ج.م</span>
 </div>
 ))}
 </div>
 );
};

export default ArabicTooltip;
