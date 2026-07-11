'use client';

import { Pill, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

export default function Footer() {
  
  const handleSocialClick = (platform: string) => {
    // Navigate or link to official links
    const text = encodeURIComponent('أهلاً فارما نايل، أود التعرف أكثر على خدمتكم.');
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/201000000000?text=${text}`, '_blank');
    } else if (platform === 'facebook') {
      window.open('https://facebook.com/pharmanile', '_blank');
    } else if (platform === 'twitter') {
      window.open('https://twitter.com/pharmanile', '_blank');
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: topOffset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <footer id="contact" className="bg-[#060a12]/80 border-t border-white/5 pt-16 pb-8 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Footer Top Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Brand details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black text-white">فارما <span className="text-cyan-400">نايل</span></span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed font-semibold">
              نظام إدارة الصيدليات السحابي الأول الذي يجمع كاشير البيع الذكي، تتبع التواريخ والصلاحيات، والجرد الفوري مع تشغيل كامل دون انقطاع حتى بدون اتصال إنترنت.
            </p>
          </div>

          {/* Col 2: Services / products */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wider">خصائص النظام</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><a href="#screens" onClick={(e) => handleLinkClick(e, '#screens')} className="text-gray-400 hover:text-cyan-400 transition-colors">كاشير البيع الفوري (POS)</a></li>
              <li><a href="#features" onClick={(e) => handleLinkClick(e, '#features')} className="text-gray-400 hover:text-cyan-400 transition-colors">مراقبة المخزون والجرد بالباركود</a></li>
              <li><a href="#features" onClick={(e) => handleLinkClick(e, '#features')} className="text-gray-400 hover:text-cyan-400 transition-colors">تتبع تواريخ الصلاحية والتنبيهات</a></li>
              <li><a href="#features" onClick={(e) => handleLinkClick(e, '#features')} className="text-gray-400 hover:text-cyan-400 transition-colors">تقارير المبيعات والأرباح الدورية</a></li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wider">روابط سريعة</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><a href="#features" onClick={(e) => handleLinkClick(e, '#features')} className="text-gray-400 hover:text-cyan-400 transition-colors">المميزات الأساسية</a></li>
              <li><a href="#pricing" onClick={(e) => handleLinkClick(e, '#pricing')} className="text-gray-400 hover:text-cyan-400 transition-colors">أسعار اشتراك الخدمة</a></li>
              <li><a href="#faq" onClick={(e) => handleLinkClick(e, '#faq')} className="text-gray-400 hover:text-cyan-400 transition-colors">الأسئلة الشائعة للعملاء</a></li>
            </ul>
          </div>

          {/* Col 4: Contact details */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wider">اتصل بنا والدعم الفني</h4>
            <ul className="space-y-3 text-xs font-semibold">
              <li className="flex items-center gap-2.5 text-gray-400">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span className="font-sans text-left" dir="ltr">+20 105 085 1892</span>
              </li>
              <li className="flex items-center gap-2.5 text-gray-400">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="font-sans">hello@pharma-nile.com</span>
              </li>
              <li className="flex items-center gap-2.5 text-gray-400">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>مساحات عمل الإدارة، مصر الجديدة، القاهرة</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom copyright & Socials */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs font-semibold">
            جميع الحقوق محفوظة © {new Date().getFullYear()} فارما نايل لصناعة البرمجيات المتطورة.
          </p>
          
          {/* Socials buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSocialClick('whatsapp')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-emerald-500 hover:text-white border border-white/5 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={() => handleSocialClick('facebook')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-600 hover:text-white border border-white/5 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
              aria-label="Facebook"
            >
              <span className="font-sans font-black text-sm">f</span>
            </button>
            <button 
              onClick={() => handleSocialClick('twitter')}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-sky-400 hover:text-white border border-white/5 flex items-center justify-center text-gray-400 transition-all cursor-pointer"
              aria-label="Twitter"
            >
              <span className="font-sans font-black text-sm">t</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
