'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { 
  Mail, 
  ArrowUpRight, 
  MessageCircle, 
  Users, 
  Shield, 
  Zap, 
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

import { FaFacebook as Facebook}  from 'react-icons/fa';



const members = [
  {
    name: 'Ali Ezzat',
    role: 'The Architect',
    photo: '/Ali.jpg',
    whatsapp: 'https:
    facebook: 'https:
  },
  {
    name: 'Youssef',
    role: 'The Visionary',
    photo: '/youssef.jpg',
    whatsapp: 'https:
    facebook: 'https:
  },
  {
    name: 'Nour',
    role: 'The Guardian',
    photo: '/Nour.jpg',
    whatsapp: 'https:
    facebook: 'https:
  },
];

export function AboutSettings() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    gsap.from(".contact-card", {
      y: 60,
      opacity: 0,
      duration: 1.5,
      ease: "power4.out"
    });
  }, []);

  return (
    <motion.section 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      ref={container} 
      className="space-y-8"
    >
      <div className="contact-card glass-panel rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00CED1]/10 to-transparent opacity-30" />
        
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-tight font-cairo">
            يلا نبني الـ <br /> Next Standard.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-12">
            {members.map((member) => (
              <div key={member.name} className="flex flex-col items-center gap-4 p-6 glass-card rounded-[2rem] border border-white/5 hover:border-[#00CED1]/30 transition-all duration-500 group">
                <div className="relative w-24 h-24 mb-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00CED1]/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-full h-full rounded-full border-2 border-white/10 group-hover:border-[#00CED1]/50 transition-all duration-500 overflow-hidden bg-white/5 flex items-center justify-center">
                    {}
                    <img 
                      src={member.photo} 
                      alt={member.name} 
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                        (e.target as any).parentElement.innerHTML = `<span class="text-xl font-bold font-cairo text-[#00CED1]">${member.name.substring(0, 2)}</span>`;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <p className="text-lg font-bold text-white tracking-tight font-cairo">{member.name}</p>
                <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em]">{member.role}</p>
                
                <div className="flex gap-3 mt-2">
                  <a 
                    href={member.whatsapp} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2.5 bg-green-500/10 text-green-500 rounded-full hover:bg-green-500 hover:text-white transition-all transform hover:scale-110"
                    title="WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </a>
                  <a 
                    href={member.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2.5 bg-blue-500/10 text-blue-500 rounded-full hover:bg-blue-500 hover:text-white transition-all transform hover:scale-110"
                    title="Facebook"
                  >
                    <Facebook size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col items-center gap-6">
            <a 
              href="https:
              className="inline-flex items-center gap-4 px-10 py-4 bg-white text-black font-black rounded-full text-lg hover:scale-105 active:scale-95 transition-all duration-300 group shadow-2xl font-cairo"
            >
             موفعنا الشخصي
              <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
            
            <a 
              href="https:
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-zinc-500 hover:text-white transition-colors text-sm font-bold group"
            >
              <Facebook size={20} className="group-hover:scale-110 transition-transform" /> NAY COLLECTIVE PAGE
            </a>
          </div>
        </div>
      </div>
      
      <div className="text-center text-zinc-600 text-[10px] font-mono tracking-widest uppercase pb-4">
        &copy; 2026 NAY COLLECTIVE — ALL RIGHTS RESERVED
      </div>
    </motion.section>
  );
}
