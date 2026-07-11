'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'هل كاشير البيع ونقطة بيع فارما نايل تعمل بالفعل بدون إنترنت؟',
      a: 'نعم، كاشير البيع (POS) وقارئ الباركود يعملان محلياً أوفلاين بالكامل بحفظ تفاصيل فواتيرك على متصفحك أو تطبيقك. فور عودة شبكة الإنترنت وبشكل صامت في الخلفية، يقوم النظام بمطابقة وتأكيد ورفع هذه الفواتير لقاعدة البيانات السحابية وضبط الكميات تلقائياً دون أدنى شعور بالانقطاع.'
    },
    {
      q: 'هل يتوفر خيار استيراد بيانات الأدوية الحالية وصلاحياتها المتوفرة؟',
      a: 'نعم، يمكنك رفع ملفات Excel أو فواتير المشتريات بصيغة PDF. وسيتكفل محرك استيرادنا الذكي بتحليل الأسماء التجارية، الجرعات، والتركيزات ومقاطعتها لتطابق قاعدة بيانات الأدوية المسجلة بمصر تلقائياً، مما يوفر عليك أياماً من العمل والترميز اليدوي.'
    },
    {
      q: 'كيف يضمن النظام الحماية التامة للبيانات والنسخ السحابي؟',
      a: 'نحن نستخدم قواعد بيانات سحابية حديثة من Supabase محمية ببروتوكولات تشفير معقدة. كما يتم توليد نسخ احتياطية للمخازن وحركات المبيعات يومياً بانتظام، مما يعني أنه في حال تلف أو سرقة جهاز الكاشير في الصيدلية، لا يضيع شيء؛ كل ما عليك هو تسجيل الدخول من جهاز آخر واستئناف العمل.'
    },
    {
      q: 'هل يمكنني إدارة الصيدلية ومتابعة الإحصائيات والأرباح من المنزل؟',
      a: 'نعم، بما أن النظام سحابي بالكامل، يمكنك كمالك أو مدير فرع فتح لوحة التحكم، ومطالعة حركات الوردية، ومراجعة سجلات البيع، ومعاينة النواقص من هاتفك أو اللابتوب الخاص بك من أي مكان دون الحاجة للتواجد داخل الصيدلية.'
    },
    {
      q: 'ما هي الأجهزة والطابعات التي يدعمها فارما نايل؟',
      a: 'النظام يدعم أجهزة الكمبيوتر المكتبية، اللابتوب، والأجهزة اللوحية (Windows, macOS, Linux). كما يتكامل تلقائياً مع طابعات الفواتير الحرارية 80 مم و 58 مم من كافة المصنعين، قارئات الباركود السلكية واللاسلكية، دون الحاجة لتثبيت برامج تشغيل معقدة.'
    }
  ];

  return (
    <section id="faq" className="py-20 relative font-cairo text-right">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-white">الأسئلة الأكثر شيوعاً</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base font-semibold">
            إجابات شافية لأبرز الأسئلة والتفاصيل لتسهيل انتقال صيدلتك لمنظومة فارما نايل الذكية.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="bg-white/[0.015] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-right font-bold text-white text-sm sm:text-base gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-5 pt-1 text-gray-450 font-semibold text-xs sm:text-sm leading-relaxed border-t border-white/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
