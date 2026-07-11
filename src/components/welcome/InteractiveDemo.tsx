'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Boxes, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Clock
} from 'lucide-react';

const TOUR_STEPS = [
  {
    id: 'dashboard',
    title: 'لوحة التحكم المركزية',
    subtitle: 'كل ما تحتاجه في شاشة واحدة',
    description: 'بمجرد دخولك، تشوف ملخصاً فورياً لمبيعات اليوم، الأرباح، نواقص المخزن، وأقرب صلاحيات منتهية. كل شيء محسوب لك مسبقاً.',
    features: ['مبيعات اليوم والريالية في وقتها', 'تنبيهات النواقص والصلاحيات', 'مقارنة أداء الأسبوع بالأسبوع السابق'],
    icon: LayoutDashboard,
    color: '#2563EB',
    mockup: 'dashboard',
  },
  {
    id: 'pos',
    title: 'كاشير البيع الفوري (POS)',
    subtitle: 'فاتورة في أقل من ثانيتين',
    description: 'شاشة بيع سريعة وبسيطة — امسح الباركود أو ابحث بالاسم والطلب يُضاف فوراً. تدعم النقد والبطاقة والآجل في نفس اللحظة.',
    features: ['باركود فوري من الكاميرا أو الماسح', 'حساب تلقائي للخصم والإجمالي', 'طباعة إيصال حراري بضغطة واحدة'],
    icon: ShoppingBag,
    color: '#06B6D4',
    mockup: 'pos',
  },
  {
    id: 'inventory',
    title: 'إدارة المخزون والجرد',
    subtitle: 'وداعاً لأخطاء الجرد اليدوي',
    description: 'نظام دفعات (Batches) متكامل لتتبع كل صنف وصلاحيته وكميته بدقة. جرد كامل للصيدلية بالموبايل والباركود في ساعتين.',
    features: ['تتبع صلاحية كل دفعة لحظة بلحظة', 'جرد سريع بالموبايل والباركود', 'تنبيه تلقائي قبل انتهاء الكمية'],
    icon: Boxes,
    color: '#22C55E',
    mockup: 'inventory',
  },
];

