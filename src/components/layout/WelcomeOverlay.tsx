'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Zap, BarChart3, Pill } from 'lucide-react';

export default function WelcomeOverlay({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem('pharma-nile-visited');
    if (hasVisited) {
      setIsVisible(false);
      onComplete();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Main entrance
      tl.fromTo(containerRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 1.2, ease: 'power4.out' }
      );

      // Title animation
      tl.fromTo(titleRef.current,
        { y: 60, opacity: 0, skewY: 10 },
        { y: 0, opacity: 1, skewY: 0, duration: 1, ease: 'expo.out' },
        '-=0.8'
      );

      // Subtitle animation
      tl.fromTo(subtitleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.5'
      );

      // Features items
      if (featuresRef.current) {
        tl.fromTo(featuresRef.current.children,
          { scale: 0.8, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.7)' },
          '-=0.3'
        );
      }

      // Button pulse and entrance
      tl.fromTo(btnRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' },
        '-=0.2'
      );

      // Floating particles
      gsap.to('.particle', {
        y: 'random(-40, 40)',
        x: 'random(-40, 40)',
        rotation: 'random(-180, 180)',
        duration: 'random(3, 6)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.1
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleStart = () => {
    localStorage.setItem('pharma-nile-visited', 'true');
    
    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 1.1,
      duration: 0.8,
      ease: 'power4.in',
      onComplete: () => {
        setIsVisible(false);
        onComplete();
      }
    });
  };

  if (!isVisible) return null;

  const features = [
    { icon: Zap, text: 'سرعة البرق في الاستجابة', color: 'text-yellow-400' },
    { icon: ShieldCheck, text: 'أمان فائق لبياناتك', color: 'text-green-400' },
    { icon: BarChart3, text: 'تحليلات مدعومة بالذكاء الاصطناعي', color: 'text-blue-400' },
  ];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="particle absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="particle absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-4xl w-full px-6 text-center space-y-12">
        {/* Logo/Icon Area */}
        <div className="flex justify-center">
          <motion.div 
            animate={{ 
              rotate: [0, 10, -10, 0],
              y: [0, -10, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.3)] border border-cyan-400/20"
          >
            <Pill className="w-12 h-12 text-white" />
          </motion.div>
        </div>

        {/* Text Area */}
        <div className="space-y-6">
          <h1 
            ref={titleRef}
            className="text-6xl md:text-8xl font-bold font-cairo text-white tracking-tighter"
          >
            Pharma<span className="text-cyan-400">Nile</span>
          </h1>
          <p 
            ref={subtitleRef}
            className="text-xl md:text-2xl text-gray-400 font-cairo font-medium max-w-2xl mx-auto leading-relaxed"
          >
            المستقبل هنا. أدر صيدليتك بأحدث تقنيات الجيل الثالث والذكاء الاصطناعي في تجربة مستخدم لم تشهد لها مثيل.
          </p>
        </div>

        {/* Features Row */}
        <div 
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8"
        >
          {features.map((f, i) => (
            <div 
              key={i}
              className="glass-card p-6 border-white/5 bg-white/[0.02] flex flex-col items-center gap-4 hover:bg-white/[0.05] transition-colors group"
            >
              <f.icon className={`w-8 h-8 ${f.color} group-hover:scale-110 transition-transform`} />
              <span className="text-gray-300 font-cairo font-bold text-sm tracking-wide">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-8">
          <button
            ref={btnRef}
            onClick={handleStart}
            className="group relative px-12 py-5 bg-white text-black font-bold text-xl rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-3 font-cairo group-hover:text-white transition-colors">
              ابدأ الرحلة الآن <ArrowRight className="w-6 h-6" />
            </span>
          </button>
          
          <p className="mt-6 text-gray-600 font-cairo text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> مدعوم بتقنيات PharmaNile OS v2.0
          </p>
        </div>
      </div>

      {/* Decorative background stripes */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/5 to-transparent skew-x-12 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-purple-500/5 to-transparent skew-x-12 -translate-x-1/2" />
    </div>
  );
}
