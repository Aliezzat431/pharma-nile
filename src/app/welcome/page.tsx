'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// Layout utils
import ScrollProgress from '@/components/welcome/ScrollProgress';
import WizardModal from '@/components/welcome/WizardModal';

// Sections
import Navbar from '@/components/welcome/Navbar';
import Hero from '@/components/welcome/Hero';
import StatsBar from '@/components/welcome/StatsBar';
import ProductShowcase from '@/components/welcome/ProductShowcase';
import InteractiveDemo from '@/components/welcome/InteractiveDemo';
import Features from '@/components/welcome/Features';
import Testimonials from '@/components/welcome/Testimonials';
import Pricing from '@/components/welcome/Pricing';
import FAQ from '@/components/welcome/FAQ';
import CTASection from '@/components/welcome/CTASection';
import Footer from '@/components/welcome/Footer';

// Why-us section data (kept inline — small enough)
import { Shield, Database, Clock, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const valueProps = [
  {
    icon: Zap,
    title: 'سرعة استجابة فائقة',
    desc: 'واجهة سريعة ومبسطة تضمن إنجاز عمليات البيع والصرف والبحث عن صنف في أقل من ثانيتين.'
  },
  {
    icon: Shield,
    title: 'حماية شاملة وتأمين متقدم',
    desc: 'تأمين كامل لبيانات العملاء، المبيعات والمخازن مع خوادم محمية بأعلى بروتوكولات الأمان.'
  },
  {
    icon: Database,
    title: 'نسخ احتياطي يومي تلقائي',
    desc: 'حفظ فوري ومستمر لنسخ قاعدة بيانات صيدليتك لضمان عدم ضياع أي فاتورة بيع أو صنف.'
  },
  {
    icon: RefreshCw,
    title: 'تحديثات مستمرة ومجانية',
    desc: 'تحصل صيدليتك على كافة التحديثات والمميزات الجديدة فور إطلاقها دون أي رسوم إضافية.'
  },
  {
    icon: Clock,
    title: 'دعم فني هندسي 24/7',
    desc: 'فريق هندسي متخصص للإجابة على استفساراتكم وحل المشاكل التقنية في أي وقت.'
  },
  {
    icon: CheckCircle2,
    title: 'سهولة إعداد ورفع البيانات',
    desc: 'أداة ذكية لاستيراد وتصنيف قوائم الأدوية والحسابات السابقة بضغطة زر دون خبرة تقنية.'
  }
];

export default function WelcomePage() {
  const searchParams = useSearchParams();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    const trigger = searchParams.get('wizard') === 'true' || searchParams.get('action') === 'select';
    if (trigger) setIsWizardOpen(true);
  }, [searchParams]);

  const openWizard = () => setIsWizardOpen(true);
  const closeWizard = () => setIsWizardOpen(false);

  return (
    <>
      {/* ── Scroll progress indicator ─────────────── */}
      <ScrollProgress />

      <div
        className="min-h-screen text-[var(--text-primary)] relative overflow-x-hidden selection:bg-blue-600 selection:text-white"
        dir="rtl"
      >
        {/* Background canvas */}
        <div className="fixed inset-0 pointer-events-none -z-20 bg-[#090d16]" />
        <div className="fixed top-[-10%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none -z-10" />
        <div className="fixed bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[130px] pointer-events-none -z-10" />

        {/* ── 1. Navigation ─────────────────────────── */}
        <Navbar onOpenWizard={openWizard} />

        {/* ── 2. Hero ───────────────────────────────── */}
        <Hero onOpenWizard={openWizard} />

        {/* ── 3. Stats counter bar ──────────────────── */}
        <StatsBar />

        {/* ── 4. Interactive product screenshots ────── */}
        <ProductShowcase />

        {/* ── 5. Guided demo tour ───────────────────── */}
        <InteractiveDemo />

        {/* ── 6. Why Choose Us ──────────────────────── */}
        <section id="why-us" className="py-20 font-cairo text-right">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
            <div className="text-center space-y-3">
              <p className="text-cyan-400 text-xs font-black uppercase tracking-widest">لماذا فارما نايل؟</p>
              <h2 className="text-3xl md:text-5xl font-black text-white">
                ما يجعل النظام مختلفاً عن غيره
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-sm font-semibold leading-relaxed">
                بنى الفريق هذا النظام خصيصاً لصيادلة مصر — من ضبط الباركود المحلي إلى دعم العمل أوفلاين في الأحياء التي تنقطع فيها الشبكة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {valueProps.map((prop, idx) => {
                const Icon = prop.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.07 }}
                    className="p-5 bg-white/[0.015] border border-white/5 hover:border-cyan-400/20 rounded-3xl transition-all duration-300 flex gap-4"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-cyan-400/10 flex items-center justify-center shrink-0 border border-cyan-400/10">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="space-y-1 text-right">
                      <h3 className="text-sm font-black text-white">{prop.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed font-semibold">{prop.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 7. Core Features Grid ─────────────────── */}
        <Features />

        {/* ── 8. Social Proof / Testimonials ───────── */}
        <Testimonials />

        {/* ── 9. Pricing Tiers ──────────────────────── */}
        <Pricing onOpenWizard={openWizard} />

        {/* ── 10. FAQ Accordion ─────────────────────── */}
        <FAQ />

        {/* ── 11. Final CTA ─────────────────────────── */}
        <CTASection onOpenWizard={openWizard} />

        {/* ── 12. Footer ────────────────────────────── */}
        <Footer />

        {/* ── Wizard modal (overlay) ────────────────── */}
        <WizardModal isOpen={isWizardOpen} onClose={closeWizard} />
      </div>
    </>
  );
}
