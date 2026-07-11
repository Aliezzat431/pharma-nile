'use client';

import { useState } from 'react';
import { Check, Zap, Star, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PricingProps {
  onOpenWizard: () => void;
}

const plans = [
  {
    name: 'الخطة الفردية',
    subtitle: 'لصيدلية واحدة',
    desc: 'مثالية للصيدليات والمستوصفات الصغيرة التي تدير فرعاً واحداً.',
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      'إضافة حتى 5,000 صنف دواء بنشاط دائم',
      'نقطة بيع مفردة مجهزة للكاشير (POS)',
      'إدارة المخزن الأساسية والباركود الفوري',
      'دعم كامل للبيع بدون اتصال بالإنترنت',
      'تقارير مبيعات وجداول مبسطة ومباشرة',
      'تحديثات النظام الدورية والدعم الأساسي',
    ],
    isPopular: false,
    btnTxt: 'ابدأ التجربة المجانية',
    accentColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  {
    name: 'خطة النمو',
    subtitle: 'الأكثر طلباً',
    desc: 'الحل الشامل لنمو صيدليتك والتحكم السحابي الذكي بالصلاحيات والأدوية.',
    monthlyPrice: 199,
    yearlyPrice: 159,
    features: [
      'عدد أصناف وعناوين أدوية غير محدود في المخزن',
      'تتبع تلقائي متطور لتواريخ الصلاحية والباتشات',
      'حسابات غير محدودة للموظفين والصيادلة مع الصلاحيات',
      'قارئ باركود سريع بالكاميرا والماسح الضوئي',
      'متابعة حية وإشعارات المبيعات والنواقص على الموبايل',
      'تقارير أرباح ورسوم بيانية أسبوعية وسنوية مفصلة',
      'أولوية الدعم الهندسي المباشر متواصل 24/7',
    ],
    isPopular: true,
    btnTxt: 'ابدأ الباقة الذهبية مجاناً',
    accentColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10',
  },
  {
    name: 'خطة المؤسسات',
    subtitle: 'للسلاسل والفروع',
    desc: 'لربط فروع متعددة أو إدارة سلسلة صيدليات متكاملة سحابياً.',
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      'ربط لحظي لجميع فروع السلسلة وقاعدة البيانات',
      'لوحة تحكم مشرف عام لتحديث أسعار فروعك دفعة واحدة',
      'إمكانية نقل كميات الأدوية بين الفروع بسهولة',
      'تقارير مجمعة وفردية لكل فرع بدقة محاسبية',
      'خادم مستقل لتأمين بيانات السلسلة بالكامل',
      'مسؤول دعم فني مخصص وجلسات إطلاق وتدريب للصيادلة',
    ],
    isPopular: false,
    btnTxt: 'تواصل مع المبيعات',
    accentColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
  },
];

export default function Pricing({ onOpenWizard }: PricingProps) {
  const [isYearly, setIsYearly] = useState(false);

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null) {
      // Enterprise — open WhatsApp
      const text = encodeURIComponent('أهلاً فارما نايل، أود الاستفسار عن خطة المؤسسات والسلاسل.');
      window.open(`https://wa.me/201050851892?text=${text}`, '_blank');
    } else {
      onOpenWizard();
    }
  };

  return (
    <section id="pricing" className="py-20 bg-black/10 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Title */}
        <div className="text-center space-y-4">
          <p className="text-cyan-400 text-xs font-black uppercase tracking-widest">خطط الاشتراك</p>
          <h2 className="text-3xl md:text-5xl font-black text-white">
            خطط أسعار واضحة تناسب حجم أعمالك
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base font-semibold">
            ابدأ صيدليتك الآن بفترة تجريبية مجانية 14 يوماً كاملة الخصائص والمميزات، دون بيانات دفع بنكية.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm font-bold transition-colors ${!isYearly ? 'text-white' : 'text-gray-500'}`}>
              شهري
            </span>
            <button
              onClick={() => setIsYearly(v => !v)}
              className={`relative w-14 h-7 rounded-full border transition-all duration-300 focus:outline-none cursor-pointer ${
                isYearly
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 border-cyan-500/40'
                  : 'bg-white/5 border-white/10'
              }`}
              role="switch"
              aria-checked={isYearly}
            >
              <span
                className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                  isYearly ? 'right-[3px]' : 'left-[3px]'
                }`}
              />
            </button>
            <span className={`text-sm font-bold transition-colors flex items-center gap-2 ${isYearly ? 'text-white' : 'text-gray-500'}`}>
              سنوي
              <AnimatePresence>
                {isYearly && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black"
                  >
                    وفر 20%
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </div>
        </div>

        {/* Pricing Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                plan.isPopular
                  ? 'bg-gradient-to-b from-blue-950/60 to-[#0e1627]/90 border-2 border-cyan-400/60 shadow-2xl shadow-cyan-500/10'
                  : 'bg-white/[0.02] border border-white/7 hover:border-white/15 hover:bg-white/[0.03]'
              }`}
            >
              {/* Popular badge */}
              {plan.isPopular && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />
              )}
              {plan.isPopular && (
                <span className="absolute top-5 left-4 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-black rounded-xl tracking-wider uppercase select-none flex items-center gap-1.5 shadow-lg">
                  <Star className="w-3 h-3 fill-white" />
                  الأكثر مبيعاً
                </span>
              )}

              <div>
                {/* Plan Name */}
                <div className="mb-6">
                  <p className={`text-xs font-black uppercase tracking-widest mb-1 ${plan.accentColor}`}>
                    {plan.subtitle}
                  </p>
                  <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  <p className="text-gray-400 text-xs mt-2 leading-relaxed font-semibold">{plan.desc}</p>
                </div>

                {/* Price block */}
                <div className="flex items-baseline gap-1.5 pb-6 border-b border-white/7">
                  {plan.monthlyPrice !== null ? (
                    <div className="flex items-baseline gap-2">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={isYearly ? 'yearly' : 'monthly'}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="text-4xl sm:text-5xl font-black font-sans text-white"
                        >
                          {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-xs text-gray-500 font-bold">ج.م / شهرياً</span>
                      {isYearly && (
                        <span className="text-[10px] text-gray-500 line-through font-bold font-sans">
                          {plan.monthlyPrice}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-3xl sm:text-4xl font-black text-white">تواصل معنا</span>
                  )}
                </div>

                {/* Features list */}
                <ul className="space-y-3.5 my-8 text-xs font-semibold">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-gray-300 leading-relaxed">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.accentColor}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white shadow-xl shadow-blue-500/20'
                    : plan.monthlyPrice === null
                    ? 'bg-white/5 hover:bg-emerald-500/10 text-white border border-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-400'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {plan.monthlyPrice === null && <MessageCircle className="w-4 h-4 text-emerald-400" />}
                {plan.isPopular && <Zap className="w-4 h-4" />}
                {plan.btnTxt}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Bottom trust note */}
        <p className="text-center text-gray-500 text-xs font-semibold">
          ✓ لا توجد رسوم خفية &nbsp;·&nbsp; ✓ إلغاء الاشتراك في أي وقت &nbsp;·&nbsp; ✓ 14 يوم تجربة مجانية كاملة
        </p>

      </div>
    </section>
  );
}
