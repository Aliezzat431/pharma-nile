'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, ChevronRight, ChevronLeft } from 'lucide-react';

// فاضية عشان لسه محدش جرب النظام — هنضيف تقييمات حقيقية بعد الإطلاق
const testimonials = [
  {
    name: '______________',
    role: '______________',
    initials: '___',
    color: 'from-blue-600 to-cyan-500',
    stars: 5,
    text: '___________________________',
  },
  {
    name: '______________',
    role: '______________',
    initials: '___',
    color: 'from-purple-600 to-pink-500',
    stars: 5,
    text: '___________________________',
  },
  {
    name: '______________',
    role: '______________',
    initials: '___',
    color: 'from-emerald-600 to-teal-500',
    stars: 5,
    text: '___________________________',
  },
  {
    name: '______________',
    role: '______________',
    initials: '___',
    color: 'from-amber-500 to-orange-500',
    stars: 5,
    text: '___________________________',
  },
  {
    name: '______________',
    role: '______________',
    initials: '___',
    color: 'from-cyan-600 to-blue-500',
    stars: 5,
    text: '___________________________',
  },
];

function TestimonialCard({ testimonial, isActive }: { testimonial: typeof testimonials[0]; isActive: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: isActive ? 1 : 0.4, scale: isActive ? 1 : 0.96 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.4 }}
      className={`bg-white/[0.025] border rounded-3xl p-7 flex flex-col gap-5 text-right font-cairo transition-all duration-300 ${
        isActive ? 'border-white/10 shadow-xl' : 'border-white/5'
      }`}
    >
      {/* Stars */}
      <div className="flex gap-1 justify-start flex-row-reverse">
        {Array.from({ length: testimonial.stars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* Quote */}
      <div className="relative">
        <Quote className="absolute -top-1 -right-1 w-8 h-8 text-cyan-400/15 rotate-180" />
        <p className="text-gray-300 text-sm leading-relaxed font-semibold pr-4">
          &ldquo;{testimonial.text}&rdquo;
        </p>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-black text-sm shrink-0`}>
          {testimonial.initials}
        </div>
        <div>
          <p className="text-white font-black text-sm">{testimonial.name}</p>
          <p className="text-gray-500 text-xs font-semibold mt-0.5">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!autoplay) return;
    intervalRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoplay, current]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    setAutoplay(false);
    setTimeout(() => setAutoplay(true), 8000);
  };

  const prev = () => goTo((current - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((current + 1) % testimonials.length);

  // Show 3 cards at a time on desktop — active + 2 neighbors
  const visible = [
    (current - 1 + testimonials.length) % testimonials.length,
    current,
    (current + 1) % testimonials.length,
  ];

  return (
    <section id="testimonials" className="py-20 relative font-cairo overflow-hidden" dir="rtl">

      {/* Subtle glow */}
      <div className="absolute top-1/2 right-0 w-[40vw] h-[40vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

        {/* Title */}
        <div className="text-center space-y-3">
          <p className="text-cyan-400 text-xs font-black uppercase tracking-widest">آراء عملائنا الفعليين</p>
          <h2 className="text-3xl md:text-5xl font-black text-white">
            قريباً .. تجارب الصيادلة مع فارما نايل
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm font-semibold">
            هننشر هنا تقييمات حقيقية من أول صيادلة يستخدموا النظام. انتظر تجربتك معانا.
          </p>
        </div>

        {/* Desktop: 3-column visible cards */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {visible.map((idx, position) => (
            <TestimonialCard
              key={testimonials[idx].name}
              testimonial={testimonials[idx]}
              isActive={position === 1}
            />
          ))}
        </div>

        {/* Mobile: single card */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <TestimonialCard testimonial={testimonials[current]} isActive={true} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
            aria-label="Previous"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === current ? 'w-8 bg-cyan-400' : 'w-2 bg-white/15 hover:bg-white/30'
                }`}
                aria-label={`Go to ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
            aria-label="Next"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
}