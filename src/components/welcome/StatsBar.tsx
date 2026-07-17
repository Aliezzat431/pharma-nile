'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}

const stats: StatItem[] = [
  { value: 500, suffix: '+', label: 'صيدلية نشطة' },
  { value: 99.9, suffix: '%', label: 'نسبة استقرار الخدمة', decimals: 1 },
  { value: 2, suffix: 'M+', label: 'فاتورة مبيعات محفوظة' },
  { value: 14, suffix: ' يوماً', label: 'تجربة مجانية كاملة' },
];

function AnimatedNumber({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref} className="font-black font-sans tabular-nums">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
}

export default function StatsBar() {
  return (
    <div className="border-y border-[var(--glass-border)] bg-white/[0.01] py-12 font-cairo" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-center space-y-1"
            >
              <p className="text-3xl md:text-4xl text-[var(--text-primary)] nile-gradient-text">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
              </p>
              <p className="text-[var(--text-muted)] text-xs font-semibold">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
