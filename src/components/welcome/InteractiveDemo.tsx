'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Boxes, 
  Cpu,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const TOUR_STEPS = [
  {
    id: 'dashboard',
    title: "لوحة تحكم (بريميوم)",
    subtitle: "كل بياناتك في مكان واحد",
    description: "بمجرد دخولك، هتشوف ملخص ذكي لمبيعاتك، المصاريف، وصافي الأرباح في لحظتها. السيستم بيحلل لك كل حركة عشان يساعدك تاخد قرارات صح لصيدليتك.",
    features: ["تحليلات لحظية لمبيعات الفروع", "مراقبة السيولة والديون", "تقارير ذكاء اصطناعي يومية"],
    image: "/images/dashboard-preview.png",
    color: "var(--nile-teal)",
    icon: LayoutDashboard
  },
  {
    id: 'pos',
    title: "أسرع شاشة بيع (POS)",
    subtitle: "بيعة في أقل من ثانيتين",
    description: "شاشة POS تم تصميمها لتكون الأسرع في مصر. تدعم الباركود، البحث الذكي، وتقسيم الأصناف على أكثر من تشغيلة (Batches) أتوماتيكياً حسب الأقدم.",
    features: ["دعم كامل للباركود والموازين", "نظام سحب حسب الأقدم (FEFO)", "كاش، فيزا، وآجل في نفس اللحظة"],
    image: "/images/dashboard-preview.png", // Reuse placeholder or different one if available
    color: "var(--royal-gold)",
    icon: ShoppingBag
  },
  {
    id: 'inventory',
    title: "إدارة مخزن ذكية",
    subtitle: "وداعاً لأخطاء الجرد",
    description: "نظام جرد متطور بيبهرك بالدقة. بينبهك بالنواقص الموشكة على النفاذ، وبيراقب تواريخ الصلاحية لحظة بلحظة عشان مفيش صنف يضيع عليك.",
    features: ["تنبيهات فورية بانتهاء الصلاحية", "طلب نواقص تلقائي للموردين", "جرد فائق السرعة عبر الموبايل"],
    image: "/images/dashboard-preview.png",
    color: "var(--nile-teal)",
    icon: Boxes
  },
  {
    id: 'ai',
    title: "مُساعد فارما نايل (AI)",
    subtitle: "شريكك الرقمي الذكي",
    description: "أول نظام صيدليات في الشرق الأوسط مدعوم بذكاء اصطناعي (Nile-AI). بيقترح عليك أدوية بديلة، بيحلل الروشتات الصعبة، وبيساعدك في تسعير طلبياتك.",
    features: ["اقتراح بدائل الأدوية (Substitutes)", "تحليل الروشتات المكتوبة يدوياً", "توقعات ذكية لحجم المبيعات"],
    image: "/images/dashboard-preview.png",
    color: "#FF69B4",
    icon: Cpu
  }
];

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="w-full max-w-7xl mx-auto py-32 px-6 font-cairo">
      {}
      <div className="flex flex-wrap justify-center gap-4 mb-20">
         {TOUR_STEPS.map((s, idx) => (
           <button
             key={s.id}
             onClick={() => setCurrentStep(idx)}
             className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all border font-bold ${
               currentStep === idx 
               ? 'bg-white/10 text-white border-[var(--nile-teal)] shadow-[0_0_20px_rgba(0,206,209,0.2)]' 
               : 'text-gray-500 border-white/5 hover:bg-white/5'
             }`}
           >
             <s.icon className={`w-5 h-5 ${currentStep === idx ? 'text-[var(--nile-teal)]' : ''}`} />
             <span className="hidden sm:inline">{s.title}</span>
           </button>
         ))}
      </div>

      {}
      <div className="glass-panel min-h-[600px] overflow-hidden border-white/10 relative p-8 md:p-16 flex flex-col md:flex-row items-center gap-16">
        
        {}
        <div className="flex-1 space-y-8 z-10 text-right md:text-right">
           <AnimatePresence mode="wait">
             <motion.div
               key={step.id}
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -50 }}
               transition={{ duration: 0.5 }}
               className="space-y-6"
             >
                <div className="flex items-center gap-3 justify-center md:justify-start">
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5" style={{ color: step.color }}>
                      <step.icon className="w-7 h-7" />
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--royal-gold)]">{step.subtitle}</div>
                </div>

                <h3 className="text-4xl md:text-5xl font-black leading-tight text-white">
                   {step.title}
                </h3>

                <p className="text-xl text-gray-400 leading-relaxed max-w-xl">
                   {step.description}
                </p>

                <ul className="space-y-4 pt-6">
                   {step.features.map((f, i) => (
                     <li key={i} className="flex items-center gap-4 text-gray-300 font-bold group">
                        <CheckCircle2 className="w-5 h-5 text-[var(--nile-teal)] group-hover:scale-125 transition-transform" />
                        <span>{f}</span>
                     </li>
                   ))}
                </ul>
             </motion.div>
           </AnimatePresence>

           {}
           <div className="flex items-center gap-6 pt-12 justify-center md:justify-start">
              <button 
                onClick={prevStep}
                disabled={currentStep === 0}
                className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-white/10 transition-all cursor-pointer"
              >
                 <ArrowRight className="w-6 h-6" /> {}
              </button>

              <div className="flex gap-2">
                 {TOUR_STEPS.map((_, i) => (
                   <div key={i} className={`h-1.5 rounded-full transition-all ${currentStep === i ? 'w-8 bg-[var(--nile-teal)]' : 'w-2 bg-white/10'}`} />
                 ))}
              </div>

              <button 
                onClick={nextStep}
                disabled={currentStep === TOUR_STEPS.length - 1}
                className="h-14 px-8 rounded-full bg-[var(--nile-teal)] text-black font-black flex items-center gap-3 disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,206,209,0.3)] cursor-pointer"
              >
                 <span>الخطوة التالية</span>
                 <ArrowLeft className="w-5 h-5" /> {}
              </button>
           </div>
        </div>

        {}
        <div className="flex-1 w-full relative">
           <AnimatePresence mode="wait">
             <motion.div
               key={step.id}
               initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
               animate={{ opacity: 1, scale: 1, rotateY: 0 }}
               exit={{ opacity: 0, scale: 0.9, rotateY: -20 }}
               transition={{ duration: 0.7, ease: "easeOut" }}
               className="relative z-10"
             >
                <div className="glass-panel p-2 shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-700">
                   <img 
                      src={step.image} 
                      alt={step.title} 
                      className="w-full h-auto rounded-xl border border-white/10"
                   />
                </div>
                {}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-[var(--nile-teal)]/10 rounded-full blur-[80px] -z-10" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[var(--royal-gold)]/10 rounded-full blur-[80px] -z-10" />
             </motion.div>
           </AnimatePresence>

           {}
           <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-10 right-10 z-20 glass-card p-4 flex items-center gap-3 border-[var(--nile-teal)]/30 shadow-2xl"
            >
              <Sparkles className="w-5 h-5 text-[var(--nile-teal)]" />
              <div className="text-[10px] font-black text-white uppercase tracking-widest">Premium UI</div>
           </motion.div>
        </div>

        {}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black text-white/[0.02] pointer-events-none select-none uppercase tracking-tighter">
           {step.id}
        </div>
      </div>
    </div>
  );
}

