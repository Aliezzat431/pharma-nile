'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Phone } from 'lucide-react';

interface CTASectionProps {
  onOpenWizard: () => void;
}

export default function CTASection({ onOpenWizard }: CTASectionProps) {
  const handleWhatsApp = () => {
    const text = encodeURIComponent('أهلاً فارما نايل، أود استكشاف النظام وتجربة الديمو للفرع الخاص بي.');
    window.open(`https://wa.me/201146971208?text=${text}`, '_blank');
  };

  return (
    <section className="py-24 relative overflow-hidden font-cairo" dir="rtl">

      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[60vh] rounded-full bg-blue-600/8 blur-[100px]" />
        <div className="absolute top-0 right-0 w-[35vw] h-[35vw] rounded-full bg-cyan-500/5 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[35vw] h-[35vw] rounded-full bg-blue-700/5 blur-[80px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            متاح الآن — ابدأ خلال دقائق
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
              صيدليتك تستحق نظاماً
              <br />
              <span className="nile-gradient-text">يعمل بجد مثلك</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg font-semibold max-w-2xl mx-auto leading-relaxed">
              انضم إلى أكثر من 500 صيدلاني في مصر اختاروا فارما نايل لتنظيم أعمالهم. 14 يوماً تجربة مجانية كاملة — بدون بيانات بنك أو أي التزام مسبق.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <motion.button
              onClick={onOpenWizard}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-base rounded-2xl shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <span>ابدأ التجربة المجانية الآن</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              onClick={handleWhatsApp}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-10 py-5 bg-white/[0.04] hover:bg-white/[0.08] text-white font-extrabold text-base rounded-2xl border border-white/10 flex items-center justify-center gap-2.5 cursor-pointer transition-all"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <span>تواصل واتساب مباشرة</span>
            </motion.button>
          </div>

          {/* Micro trust reassurance */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-2 text-gray-500 text-xs font-semibold">
            {[
              '✓ لا توجد رسوم خفية',
              '✓ إلغاء الاشتراك في أي وقت',
              '✓ دعم فني مستمر خلال التجربة',
            ].map((t, i) => (
              <span key={i} className="whitespace-nowrap">{t}</span>
            ))}
          </div>

          {/* Phone direct */}
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm pt-2">
            <Phone className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">أو اتصل مباشرة:</span>
            <a
              href="tel:+201050851892"
              className="text-cyan-400 font-black hover:text-cyan-300 transition-colors font-sans"
              dir="ltr"
            >
              +20 105 085 1892
            </a>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
