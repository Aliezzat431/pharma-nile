'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface PricingProps {
  onOpenWizard: () => void;
}

export default function Pricing({ onOpenWizard }: PricingProps) {
  
  const plans = [
    {
      name: 'الخطة الفردية (لصيدلية واحدة)',
      desc: 'مثالية للصيدليات والمستوصفات الصغيرة التي تدير فرعاً واحداً.',
      price: '99',
      features: [
        'إضافة حتى 5,000 صنف دواء بنشاط دائم',
        'نقطة بيع مفردة مجهزة للكاشير (POS)',
        'إدارة المخزن الأساسية والباركود الفوري',
        'دعم كامل للبيع بدون اتصال بالإنترنت',
        'تقارير مبيعات وجداول مبسطة ومباشرة',
        'تحديثات النظام الدورية والدعم الأساسي'
      ],
      isPopular: false,
      btnTxt: 'ابدأ التجربة المجانية'
    },
    {
      name: 'خطة النمو (الذكية والأكثر طلباً)',
      desc: 'الحل الشامل لنمو صيدليتك والتحكم السحابي الذكي بالصلاحيات والأدوية.',
      price: '199',
      features: [
        'عدد أصناف وعناوين أدوية غير محدود في المخزن',
        'تتبع تلقائي متطور لتواريخ الصلاحية والباتشات',
        'حسابات غير محدودة للموظفين والصيادلة مع الصلاحيات',
        'قارئ باركود سريع بالكاميرا والماسح الضوئي',
        'متابعة حية وإشعارات المبيعات والنواقص على الموبايل',
        'تقارير أرباح ورسوم بيانية أسبوعية وسنوية مفصلة',
        'أولوية الدعم الهندسي المباشر متواصل 24/7'
      ],
      isPopular: true,
      btnTxt: 'ابدأ الباقة الذهبية مجاناً'
    },
    {
      name: 'خطة المؤسسات والسلاسل',
      desc: 'لربط فروع متعددة أو إدارة سلسلة صيدليات متكاملة سحابياً.',
      price: 'تواصل معنا',
      features: [
        'ربط لحظي لجميع فروع السلسلة وقاعدة البيانات',
        'لوحة تحكم مشرف عام لتحديث أسعار فروعك دفعة واحدة',
        'إمكانية نقل ونقل كميات الأدوية بين الفروع بسهولة',
        'تقارير مجمعة وفردية لكل فرع بدقة محاسبية',
        'خادم مستقل لتأمين بيانات السلسلة بالكامل',
        'مسؤول دعم فني مخصص وجلسات إطلاق وتدريب للصيادلة'
      ],
      isPopular: false,
      btnTxt: 'تواصل مع المبيعات'
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-black/10 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-white">خطط أسعار واضحة تناسب حجم أعمالك</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base font-semibold">
            ابدأ صيدليتك الآن بفترة تجريبية مجانية لمدة 14 يوماً كاملة الخصائص والمميزات، دون الحاجة لبيانات الدفع البنكية.
          </p>
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
                  ? 'bg-gradient-to-b from-blue-950/40 to-[#0e1627]/80 border-2 border-cyan-400 shadow-2xl shadow-blue-500/5' 
                  : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-cyan-400 text-black text-[10px] font-black rounded-lg tracking-wider uppercase select-none">
                  الأكثر مبيعاً ⭐
                </span>
              )}

              <div>
                <h3 className="text-lg font-black text-white">{plan.name}</h3>
                <p className="text-gray-400 text-xs mt-2 leading-relaxed mb-6 font-semibold">{plan.desc}</p>
                
                {/* Price block */}
                <div className="flex items-baseline gap-1.5 pb-6 border-b border-white/5">
                  {plan.price !== 'تواصل معنا' ? (
                    <>
                      <span className="text-4xl sm:text-5xl font-black font-sans text-white">{plan.price}</span>
                      <span className="text-xs text-gray-500 font-bold">ج.م / شهرياً</span>
                    </>
                  ) : (
                    <span className="text-3xl sm:text-4xl font-black text-white">{plan.price}</span>
                  )}
                </div>

                {/* Features list */}
                <ul className="space-y-3.5 my-8 text-xs font-semibold">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-gray-300 leading-relaxed">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onOpenWizard}
                className={`w-full py-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 active:scale-97 cursor-pointer ${
                  plan.isPopular 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white shadow-xl' 
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {plan.btnTxt}
              </button>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
