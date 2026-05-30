'use client';

import { Settings as SettingsIcon, Save, CreditCard, Bell, Shield, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo">
             <SettingsIcon className="text-gray-300" />
             إعدادات <span className="text-[#D4AF37]">النظام</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo">تكوين التفضيلات العامة للصيدلية والتكاملات البرمجية.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00CED1] to-[#009b9e] text-white font-bold hover:shadow-[0_0_15px_rgba(0,206,209,0.4)] transition-all font-cairo">
          <Save className="w-5 h-5" /> حفظ التغييرات
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Settings Navigation */}
        <div className="md:col-span-1 space-y-2">
           <button className="w-full text-right px-4 py-3 rounded-xl bg-white/10 text-white font-medium border border-white/5 flex items-center gap-3 font-cairo">
              <Shield className="w-4 h-4 text-[#00CED1]" /> الإعدادات العامة
           </button>
           <button className="w-full text-right px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 font-medium border border-transparent hover:border-white/5 transition-colors flex items-center gap-3 font-cairo">
              <CreditCard className="w-4 h-4" /> الفواتير ونقاط البيع
           </button>
           <button className="w-full text-right px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 font-medium border border-transparent hover:border-white/5 transition-colors flex items-center gap-3 font-cairo">
              <Bell className="w-4 h-4" /> التنبيهات وإشعارات المخزون
           </button>
           <button className="w-full text-right px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 font-medium border border-transparent hover:border-white/5 transition-colors flex items-center gap-3 font-cairo">
              <Smartphone className="w-4 h-4" /> المظهر والواجهة
           </button>
        </div>

        {/* Settings Form Area */}
        <div className="md:col-span-3 space-y-6">
           <div className="glass-panel p-8">
              <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 font-cairo text-right">بيانات الصيدلية</h2>
              
              <div className="space-y-5 text-right">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">اسم الصيدلية</label>
                    <input type="text" defaultValue="صيدلية النيل - الفرع الرئيسي" className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors font-cairo text-right" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">البريد الإلكتروني للتواصل</label>
                        <input type="email" dir="ltr" defaultValue="admin@pharmanile.com" className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors text-right" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">رقم الهاتف</label>
                        <input type="text" dir="ltr" defaultValue="+20 100 123 4567" className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors text-right" />
                     </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">العنوان / الموقع</label>
                    <textarea rows={3} defaultValue="القاهرة، مصر" className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors resize-none font-cairo text-right"></textarea>
                 </div>
              </div>
           </div>

           <div className="glass-panel p-8">
              <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 font-cairo text-right">تفضيلات النظام</h2>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="text-right">
                       <h3 className="text-white font-medium font-cairo">طريقة جرد المخزون الافتراضية</h3>
                       <p className="text-sm text-gray-400 font-cairo">تحدد أي تشغيلة يتم سحبها أولاً عند البيع.</p>
                    </div>
                    <select className="bg-[#050505] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#D4AF37] font-cairo">
                       <option value="FEFO">FEFO (الأقرب انتهاءً)</option>
                       <option value="FIFO (الأقدم دخولاً)">FIFO (الأقدم دخولاً)</option>
                       <option value="LIFO (الأحدث دخولاً)">LIFO (الأحدث دخولاً)</option>
                    </select>
                 </div>

                 <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="text-right">
                       <h3 className="text-white font-medium font-cairo">حد التنبيه لنواقص المخزون</h3>
                       <p className="text-sm text-gray-400 font-cairo">تنبيه النظام عندما يقل إجمالي رصيد الصنف عن هذا الرقم.</p>
                    </div>
                    <input type="number" defaultValue="20" className="w-24 bg-[#050505] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#00CED1] text-center" />
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
