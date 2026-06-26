'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, BarChart3, Pill } from 'lucide-react';

export default function WelcomeOverlay({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // ✅ تم الإبقاء على Cookies كما طلبت
    const hasVisited = document.cookie.includes('pharma-nile-visited=true');
    
    if (hasVisited) {
      setIsVisible(false);
      onComplete();
      return;
    }

    // Loading simulation
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowContent(true), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

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
  }, [onComplete]);

  useEffect(() => {
    if (!showContent) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

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

      gsap.to('.hero-pill', {
        y: -20, rotation: 15, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [showContent]);

  const handleStart = () => {
    // ✅ حفظ الحالة في Cookie لمدة سنة
    document.cookie = "pharma-nile-visited=true; path=/; max-age=31536000"; 
    
    gsap.to(containerRef.current, {
      opacity: 0, y: -100, filter: 'blur(20px)', duration: 1.2, ease: 'expo.inOut',
      onComplete: () => {
        setIsVisible(false);
        onComplete();
      }
    });
  };

  if (!isVisible) return null;

  const features = [
    { icon: Zap, text: 'استجابة فائقة السرعة', desc: 'أداء معزز بتقنيات Next.js 15', color: 'cyan' },
    { icon: ShieldCheck, text: 'حماية وتشفير متقدم', desc: 'تأمين كامل لبيانات المرضى والمبيعات', color: 'indigo' },
    { icon: BarChart3, text: 'ذكاء اصطناعي تحليلي', desc: 'توقعات دقيقة لحركة المخزون والأرباح', color: 'amber' },
  ];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#020202] flex flex-col items-center justify-center overflow-hidden"
      dir="rtl"
    >
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
          <p className="font-cairo text-gray-500 text-sm tracking-[0.2em] uppercase">Initializing PharmaNile Engine...</p>
        </div>
      )}

      {/* Background Mesh & Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#020202_70%)]" />
      </div>

      {showContent && (
        <motion.div 
          style={{ 
            rotateX: mousePos.y,
            rotateY: -mousePos.x,
            perspective: 1000
          }}
          className="relative z-10 max-w-5xl w-full px-6 flex flex-col items-center gap-12"
        >
          {/* Hero Icon */}
          <div className="hero-pill relative w-28 h-28">
            <div className="absolute inset-0 bg-cyan-400/20 blur-3xl animate-pulse" />
            <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl border border-white/20 rounded-[2.5rem] flex items-center justify-center shadow-2xl overflow-hidden group">
              <Pill className="w-14 h-14 text-cyan-400 transition-transform group-hover:scale-125" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-400/20 to-transparent" />
            </div>
          </div>

          {/* Epic Typography - ✅ تم إضافة dir="ltr" هنا لإصلاح اتجاه النص الإنجليزي */}
          <div className="text-center space-y-6">
            <div className="overflow-hidden py-2">
              <h1 
                className="text-7xl md:text-9xl font-black font-cairo text-white tracking-tighter flex items-center justify-center gap-1"
                dir="ltr" 
              >
                {"PharmaNile".split("").map((c, i) => (
                  <span key={i} className={`char-reveal inline-block ${['N','i','l','e'].includes(c) ? 'text-cyan-400' : ''}`}>
                    {c}
                  </span>
                ))}
              </h1>
            </div>
            <p 
              ref={subtitleRef}
              className="text-xl md:text-3xl text-gray-400 font-cairo font-light max-w-3xl mx-auto leading-tight"
            >
              دليلك الذكي لإدارة الصيدليات الحديثة. <span className="text-white font-bold">بساطة التصميم وقوة الأداء.</span>
            </p>
          </div>

          {/* Features Cards */}
          <div 
            ref={featuresRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          >
            {features.map((f, i) => (
              <div 
                key={i}
                className="group relative glass-panel p-8 border-white/5 bg-white/[0.03] overflow-hidden hover:bg-white/[0.08] transition-all duration-500 rounded-[2rem]"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-${f.color}-500/10 blur-3xl group-hover:bg-${f.color}-500/20 transition-all`} />
                <f.icon className={`w-10 h-10 mb-4 text-${f.color}-400 group-hover:scale-110 group-hover:rotate-6 transition-transform`} />
                <h3 className="text-white font-bold font-cairo text-lg mb-2">{f.text}</h3>
                <p className="text-gray-500 font-cairo text-xs leading-relaxed">{f.desc}</p>
                <div className="absolute bottom-0 left-0 h-[2px] bg-cyan-400 w-0 group-hover:w-full transition-all duration-700" />
              </div>
            ))}
          </div>

          {/* CTA Box */}
          <div className="flex flex-col items-center gap-6 mt-4">
            <button
              ref={btnRef}
              onClick={handleStart}
              className="group relative px-16 py-6 bg-white text-black font-black text-2xl rounded-3xl overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-[0_20px_80px_rgba(255,255,255,0.15)] flex items-center gap-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 font-cairo tracking-tighter group-hover:text-white transition-colors">
                أهلاً بك في المستقبل
              </span>
              <ArrowRight className="relative z-10 w-6 h-6 group-hover:text-white group-hover:translate-x-[-10px] transition-all" />
            </button>
            
            <div className="flex items-center gap-3 text-gray-500">
               <div className="w-12 h-[1px] bg-white/10" />
               <span className="text-[10px] uppercase tracking-[0.4em] font-mono">System Integrity Verified</span>
               <div className="w-12 h-[1px] bg-white/10" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Scanning Line Effect */}
      <div className="absolute inset-x-0 h-[100px] bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent top-0 animate-scanline pointer-events-none" />
      
      <style jsx>{`
        @keyframes scanline {
          0% { top: -100px; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100vh; opacity: 0; }
        }
        .animate-scanline {
          animation: scanline 4s linear infinite;
        }
      `}</style>
    </div>
  );
}