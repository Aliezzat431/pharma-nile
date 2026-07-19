'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Database, Clock, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';

// ─── Lazy-loaded components (cut initial bundle) ─────────────────────────────
const ScrollProgress = lazy(() => import('@/components/welcome/ScrollProgress'));
const WizardModal = lazy(() => import('@/components/welcome/WizardModal'));
const FloatingWhatsApp = lazy(() => import('@/components/welcome/FloatingWhatsApp'));
const BackToTop = lazy(() => import('@/components/welcome/BackToTop'));
const Navbar = lazy(() => import('@/components/welcome/Navbar'));
const Hero = lazy(() => import('@/components/welcome/Hero'));
const StatsBar = lazy(() => import('@/components/welcome/StatsBar'));
const ProductShowcase = lazy(() => import('@/components/welcome/ProductShowcase'));
const InteractiveDemo = lazy(() => import('@/components/welcome/InteractiveDemo'));
const Features = lazy(() => import('@/components/welcome/Features'));
const Testimonials = lazy(() => import('@/components/welcome/Testimonials'));
const Pricing = lazy(() => import('@/components/welcome/Pricing'));
const FAQ = lazy(() => import('@/components/welcome/FAQ'));
const ContactSection = lazy(() => import('@/components/welcome/ContactSection'));
const CTASection = lazy(() => import('@/components/welcome/CTASection'));
const Footer = lazy(() => import('@/components/welcome/Footer'));

// ─── Why-us data ───────────────────────────────────────────────────────────────
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

// ─── Loading fallback ──────────────────────────────────────────────────────────
function SectionLoader() {
  return (
    <div className="w-full py-12 flex justify-center">
      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function WelcomePage() {
  const searchParams = useSearchParams();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const trigger = searchParams.get('wizard') === 'true' || searchParams.get('action') === 'select';
    if (trigger) setIsWizardOpen(true);
  }, [searchParams]);

  const openWizard = () => setIsWizardOpen(true);
  const closeWizard = () => setIsWizardOpen(false);

  return (
    <>
      {/* ── Scroll progress ──────────────────────── */}
      <Suspense fallback={null}>
        <ScrollProgress />
      </Suspense>

      <div
        className="min-h-screen text-[var(--text-primary)] relative overflow-x-hidden selection:bg-blue-600 selection:text-white"
        dir="rtl"
      >
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none -z-20 bg-[#090d16]" />
        <div className="fixed top-[-10%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none -z-10" />
        <div className="fixed bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[130px] pointer-events-none -z-10" />

        {/* ── 1. Navbar ───────────────────────────── */}
        <Suspense fallback={<div className="h-20" />}>
          <Navbar onOpenWizard={openWizard} />
        </Suspense>

        {/* ── 2. Hero ──────────────────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <Hero onOpenWizard={openWizard} />
        </Suspense>

        {/* ── 3. Stats ─────────────────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <StatsBar />
        </Suspense>

        {/* ── 4. Product Showcase ──────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <ProductShowcase />
        </Suspense>

        {/* ── 5. Interactive Demo ──────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <InteractiveDemo />
        </Suspense>

        {/* ── 6. Why Us ────────────────────────────── */}
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
                    className="p-5 bg-white/[0.015] border border-[var(--glass-border)] hover:border-cyan-400/20 rounded-3xl transition-all duration-300 flex gap-4"
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

        {/* ── 7. Features ──────────────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <Features />
        </Suspense>

        {/* ── 8. Testimonials ──────────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <Testimonials />
        </Suspense>

        {/* ── 9. Pricing ───────────────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <Pricing onOpenWizard={openWizard} />
        </Suspense>

        {/* ── 10. FAQ ──────────────────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <FAQ />
        </Suspense>

        {/* ── 11. Contact ──────────────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <ContactSection />
        </Suspense>

        {/* ── 12. Final CTA ────────────────────────── */}
        <Suspense fallback={<SectionLoader />}>
          <CTASection onOpenWizard={openWizard} />
        </Suspense>

        {/* ── 13. Footer ───────────────────────────── */}
        <Suspense fallback={<div className="h-40" />}>
          <Footer />
        </Suspense>

        {/* ── Wizard modal ─────────────────────────── */}
        <Suspense fallback={null}>
          <WizardModal isOpen={isWizardOpen} onClose={closeWizard} />
        </Suspense>

        {/* ── Floating WhatsApp ────────────────────── */}
        <Suspense fallback={null}>
          <FloatingWhatsApp />
        </Suspense>

        {/* ── Back to top ──────────────────────────── */}
        <Suspense fallback={null}>
          <BackToTop />
        </Suspense>
      </div>
    </>
  );
}