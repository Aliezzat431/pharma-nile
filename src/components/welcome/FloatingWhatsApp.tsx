'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone, ChevronDown } from 'lucide-react';

const WHATSAPP_NUMBER = '201146971208';
const MESSAGES = [
  'أهلاً، أود استفسار عن أسعار الاشتراك.',
  'أريد تجربة ديمو لنظام فارما نايل.',
  'عندي صيدلية وأريد معرفة المزيد عن النظام.',
  'هل يمكنني الاشتراك بدون عقد؟',
];

export default function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Show the bubble greeting after 6 seconds
  useEffect(() => {
    const t1 = setTimeout(() => setShowBubble(true), 6000);
    const t2 = setTimeout(() => setPulse(false), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const send = (msg: string) => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3 font-cairo" dir="rtl">

      {/* Greeting bubble */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="bg-[#1a2332] border border-white/10 rounded-2xl rounded-br-sm p-3.5 shadow-2xl max-w-[220px] text-right relative"
          >
            <button
              onClick={() => setShowBubble(false)}
              className="absolute top-2 left-2 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="text-white text-xs font-bold leading-relaxed">
              👋 مرحباً! كيف نساعدك في صيدليتك؟
            </p>
            <p className="text-gray-400 text-[10px] font-semibold mt-1">
              فريق الدعم متاح الآن ◎
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick replies panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-[265px]"
          >
            {/* Panel header */}
            <div className="flex items-center gap-3 p-4 bg-emerald-600 text-white">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="text-right flex-1">
                <p className="font-black text-sm">فارما نايل</p>
                <p className="text-emerald-200 text-[10px] font-semibold">متاح للرد الآن ●</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Greeting bubble */}
            <div className="p-4 border-b border-white/5">
              <div className="bg-white/[0.05] rounded-2xl rounded-tr-sm p-3 text-right max-w-[200px] mr-auto">
                <p className="text-white text-xs font-semibold leading-relaxed">
                  مرحباً! 👋 كيف يمكنني مساعدتك اليوم؟ اختر أحد الخيارات أدناه:
                </p>
              </div>
            </div>

            {/* Quick message options */}
            <div className="p-3 space-y-2">
              {MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => send(msg)}
                  className="w-full text-right px-3.5 py-2.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  {msg}
                </button>
              ))}
            </div>

            {/* Direct number */}
            <div className="px-4 pb-4 pt-1 flex items-center gap-2 text-gray-500 text-[10px] font-semibold">
              <Phone className="w-3 h-3 text-gray-600" />
              <a href="tel:+201050851892" dir="ltr" className="hover:text-gray-300 transition-colors">
                +20 105 085 1892
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => { setIsOpen(p => !p); setShowBubble(false); }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        className="relative w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-xl shadow-emerald-500/30 flex items-center justify-center text-white cursor-pointer transition-colors"
        aria-label="تواصل عبر واتساب"
      >
        {/* Pulse ring */}
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
        )}
        <MessageCircle className="w-6 h-6 relative z-10" />
      </motion.button>

    </div>
  );
}