// --- Mini CSS Mockups ---
function DashboardMockup() {
  return (
    <div className="w-full space-y-3 text-right" dir="rtl">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'مبيعات اليوم', val: '12,450 ج.م', cls: 'text-cyan-400' },
          { label: 'صافي الأرباح', val: '3,860 ج.م', cls: 'text-emerald-400' },
          { label: 'نواقص تنبيه', val: '3 أصناف', cls: 'text-red-400' },
          { label: 'صلاحية قريبة', val: '16 علبة', cls: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 font-bold">{s.label}</p>
            <p className={`text-base font-black font-sans mt-0.5 ${s.cls}`}>{s.val}</p>
          </div>
        ))}
      </div>
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
        <p className="text-[10px] text-gray-400 font-bold">مبيعات الأسبوع</p>
        <div className="h-16 flex items-end gap-1.5">
          {[60, 45, 85, 70, 95, 80, 35].map((h, i) => (
            <div key={i} className="flex-1 bg-blue-600 rounded-t opacity-80" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-1.5">
        <p className="text-[10px] text-red-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> صلاحيات تستحق انتباهاً</p>
        {['باراسيتامول أطفال — 15 يوم', 'بروفين 600 — 30 يوم'].map((t, i) => (
          <p key={i} className="text-[10px] text-gray-400 font-semibold">{t}</p>
        ))}
      </div>
    </div>
  );
}

function POSMockup() {
  return (
    <div className="w-full space-y-3 text-right" dir="rtl">
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center gap-2">
        <div className="flex-1 h-8 bg-black/30 rounded-lg border border-white/5 flex items-center pr-3">
          <span className="text-[11px] text-gray-500">ابحث عن دواء أو امسح باركود...</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['أوجمنتين 1ج', 'بنادول إكسترا', 'كلاريتين 10م', 'أوتريفين', 'أسبرين', 'جافيسكون'].map((n, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-white font-bold">{n}</p>
            <p className="text-[10px] text-cyan-400 font-sans mt-1">{[99, 35, 42, 28, 21, 75][i]} ج.م</p>
          </div>
        ))}
      </div>
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
        {['بنادول إكسترا — ×2 = 70 ج.م', 'كونفنتين 300 — ×1 = 80 ج.م'].map((line, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <span className="text-gray-300">{line.split(' — ')[0]}</span>
            <span className="text-cyan-400 font-sans font-bold">{line.split(' = ')[1]}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-white font-bold text-xs">الإجمالي</span>
          <span className="text-cyan-400 font-black font-sans text-base">150 ج.م</span>
        </div>
        <div className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-center text-white font-bold text-xs flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          تأكيد وطباعة الفاتورة
        </div>
      </div>
    </div>
  );
}

function InventoryMockup() {
  const rows = [
    { name: 'كونكور 5 مجم', qty: '25 علبة', exp: '2028-10', cls: 'text-emerald-400' },
    { name: 'فنتولين بخاخ', qty: '2 علبة', exp: '2027-04', cls: 'text-red-400' },
    { name: 'ميلجا أقراص', qty: '85 علبة', exp: '2026-08', cls: 'text-amber-400' },
    { name: 'أوميبرازول', qty: '50 علبة', exp: '2029-01', cls: 'text-emerald-400' },
  ];
  return (
    <div className="w-full space-y-2 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400 font-bold">المخزون الحالي: <span className="text-white font-black">1,248 صنف</span></p>
        <div className="flex gap-1.5">
          <span className="px-2.5 py-1 text-[10px] bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-lg font-bold">تصدير</span>
          <span className="px-2.5 py-1 text-[10px] bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 rounded-lg font-bold">جرد</span>
        </div>
      </div>
      <div className="bg-[#090e18] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 bg-white/[0.02] border-b border-white/5 text-[9px] text-gray-500 font-bold p-2 gap-1">
          <span>الاسم</span><span>الكمية</span><span>الصلاحية</span><span>الحالة</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-4 text-[10px] p-2 gap-1 border-b border-white/[0.03] hover:bg-white/[0.01] items-center">
            <span className="text-white font-bold truncate">{r.name}</span>
            <span className="text-gray-400">{r.qty}</span>
            <span className="text-gray-500 font-mono">{r.exp}</span>
            <span className={`font-bold truncate ${r.cls}`}>
              {r.cls.includes('emerald') ? '✓ آمن' : r.cls.includes('red') ? '⚠ ناقص' : '◔ قريب'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);

  const step = TOUR_STEPS[currentStep];

  const mockups: Record<string, React.ReactNode> = {
    dashboard: <DashboardMockup />,
    pos: <POSMockup />,
    inventory: <InventoryMockup />,
  };

  return (
    <section className="py-20 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Title */}
        <div className="text-center space-y-3">
          <p className="text-cyan-400 text-xs font-black uppercase tracking-widest">جولة داخل النظام</p>
          <h2 className="text-3xl md:text-5xl font-black text-white">شوف بنفسك كيف يعمل النظام</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm font-semibold">
            جولة سريعة في أبرز شاشات فارما نايل دون الحاجة لتسجيل أو تثبيت.
          </p>
        </div>

        {/* Step Tabs */}
        <div className="flex flex-wrap justify-center gap-3">
          {TOUR_STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = currentStep === idx;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl transition-all border font-bold text-sm cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white border-cyan-400/40 shadow-lg'
                    : 'text-gray-500 border-white/5 hover:bg-white/5 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main Panel */}
        <div className="bg-white/[0.02] border border-white/8 rounded-3xl overflow-hidden shadow-2xl">

          {/* Browser chrome */}
          <div className="bg-[#080d17] px-6 py-3.5 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="bg-black/30 px-12 py-1 rounded-lg text-gray-500 text-[11px] font-mono">
              pharma-nile.cloud/dashboard
            </div>
            <Clock className="w-4 h-4 text-gray-600" />
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[420px]">

            {/* Left: Description */}
            <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6 border-b lg:border-b-0 lg:border-l border-white/5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div>
                    <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest mb-2">{step.subtitle}</p>
                    <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">{step.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed font-semibold max-w-md">{step.description}</p>
                  <ul className="space-y-3">
                    {step.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${currentStep === i ? 'w-7 bg-cyan-400' : 'w-2 bg-white/10'}`} />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentStep(Math.min(TOUR_STEPS.length - 1, currentStep + 1))}
                  disabled={currentStep === TOUR_STEPS.length - 1}
                  className="h-10 px-5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 font-bold text-xs flex items-center gap-2 disabled:opacity-20 hover:bg-cyan-400/20 transition-all cursor-pointer"
                >
                  التالي
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Live mockup */}
            <div className="p-6 lg:p-10 bg-[#070b14] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35 }}
                  className="w-full max-w-sm"
                >
                  {mockups[step.mockup]}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
