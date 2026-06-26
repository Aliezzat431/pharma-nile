'use client';

import { motion, useScroll } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  LayoutDashboard, 
  ShoppingBag, 
  Boxes, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  History,
  Sparkles,
  Play,
  Globe,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import InteractiveDemo from '@/components/welcome/InteractiveDemo';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function WelcomePage() {
  const targetRef = useRef(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false); // حالة فتح مودال الفيديو
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const features = [
    {
      title: "لوحة تحكم ذكية",
      description: "مركز قيادة متكامل بيعرض لك مبيعاتك ونواقصك وكل حركة في صيدليتك في لحظتها.",
      icon: LayoutDashboard,
      color: "var(--nile-teal)",
      detail: "تحليلات لحظية + مراقبة الفروع"
    },
    {
      title: "شاشة بيع بريميوم",
      description: "أسرع شاشة بيع (POS) بتدعم الباركود، الكاش، الآجل والروشتات بلمسة واحدة.",
      icon: ShoppingBag,
      color: "var(--royal-gold)",
      detail: "دعم الباركود + إدارة الديون"
    },
    {
      title: "إدارة المخزن الذكي",
      description: "نظام ذكي بينبهك بالنواقص وتواريخ الصلاحية قبل ما تخلص بكتير.",
      icon: Boxes,
      color: "var(--nile-teal)",
      detail: "تنبيهات تلقائية + جرد سريع"
    },
    {
      title: "تقارير مالية دقيقة",
      description: "تحليل كامل للأرباح، السيولة، والديون عشان تعرف مشروعك بيكبر إزاي.",
      icon: BarChart3,
      color: "var(--royal-gold)",
      detail: "كشوف حسابات + صافي الربح"
    }
  ];

  const comparisons = [
     { trait: "سرعة الأداء", traditional: "بطيء وبيهنج كتير", pharma: "فائق السرعة (Premium OS)" },
     { trait: "سهولة الاستخدام", traditional: "محتاج تدريب شهور", pharma: "سهل كأنك بتستخدم موبايلك" },
     { trait: "مراقبة الفروع", traditional: "صعبة ومكلفة", pharma: "كل فروعك في جيبك" },
     { trait: "الدعم الفني", traditional: "معدوم أو بطيء", pharma: "معاك ٢٤ ساعة" }
  ];

  const highlights = [
    "قاعده بيانات تحتوي على اكثر من ٢٥ ألف صنف مدخل مسبقاً",
    "نظام حماية وتشفير بيانات عالمي",
    "تحديثات دورية مجانية وتلقائية",
    "دعم كامل لضريبة القيمة المضافة والفاتورة الإلكترونية"
  ];

  return (
    <div ref={targetRef} className="min-h-screen bg-[var(--background)] text-white font-cairo overflow-hidden relative selection:bg-[var(--nile-teal)]/30" dir="rtl">
      
      {}
      <header className="fixed top-0 left-0 w-full z-[100] bg-[var(--background)]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-500">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--nile-teal)] flex items-center justify-center shadow-[0_0_20px_var(--nile-teal-glow)]">
               <Sparkles className="w-6 h-6 text-black" />
            </div>
            <div className="text-xl font-black bg-gradient-to-r from-[var(--nile-teal)] to-[var(--royal-gold)] bg-clip-text text-transparent uppercase tracking-tight">PharmaNile</div>
         </div>
         
         <div className="flex items-center gap-4">
            <ThemeToggle align="left" />
            <Link href="/auth/login" className="hidden md:block text-xs font-bold text-gray-400 hover:text-white transition-colors">دخول</Link>
            <Link 
              href="/auth/register" 
              className="px-6 py-2.5 rounded-xl bg-[var(--nile-teal)] text-black font-black text-xs hover:scale-105 transition-all shadow-[0_0_20px_var(--nile-teal-glow)]"
            >
               اشترك الآن
            </Link>
         </div>
      </header>

      {}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, -50, 0], y: [0, -50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[var(--nile-teal)]/10 rounded-full blur-[140px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1.2, 1, 1.2], x: [0, 60, 0], y: [0, 60, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-[var(--royal-gold)]/10 rounded-full blur-[120px] pointer-events-none" 
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.01] rounded-full blur-[160px] pointer-events-none" />


      {}
      <section className="relative pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 px-6 py-2 rounded-full border border-[var(--nile-teal)]/20 bg-[var(--nile-teal)]/5 backdrop-blur-xl group hover:border-[var(--nile-teal)]/40 transition-all cursor-default"
          >
            <div className="w-2 h-2 rounded-full bg-[var(--nile-teal)] animate-pulse shadow-[0_0_10px_var(--nile-teal)]" />
            <span className="text-xs font-bold text-[var(--nile-teal)] uppercase tracking-[0.2em]">The Future of Pharmacy</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-black mb-10 leading-[1.1] tracking-tight"
          >
            أهلاً بك في <br />
            <span className="bg-gradient-to-r from-[var(--nile-teal)] to-[var(--royal-gold)] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,206,209,0.2)]">PharmaNile</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mb-14 leading-relaxed font-medium"
          >
            حول مشروعك لكيان تكنولوجي متطور مع <span className="text-white font-bold">PharmaNile Premium OS</span>. النظام اللي بيفهمك وبيساعدك تطور شغلك كل يوم.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 z-10"
          >
            <Link href="/auth/login">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 206, 209, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-[var(--nile-teal)] text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(0,206,209,0.2)]"
              >
                ابدأ رحلتك مجاناً
              </motion.button>
            </Link>
            <motion.button 
              onClick={() => setIsVideoOpen(true)}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 glass-card font-bold text-lg rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/10"
            >
              <Play className="w-5 h-5 text-[var(--nile-teal)] fill-[var(--nile-teal)]" />
              اتفرج على فيديو الشرح
            </motion.button>
          </motion.div>
        </div>
      </section>

      {}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "دقة حسابية", val: "100%", icon: ShieldCheck, col: "text-[var(--nile-teal)]" },
             { label: "سرعة تلبية", val: "0.2s", icon: Zap, col: "text-[var(--royal-gold)]" },
             { label: "تحليل فوري", val: "Real-time", icon: BarChart3, col: "text-[var(--nile-teal)]" },
             { label: "تغطية كاملة", val: "24/7", icon: Globe, col: "text-[var(--royal-gold)]" }
           ].map((s, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="glass-card p-6 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-all border border-white/5 rounded-2xl"
             >
               <s.icon className={`w-6 h-6 mb-3 ${s.col} group-hover:scale-125 transition-transform`} />
               <div className="text-2xl font-black mb-1">{s.val}</div>
               <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{s.label}</div>
             </motion.div>
           ))}
        </div>
      </section>

      {}
      <section className="py-24 px-6 relative overflow-hidden bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">مميزات بتخلك <br /><span className="text-[var(--nile-teal)]">سابق الكل بكتير</span></h2>
              <div className="w-24 h-1.5 bg-gradient-to-l from-[var(--nile-teal)] to-[var(--royal-gold)] rounded-full" />
            </div>
            <p className="text-gray-400 max-w-md text-lg">
              ركزنا على التفاصيل اللي بتفرق في يومك كصيدلي.. صممنا النظام ده عشان يكون شريكك مش مجرد برنامج.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="glass-card p-10 group hover:border-[var(--nile-teal)]/30 transition-all duration-500 flex flex-col h-full border border-white/5 rounded-2xl"
              >
                <div className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform duration-500 shadow-xl" style={{ color: f.color }}>
                  <f.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black mb-4 group-hover:text-[var(--nile-teal)] transition-colors">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-auto">
                  {f.description}
                </p>
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                   <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                      {f.detail}
                   </div>
                   <button 
                      onClick={() => {
                        const el = document.getElementById('live-demo');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-[10px] font-bold text-[var(--nile-teal)] hover:underline cursor-pointer"
                   >
                      جرب القسم الآن ←
                   </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {}
      <section id="live-demo" className="bg-black/20">
        <div className="text-center pt-24 -mb-16">
          <h2 className="text-5xl font-black mb-6">جولة داخل <span className="nile-gradient-text">عالم فارما نايل</span></h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">اكتشف القوة الكامنة خلف كل ركن في صيدليتك مع تجربة تفاعلية تستعرض لك أهم أسرار النظام.</p>
        </div>
        <InteractiveDemo />
      </section>

      {}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold mb-10">لسه عاوز تشوف أكتر؟ <br /><span className="text-[var(--royal-gold)]">خد جولة بصرية سريعة</span></h2>
            <div className="max-w-4xl w-full">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="glass-panel p-3 shadow-2xl relative z-10 border-white/10"
              >
                <div className="bg-[#111] rounded-2xl overflow-hidden aspect-[16/10] border border-white/5 relative group">
                   <img 
                      src="/images/dashboard-preview.png" 
                      alt="PharmaNile Dashboard" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
                   />
                   <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="w-20 h-20 rounded-full bg-[var(--nile-teal)] flex items-center justify-center shadow-[0_0_40px_rgba(0,206,209,0.5)]"
                      >
                        <Play className="w-8 h-8 text-black fill-black mr-1" />
                      </motion.div>
                   </div>
                </div>
              </motion.div>
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-[var(--nile-teal)]/30 rounded-full blur-[100px]" />
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-[var(--royal-gold)]/30 rounded-full blur-[100px]" />
            </div>
          </div>
      </section>

      {}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">الفرق بين <span className="text-[var(--nile-teal)]">الماضي</span> و <span className="text-[var(--royal-gold)]">المستقبل</span></h2>
            <p className="text-gray-500">لماذا يختار 9 من كل 10 صيادلة PharmaNile؟</p>
          </div>

          <div className="glass-card overflow-hidden border border-white/5 rounded-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-6 font-black text-gray-400 uppercase text-xs tracking-widest border-r border-white/5">الصفة</th>
                  <th className="p-6 font-black text-gray-400 uppercase text-xs tracking-widest border-r border-white/5">الأنظمة التقليدية</th>
                  <th className="p-6 font-black text-[var(--nile-teal)] uppercase text-xs tracking-widest">PharmaNile OS</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold">
                {comparisons.map((c, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-6 border-r border-white/5 text-gray-300">{c.trait}</td>
                    <td className="p-6 border-r border-white/5 text-gray-600 flex items-center gap-2">
                       <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                       <span>{c.traditional}</span>
                    </td>
                    <td className="p-6 text-white flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-[var(--nile-teal)] flex-shrink-0" />
                       <span>{c.pharma}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto glass-card p-16 text-center relative overflow-hidden group border border-white/5 rounded-3xl">
          <div className="relative z-10 flex flex-col items-center">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="w-24 h-24 mb-10 border-2 border-dashed border-[var(--nile-teal)]/30 rounded-full flex items-center justify-center"
            >
               <Cpu className="w-10 h-10 text-[var(--nile-teal)]" />
            </motion.div>
            
            <h2 className="text-5xl font-black mb-8">حان وقت <br /><span className="text-[var(--nile-teal)]">التحول الرقمي</span></h2>
            <p className="text-gray-400 mb-12 text-xl max-w-2xl leading-relaxed">
               متخليش صيدليتك متأخرة عن العصر. انضم للجيل الجديد من الصيادلة اللي بيستخدموا <span className="text-white font-bold">PharmaNile Premium OS</span> النهاردة.
            </p>
            
            <Link href="/auth/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-16 py-6 bg-white text-black font-black text-xl rounded-2xl flex items-center gap-4 shadow-2xl transition-all"
              >
                سجل صيدليتك الآن
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
            </Link>
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-bl from-[var(--nile-teal)]/10 to-transparent pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[var(--royal-gold)]/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
      </section>

      {}
      {isVideoOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f0f0f] p-2 border border-white/10 rounded-3xl w-full max-w-4xl aspect-[16/9] relative shadow-2xl"
          >
            <button 
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-12 left-0 text-white font-bold bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all"
            >
              إغلاق الفتحة ✕
            </button>
            {}
            <iframe 
              className="w-full h-full rounded-2xl"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
              title="PharmaNile Video Explainer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </motion.div>
        </div>
      )}

      {}
      <footer className="py-16 border-t border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-right">
           <div className="space-y-4">
              <div className="text-xl font-black bg-gradient-to-r from-[var(--nile-teal)] to-[var(--royal-gold)] bg-clip-text text-transparent uppercase">PharmaNile</div>
              <p className="text-gray-500 text-xs leading-relaxed">
                 الجيل القادم من أنظمة إدارة الصيدليات في مصر والشرق الأوسط. بريميوم، سريع، وآمن.
              </p>
           </div>
           <div>
              <h4 className="text-sm font-black mb-6 uppercase text-gray-400">النظام</h4>
              <ul className="space-y-4 text-xs font-bold text-gray-500">
                 <li className="hover:text-white cursor-pointer transition-colors">شاشة البيع POS</li>
                 <li className="hover:text-white cursor-pointer transition-colors">إدارة المخزن</li>
                 <li className="hover:text-white cursor-pointer transition-colors">التقارير المالية</li>
                 <li className="hover:text-white cursor-pointer transition-colors">إدارة الفروع</li>
              </ul>
           </div>
           <div>
              <h4 className="text-sm font-black mb-6 uppercase text-gray-400">الدعم</h4>
              <ul className="space-y-4 text-xs font-bold text-gray-500">
                 <li className="hover:text-white cursor-pointer transition-colors">مركز المساعدة</li>
                 <li className="hover:text-white cursor-pointer transition-colors">اتصل بنا</li>
                 <li className="hover:text-white cursor-pointer transition-colors">الأسئلة الشائعة</li>
                 <li className="hover:text-white cursor-pointer transition-colors">التحديثات</li>
              </ul>
           </div>
           <div>
              <h4 className="text-sm font-black mb-6 uppercase text-gray-400">تواصل معنا</h4>
              <div className="text-xs font-bold text-[var(--nile-teal)] mb-2 font-inter" dir="ltr">+20 114 697 1208</div>
              <div className="text-xs font-bold text-gray-500">aliezzat02222@gmai.com</div>
           </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-[10px] font-bold text-gray-600">© 2026 PharmaNile Premium OS. All rights reserved.</p>
           <div className="flex gap-6 text-[10px] font-bold text-gray-600">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
