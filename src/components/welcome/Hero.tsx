'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BarChart3, Database } from 'lucide-react';

interface HeroProps {
  onOpenWizard: () => void;
}

export default function Hero({ onOpenWizard }: HeroProps) {
  
  const trustSignals = [
    { icon: Sparkles, text: 'موثوق في +500 صيدلية بمصر' },
    { icon: Zap, text: 'استقرار تام واستجابة مباشرة' },
    { icon: Database, text: 'سهولة استيراد مخزونك الحالي' },
    { icon: ShieldCheck, text: 'يعمل أوفلاين في حالات انقطاع الشبكة' }
  ];

  const handleBookDemo = () => {
    // Open direct WhatsApp text to book a demo
    const phoneNumber = '201050851892'; // Professional Egyptian mobile support line
    const text = encodeURIComponent('أهلاً فارما نايل، أود استكشاف النظام وتجربة الديمو للفرع الخاص بي.');
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden font-cairo text-center">
      
      {/* Light highlights */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--glass-surface-heavy)] border border-[var(--glass-border)] backdrop-blur-md shadow-inner text-cyan-400 font-bold text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>نظام الإدارة السحابي المتكامل للصيدليات في مصر</span>
        </motion.div>

        {/* Headline */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-[var(--text-primary)] leading-[1.15] tracking-tight"
          >
            تخلص من فوضى الجرد وأدر صيدليتك بنظام <span className="nile-gradient-text">سحابي مرن</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[var(--text-muted)] font-medium text-base sm:text-lg max-w-3xl mx-auto leading-relaxed"
          >
            ساعدنا مئات الصيادلة في مصر على أتمتة مبيعاتهم، وتتبع تواريخ الصلاحية تلقائيًا، وإدارة الفروع ونواقص الأدوية دون الحاجة لشاشات معقدة. يعمل بالكامل محليًا حتى وإن لم يتوفر اتصال بالإنترنت.
          </motion.p>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            onClick={onOpenWizard}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-[var(--text-primary)] font-extrabold text-base rounded-2xl shadow-xl hover:scale-105 active:translate-y-[2px] transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>دخول النظام وتجربة الحساب</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
          </button>

          <button
            onClick={handleBookDemo}
            className="w-full sm:w-auto px-10 py-5 bg-[var(--glass-surface-heavy)] hover:bg-[var(--nile-teal-glow)] text-gray-200 font-extrabold text-base rounded-2xl border border-[var(--glass-border)] hover:scale-105 active:translate-y-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>تواصل معنا للحصول على ديمو خاص</span>
          </button>
        </motion.div>

        {/* Trust Signals Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="pt-12 border-t border-[var(--glass-border)] grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-right"
        >
          {trustSignals.map((signal, index) => (
            <div key={index} className="flex items-center gap-2.5 bg-white/[0.02] border border-[var(--glass-border)] rounded-2xl p-4 hover:bg-white/[0.04] transition-all justify-start">
              <div className="w-9 h-9 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/10">
                <signal.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-gray-300 text-xs font-bold leading-relaxed">{signal.text}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
