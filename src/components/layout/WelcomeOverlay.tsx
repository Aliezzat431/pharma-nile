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
    const hasVisited = document.cookie.includes('pharma-nile-visited=true');
    
    if (hasVisited) {
      setIsVisible(false);
      onComplete();
      return;
    }

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
    { icon: Zap, text: 'استجابة فائقة السرعة', desc: 'أداء معزز بتقنيات Next.js 15' },
    { icon: ShieldCheck, text: 'حماية وتشفير متقدم', desc: 'تأمين كامل لبيانات المرضى والمبيعات' },
    { icon: BarChart3, text: 'ذكاء اصطناعي تحليلي', desc: 'توقعات دقيقة لحركة المخزون والأرباح' },
  ];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[var(--background)] flex flex-col items-center justify-center overflow-hidden"
      dir="rtl"
    >
      {!showContent && (
        <div className="loading-screen fixed inset-0 z-50 bg-[var(--background)] flex flex-col items-center justify-center gap-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-[var(--glass-border)] border-t-[var(--nile-teal)] rounded-full flex items-center justify-center"
          >
             <Pill className="text-[var(--nile-teal)] w-8 h-8" />
          </motion.div>
          <div className="w-64 h-1 bg-[var(--glass-surface)] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[var(--nile-teal)] neon-glow-teal"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="font-cairo text-[var(--text-muted)] text-sm tracking-[0.2em] uppercase">Initializing PharmaNile Engine...</p>
        </div>
      )}

      {}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--nile-teal-glow)] rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--royal-gold-glow)] rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full" style={{ background: 'radial-gradient(circle at center, transparent 0%, var(--background) 70%)' }} />
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
          {}
          <div className="hero-pill relative w-28 h-28">
            <div className="absolute inset-0 bg-[var(--nile-teal-glow)] blur-3xl animate-pulse" />
            <div className="w-full h-full bg-gradient-to-br from-[var(--glass-surface-heavy)] to-transparent backdrop-blur-xl border border-[var(--glass-border)] rounded-[2.5rem] flex items-center justify-center shadow-2xl overflow-hidden group">
              <Pill className="w-14 h-14 text-[var(--nile-teal)] transition-transform group-hover:scale-125" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--nile-teal-glow)] to-transparent" />
            </div>
          </div>

          {}
          <div className="text-center space-y-6">
            <div className="overflow-hidden py-2">
              <h1 
                className="text-7xl md:text-9xl font-black font-cairo tracking-tighter flex items-center justify-center gap-1 text-[var(--foreground)] text-shadow-xl"
                dir="ltr" 
              >
                {"PharmaNile".split("").map((c, i) => (
                  <span key={i} className={`char-reveal inline-block ${['N','i','l','e'].includes(c) ? 'text-[var(--nile-teal)]' : ''}`}>
                    {c}
                  </span>
                ))}
              </h1>
            </div>
            <p 
              ref={subtitleRef}
              className="text-xl md:text-3xl text-[var(--text-secondary)] font-cairo font-light max-w-3xl mx-auto leading-tight"
            >
              دليلك الذكي لإدارة الصيدليات الحديثة. <span className="text-[var(--foreground)] font-bold">بساطة التصميم وقوة الأداء.</span>
            </p>
          </div>

          {}
          <div 
            ref={featuresRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          >
            {features.map((f, i) => (
              <div 
                key={i}
                className="group relative glass-panel p-8 overflow-hidden transition-all duration-500 rounded-[2rem] hover:bg-[var(--glass-surface-heavy)]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 blur-3xl bg-[var(--royal-gold-glow)] transition-all" />
                <f.icon className="w-10 h-10 mb-4 text-[var(--royal-gold)] group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                <h3 className="text-[var(--foreground)] font-bold font-cairo text-lg mb-2">{f.text}</h3>
                <p className="text-[var(--text-muted)] font-cairo text-xs leading-relaxed">{f.desc}</p>
                <div className="absolute bottom-0 left-0 h-[2px] bg-[var(--royal-gold)] w-0 group-hover:w-full transition-all duration-700" />
              </div>
            ))}
          </div>

          {}
          <div className="flex flex-col items-center gap-6 mt-4">
            <button
              ref={btnRef}
              onClick={handleStart}
              className="group relative px-16 py-6 bg-[var(--foreground)] text-[var(--background)] font-black text-2xl rounded-3xl overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--nile-teal)] to-[var(--royal-gold)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 font-cairo tracking-tighter transition-colors group-hover:text-white">
                أهلاً بك في المستقبل
              </span>
              <ArrowRight className="relative z-10 w-6 h-6 transition-all group-hover:-translate-x-3 group-hover:text-white" />
            </button>
            
            <div className="flex items-center gap-3 text-[var(--text-inactive)]">
               <div className="w-12 h-[1px] bg-[var(--divider)]" />
               <span className="text-[10px] uppercase tracking-[0.4em] font-mono">System Integrity Verified</span>
               <div className="w-12 h-[1px] bg-[var(--divider)]" />
            </div>
          </div>
        </motion.div>
      )}

      {}
      <div className="absolute inset-x-0 h-[100px] bg-gradient-to-b from-transparent via-[var(--nile-teal-glow)] to-transparent top-0 animate-scanline pointer-events-none" />
      
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
