'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle, Clock, ArrowLeft } from 'lucide-react';

const WHATSAPP_NUMBER = '201050851892';

const contactItems = [
  {
    icon: Phone,
    label: 'الهاتف والموبايل',
    value: '+20 105 085 1892',
    href: 'tel:+201050851892',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    dir: 'ltr' as const,
  },
  {
    icon: MessageCircle,
    label: 'واتساب الدعم الفني',
    value: '+20 114 697 1208',
    href: `https://wa.me/201146971208`,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    dir: 'ltr' as const,
    external: true,
  },
  {
    icon: Mail,
    label: 'البريد الإلكتروني',
    value: 'hello@pharma-nile.com',
    href: 'mailto:hello@pharma-nile.com',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    dir: 'ltr' as const,
  },
  {
    icon: MapPin,
    label: 'موقع مكتبنا',
    value: 'مساحات عمل الإدارة، مصر الجديدة، القاهرة',
    href: 'https://maps.google.com/?q=مصر+الجديدة+القاهرة',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    dir: 'rtl' as const,
    external: true,
  },
];

const workHours = [
  { day: 'السبت – الأربعاء', hours: '10:00 ص – 8:00 م' },
  { day: 'الخميس', hours: '10:00 ص – 5:00 م' },
  { day: 'الجمعة', hours: 'مغلق (دعم أونلاين متاح)' },
];

export default function ContactSection() {
  const openWhatsApp = () => {
    const text = encodeURIComponent('أهلاً فارما نايل، أود التواصل مع الدعم الفني.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  return (
    <section id="contact" className="py-20 relative font-cairo" dir="rtl">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[50vw] h-[40vw] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute top-0 right-0 w-[30vw] h-[30vw] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-16"
        >
          <p className="text-cyan-400 text-xs font-black uppercase tracking-widest">اتصل بنا</p>
          <h2 className="text-3xl md:text-5xl font-black text-white">
            نحن هنا لمساعدتك في أي وقت
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm font-semibold">
            فريقنا متاح طوال أيام العمل للإجابة على جميع استفساراتك وتقديم الدعم الفني اللازم.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left: Contact Cards */}
          <div className="space-y-4">
            {contactItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={idx}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className={`flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border ${item.borderColor} hover:bg-white/[0.04] transition-all duration-300 group cursor-pointer`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${item.bgColor} flex items-center justify-center shrink-0 border ${item.borderColor}`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-xs font-bold mb-1">{item.label}</p>
                    <p className={`font-black text-white text-sm group-hover:${item.color} transition-colors`} dir={item.dir}>
                      {item.value}
                    </p>
                  </div>
                  <ArrowLeft className={`w-4 h-4 text-gray-600 group-hover:${item.color} group-hover:-translate-x-1 transition-all shrink-0`} />
                </motion.a>
              );
            })}

            {/* WhatsApp quick open CTA */}
            <motion.button
              onClick={openWhatsApp}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 active:scale-[0.97] transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              تواصل مباشرة عبر واتساب الآن
            </motion.button>
          </div>

          {/* Right: Work Hours + Map */}
          <div className="space-y-6">

            {/* Work hours card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-7 bg-white/[0.02] border border-white/7 rounded-3xl"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-white font-black text-base">ساعات العمل</h3>
              </div>

              <div className="space-y-3.5">
                {workHours.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                    <span className="text-gray-400 text-xs font-semibold">{item.day}</span>
                    <span className={`text-xs font-black ${item.hours.includes('مغلق') ? 'text-gray-500' : 'text-white'}`} dir="ltr">
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] text-gray-500 font-semibold leading-relaxed border-t border-white/5 pt-4">
                💡 الدعم الطارئ عبر واتساب متاح 24/7 لعملاء خطة النمو والمؤسسات
              </p>
            </motion.div>

            {/* Mock map placeholder */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative h-48 rounded-3xl overflow-hidden border border-white/7 bg-[#0b1023] cursor-pointer group"
              onClick={() => window.open('https://maps.google.com/?q=مصر+الجديدة+القاهرة', '_blank')}
            >
              {/* Map grid visual */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '32px 32px',
                }}
              />
              {/* Streets simulation */}
              <div className="absolute top-[30%] left-0 right-0 h-[2px] bg-cyan-500/20" />
              <div className="absolute top-[55%] left-0 right-0 h-[2px] bg-cyan-500/15" />
              <div className="absolute top-0 bottom-0 left-[30%] w-[2px] bg-cyan-500/20" />
              <div className="absolute top-0 bottom-0 left-[65%] w-[2px] bg-cyan-500/15" />

              {/* Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/40 border-2 border-white/30 animate-bounce">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="mt-2 px-3 py-1 bg-[#0d1425]/90 border border-white/10 rounded-xl text-[10px] text-white font-bold backdrop-blur-sm whitespace-nowrap">
                  مصر الجديدة، القاهرة
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-4 py-2 bg-cyan-400/90 text-black text-xs font-black rounded-xl">
                  افتح في خرائط جوجل ↗
                </span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
