'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BarChart3, Pill } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Loading simulation for dramatic effect
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowContent(true), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 25);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!showContent) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Cinematic Reveal
      tl.to(".loading-screen", { opacity: 0, duration: 1, ease: "power4.inOut" });
      
      tl.fromTo(containerRef.current, 
        { opacity: 0, scale: 1.1 }, 
        { opacity: 1, scale: 1, duration: 2, ease: 'expo.out' },
        "-=0.5"
      );

      // Creative Title Reveal
      tl.fromTo(".char-reveal",
        { y: 100, opacity: 0, rotateX: -90 },
        { y: 0, opacity: 1, rotateX: 0, duration: 1.2, stagger: 0.05, ease: 'expo.out' },
        '-=1.5'
      );

      tl.fromTo(subtitleRef.current,
        { y: 30, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out' },
        '-=1'
      );

      if (featuresRef.current) {
        tl.fromTo(featuresRef.current.children,
          { opacity: 0, y: 40, rotateY: 45 },
          { opacity: 1, y: 0, rotateY: 0, duration: 1, stagger: 0.2, ease: 'power4.out' },
          '-=0.8'
        );
      }

      tl.fromTo(btnRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'back.out(2)' },
        '-=0.5'
      );

      // Infinite floating loop
      gsap.to('.hero-pill', {
        y: -15,
        rotation: 10,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [showContent]);

  const handleStart = () => {
    document.cookie = "pharma-nile-visited=true; path=/; max-age=31536000"; // 1 year expiration
    
    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 1.2,
      filter: 'blur(20px)',
      duration: 1,
      ease: 'expo.inOut',
      onComplete: () => {
        router.push('/auth/login');
      }
    });
  };

  const features = [
    { icon: Zap, text: 'استجابة فائقة السرعة', desc: 'أداء معزز بتقنيات Next.js 15', color: 'cyan' },
    { icon: ShieldCheck, text: 'حماية وتشفير متقدم', desc: 'تأمين كامل لبيانات المرضى والمبيعات', color: 'indigo' },
    { icon: BarChart3, text: 'ذكاء اصطناعي تحليلي', desc: 'توقعات دقيقة لحركة المخزون والأرباح', color: 'amber' },
  ];

  return (
    <main 
      ref={containerRef}
      className="min-h-screen bg-[#020202] flex flex-col items-center justify-center overflow-hidden"
      dir="rtl"
    >
      {/* Loading Phase */}
      {!showContent && (
        <div className="loading-screen fixed inset-0 z-50 bg-[#020202] flex flex-col items-center justify-center gap-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-white/5 border-t-cyan-400 rounded-full flex items-center justify-center"
          >
             <Pill className="text-cyan-400 w-8 h-8" />
          </motion.div>
          <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="font-cairo text-gray-500 text-xs tracking-[0.3em] uppercase">Initialising PharmaNile OS v2.0</p>
        </div>
      )}

      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {showContent && (
        <motion.div 
          style={{ 
            rotateX: mousePos.y * 0.5,
            rotateY: -mousePos.x * 0.5,
            perspective: 1000
          }}
          className="relative z-10 max-w-5xl w-full px-6 flex flex-col items-center gap-10 md:gap-16"
        >
          {/* Hero Icon */}
          <div className="hero-pill relative w-24 h-24 md:w-32 md:h-32">
            <div className="absolute inset-0 bg-cyan-400/20 blur-3xl animate-pulse" />
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl border border-white/20 rounded-[2.5rem] flex items-center justify-center shadow-2xl overflow-hidden group">
              <Pill className="w-12 h-12 md:w-16 md:h-16 text-cyan-400 transition-transform group-hover:scale-110" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-400/10 to-transparent" />
            </div>
          </div>

          {/* Typography */}
          <div className="text-center space-y-6">
            <div className="overflow-hidden py-2">
              <h1 className="text-7xl md:text-9xl font-black font-cairo text-white tracking-tighter flex items-center justify-center gap-0.5">
                {"PharmaNile".split("").map((c, i) => (
                  <span key={i} className={`char-reveal inline-block ${c === 'N' || c === 'i' || c === 'l' || c === 'e' ? 'text-cyan-400' : ''}`}>
                    {c}
                  </span>
                ))}
              </h1>
            </div>
            <p 
              ref={subtitleRef}
              className="text-lg md:text-3xl text-gray-400 font-cairo font-light max-w-3xl mx-auto leading-relaxed"
            >
              المستقبل هنا. أدر صيدليتك بأحدث تقنيات <span className="text-white font-bold">الذكاء الاصطناعي</span> في تجربة فريدة.
            </p>
          </div>

          {/* Features Grid */}
          <div 
            ref={featuresRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full"
          >
            {features.map((f, i) => (
              <div 
                key={i}
                className="group relative glass-panel p-6 md:p-8 border-white/5 bg-white/[0.02] overflow-hidden hover:bg-white/[0.06] transition-all duration-500 rounded-[2rem] border border-white/10"
              >
                <f.icon className={`w-8 h-8 md:w-10 md:h-10 mb-4 text-cyan-400 transition-transform group-hover:scale-110`} />
                <h3 className="text-white font-bold font-cairo text-base md:text-lg mb-2">{f.text}</h3>
                <p className="text-gray-500 font-cairo text-[10px] md:text-xs leading-relaxed uppercase tracking-widest">{f.desc}</p>
                <div className="absolute bottom-0 left-0 h-[1px] bg-cyan-400/50 w-0 group-hover:w-full transition-all duration-700" />
              </div>
            ))}
          </div>

          {/* Action CTA */}
          <div className="flex flex-col items-center gap-6 mt-4">
            <button
              ref={btnRef}
              onClick={handleStart}
              className="group relative px-12 md:px-20 py-5 md:py-7 bg-white text-black font-black text-xl md:text-2xl rounded-3xl overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-[0_20px_80px_rgba(255,255,255,0.1)] flex items-center gap-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 font-cairo tracking-tighter group-hover:text-white transition-colors">
                ابدأ رحلتك الآن
              </span>
              <ArrowRight className="relative z-10 w-6 h-6 group-hover:text-white group-hover:translate-x-[-10px] transition-transform" />
            </button>
            
            <p className="text-gray-600 font-mono text-[9px] uppercase tracking-[0.5em] flex items-center gap-2">
               <Sparkles className="w-3 h-3 text-cyan-400" /> Powered by Nile Engine 2.0
            </p>
          </div>
        </motion.div>
      )}

      {/* Decorative Scanline */}
      <div className="absolute inset-x-0 h-px bg-cyan-400/20 top-0 translate-y-[-100%] animate-scan pointer-events-none" />
      
      <style jsx>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(100vh); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </main>
  );
}
