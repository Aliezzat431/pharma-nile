'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Trash2, CheckCircle2, TrendingUp, AlertTriangle, 
  DollarSign, Activity, Boxes, BarChart3, Smartphone, Laptop, Search, PlusCircle, Check
} from 'lucide-react';

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'inventory' | 'reports' | 'mobile'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم السحابية', icon: Laptop },
    { id: 'pos', label: 'كاشير البيع الفوري (POS)', icon: ShoppingBag },
    { id: 'inventory', label: 'إدارة المخزن والجرد', icon: Boxes },
    { id: 'reports', label: 'تقارير الأداء والمبيعات', icon: BarChart3 },
    { id: 'mobile', label: 'تطبيق التنبيهات المساعد', icon: Smartphone }
  ] as const;

  // POS State for interactive demo
  const [cart, setCart] = useState<Array<{ id: number; name: string; price: number; q: number }>>([
    { id: 1, name: 'بنادول إكسترا (أقراص)', price: 35, q: 2 },
    { id: 2, name: 'كونفنتين 300 مجم (كابسول)', price: 80, q: 1 }
  ]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const updateCartQty = (id: number, val: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.q + val);
        return { ...item, q: newQty };
      }
      return item;
    }));
  };

  const removeCartItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handlePOSCheckout = () => {
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setCart([
        { id: 1, name: 'بنادول إكسترا (أقراص)', price: 35, q: 2 },
        { id: 2, name: 'كونفنتين 300 مجم (كابسول)', price: 80, q: 1 }
      ]);
    }, 2500);
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.q), 0);

  return (
    <section id="screens" className="py-20 bg-black/30 font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-5xl font-black text-white">استكشف واجهة الإدارة الحديثة</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base font-semibold">
            صُمم النظام لتوفير راحة تامة وعملية قصوى في عمليات البيع والتحكم بالمخازن بمؤشرات ألوان ذكية.
          </p>
        </div>

        {/* Desktop Tabs menu */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-5xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 active:scale-95 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/10 border border-transparent' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Window mockup showarea */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#0b101d] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative group">
            
            {/* Header Browser Frame */}
            <div className="bg-[#080d17] px-6 py-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 opacity-80" />
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 opacity-80" />
                <span className="w-3.5 h-3.5 rounded-full bg-green-500 opacity-80" />
              </div>
              <div className="bg-black/35 px-16 py-1 rounded-xl text-gray-500 text-[10px] sm:text-xs font-mono font-bold tracking-wide select-none">
                pharma-nile.cloud/workspace
              </div>
              <div className="w-12 h-2" />
            </div>

            {/* Layout screen content */}
            <div className="p-4 sm:p-6 min-h-[420px] sm:min-h-[500px] flex items-center justify-center text-right overflow-x-hidden" dir="rtl">
              <AnimatePresence mode="wait">
                
                {/* 1. Dashboard screenshot */}
                {activeTab === 'dashboard' && (
                  <motion.div
                    key="tab-dashboard"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full space-y-6"
                  >
                    {/* Header stats simulation */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'مبيعات اليوم', val: '12,450.50 ج.م', percent: '+18.5%', glow: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        { label: 'صافي الأرباح', val: '3,860.00 ج.م', percent: '+12.3%', glow: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'نواقص التنبيه', val: '3 أصناف', percent: 'حرجة', glow: 'text-red-400', bg: 'bg-red-500/10' },
                        { label: 'صلاحية قريبة', val: '16 علبة', percent: 'تفصيلية', glow: 'text-amber-500', bg: 'bg-amber-500/10' },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
                          <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center`}>
                            <TrendingUp className={`w-5 h-5 ${item.glow}`} />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold block">{item.label}</span>
                            <span className="text-lg font-black text-white block mt-0.5 tracking-tight font-sans">{item.val}</span>
                          </div>
                          <span className={`absolute top-3 left-3 text-[10px] font-bold ${item.glow}`}>{item.percent}</span>
                        </div>
                      ))}
                    </div>

                    {/* Chart & lists simulation */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Simulated Chart block */}
                      <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-white">إحصائيات المبيعات خلال الأسبوع</h4>
                            <p className="text-[10px] text-gray-500">منحنى صعود السيولة النقدية والمبيعات</p>
                          </div>
                          <span className="text-[10px] text-cyan-400 font-bold">تقرير تفصيلي</span>
                        </div>

                        {/* Visual graph chart simulator */}
                        <div className="h-[200px] flex items-end gap-3.5 pt-6 px-4 pb-2 border-b border-white/5 relative">
                          <div className="absolute inset-x-0 bottom-1/2 border-t border-white/[0.02] pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-1/4 border-t border-white/[0.02] pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-3/4 border-t border-white/[0.02] pointer-events-none" />
                          {[
                            { day: 'السبت', h: '60%', c: 'bg-blue-600' },
                            { day: 'الأحد', h: '45%', c: 'bg-cyan-500' },
                            { day: 'الإثنين', h: '85%', c: 'bg-blue-600' },
                            { day: 'الثلاثاء', h: '70%', c: 'bg-cyan-500' },
                            { day: 'الأربعاء', h: '95%', c: 'bg-blue-600' },
                            { day: 'الخميس', h: '80%', c: 'bg-cyan-500' },
                            { day: 'الجمعة', h: '35%', c: 'bg-blue-600' }
                          ].map((bar, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer z-10">
                              <div className="text-[9px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-2px]">{bar.h}</div>
                              <div 
                                className={`w-full ${bar.c} rounded-t-lg transition-all duration-700 hover:brightness-110 shadow-lg`} 
                                style={{ height: bar.h }} 
                              />
                              <span className="text-[10px] text-gray-500 font-bold block mt-1">{bar.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expiry alerts simulation panel */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white">إشعارات الصلاحية القريبة</h4>
                          <p className="text-[10px] text-red-400 font-bold">⚠️ تتطلب اتخاذ إجراء فوري</p>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pt-2 pr-1 custom-scrollbar">
                          {[
                            { name: 'باراسيتامول شراب أطفال', exp: 'بعد 15 يوم', qty: '6 علب', col: 'border-red-500/30 bg-red-500/5 text-red-400' },
                            { name: 'بروفين فوار 600 ملجم', exp: 'بعد 30 يوم', qty: '10 علبة', col: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
                            { name: 'سنسوداين معجون لثة', exp: 'بعد 45 يوم', qty: '2 علبة', col: 'border-amber-500/30 bg-amber-500/5 text-amber-400' }
                          ].map((item, index) => (
                            <div key={index} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${item.col}`}>
                              <div>
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-[9px] mt-0.5 opacity-90">تنتهي صلاحيته: {item.exp}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-black/25 text-[10px]">{item.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 2. Interactive POS Screen */}
                {activeTab === 'pos' && (
                  <motion.div
                    key="tab-pos"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 font-cairo"
                  >
                    
                    {/* Catalog side & scan simulator */}
                    <div className="lg:col-span-2 bg-[#090e18] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            disabled 
                            placeholder="امسح الباركود أو ابحث عن دواء بالاسم..." 
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-9 text-xs text-right text-white" 
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                        <button className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600/10 text-blue-400 border border-blue-500/25 rounded-xl text-xs font-bold whitespace-nowrap">
                          <PlusCircle className="w-4 h-4" />
                          <span>إدخال يدوي</span>
                        </button>
                      </div>

                      {/* Mock catalog list */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { name: 'أوجمنتين 1 جم', price: 99, cat: 'مضاد حيوي', stock: '25 علبة' },
                          { name: 'بنادول إكسترا', price: 35, cat: 'مسكن آلام', stock: '120 علبة' },
                          { name: 'كلاريتين 10مجم', price: 42, cat: 'حساسية', stock: '40 علبة' },
                          { name: 'أوترفين بخاخ', price: 28, cat: 'احتقان أنف', stock: '18 علبة' },
                          { name: 'أسبرين حماية', price: 21, cat: 'سيولة الدم', stock: '90 علبة' },
                          { name: 'جافيسكون شراب', price: 75, cat: 'حموضة ومعدة', stock: '15 علبة' },
                        ].map((prod, idx) => (
                          <div key={idx} className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col justify-between items-start text-right transition-all group">
                            <span className="text-[9px] text-gray-550 font-bold bg-white/5 px-1.5 py-0.5 rounded">{prod.cat}</span>
                            <h5 className="text-white font-bold text-xs mt-1.5">{prod.name}</h5>
                            <div className="flex items-center justify-between w-full mt-3 font-sans">
                              <span className="text-cyan-400 font-black text-xs">{prod.price} ج.م</span>
                              <span className="text-gray-500 text-[10px]">{prod.stock}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checkout side panel */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                      
                      {checkoutSuccess ? (
                        <div className="absolute inset-0 bg-[#0b101d] flex flex-col items-center justify-center text-center p-4 z-20">
                          <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce mb-3" />
                          <h4 className="text-lg font-bold text-white">تم حفظ وتخزين الفاتورة</h4>
                          <p className="text-xs text-gray-400 mt-1">جاري طباعة إيصال العميل ومزامنة الكميات...</p>
                        </div>
                      ) : null}

                      {/* Header cart info */}
                      <div className="space-y-3 flex-1 flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                          <span className="text-sm font-bold text-white">تفاصيل سلة البيع</span>
                          <span className="text-[10px] text-gray-450 font-bold">فاتورة نقدية</span>
                        </div>

                        {/* List items in cart */}
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[180px] pr-1 py-1 custom-scrollbar">
                          {cart.map((item) => (
                            <div key={item.id} className="bg-[#090e18] p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                              <div>
                                <h6 className="font-bold text-white">{item.name}</h6>
                                <p className="text-[10px] text-gray-500 mt-0.5">{item.price} ج.م / علبة</p>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {/* Qty adjustments */}
                                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/5 font-sans">
                                  <button onClick={() => updateCartQty(item.id, -1)} className="text-xs text-gray-400 hover:text-white px-1">-</button>
                                  <span className="text-xs text-white font-bold">{item.q}</span>
                                  <button onClick={() => updateCartQty(item.id, +1)} className="text-xs text-gray-400 hover:text-white px-1">+</button>
                                </div>
                                <button onClick={() => removeCartItem(item.id)} className="text-red-500 hover:text-red-400 p-1">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Checkout totals block */}
                      <div className="pt-4 border-t border-white/5 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-450 font-bold">
                            <span>إجمالي الخصم</span>
                            <span className="font-sans">0.00 ج.م</span>
                          </div>
                          <div className="flex items-center justify-between text-base font-bold text-white">
                            <span>إجمالي الفاتورة</span>
                            <span className="text-cyan-400 font-sans tracking-wide text-lg">{cartTotal} ج.م</span>
                          </div>
                        </div>

                        <button 
                          onClick={handlePOSCheckout}
                          disabled={cartTotal === 0}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 font-bold text-white text-xs hover:brightness-110 active:scale-95 duration-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-white" />
                          <span>تأكيد وطباعة الفاتورة</span>
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 3. Simulated Inventory Table */}
                {activeTab === 'inventory' && (
                  <motion.div
                    key="tab-inventory"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full space-y-4 font-cairo"
                  >
                    
                    {/* Header Controls */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between w-full max-w-sm">
                        <span className="text-gray-400">مجموع الأصناف المسجلة بالمخزن:</span>
                        <span className="text-white font-bold font-sans">1,248 صنفاً</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="px-3.5 py-2.5 bg-blue-600/10 text-blue-400 border border-blue-500/25 rounded-xl text-xs font-bold">تصدير إكسل</button>
                        <button className="px-3.5 py-2.5 bg-cyan-600/10 text-cyan-400 border border-cyan-500/25 rounded-xl text-xs font-bold">جرد عاجل</button>
                      </div>
                    </div>

                    {/* Table simulation */}
                    <div className="bg-[#090e18] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/5 text-gray-400 select-none">
                            <th className="p-3.5 font-bold">الصنف الدوائي</th>
                            <th className="p-3.5 font-bold">كود المادة</th>
                            <th className="p-3.5 font-bold">دفعات المخزن</th>
                            <th className="p-3.5 font-bold">صلاحية الدفعة</th>
                            <th className="p-3.5 font-bold">مؤشر الاستقرار</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {[
                            { name: 'كونكور 5 مجم (ضغط)', code: 'PCON-052', batch: '25 علبة / 3 كرتونة', exp: '2028-10', status: '🟢 كافٍ وآمن', col: 'text-emerald-400 bg-emerald-500/10' },
                            { name: 'فنتولين بخاخ صدر', code: 'PVEN-911', batch: '2 علبة فقط (ناقص)', exp: '2027-04', status: '🔴 حرج وشيك النفاد', col: 'text-red-400 bg-red-500/10' },
                            { name: 'ميلجا أقراص للأعصاب', code: 'PMIL-401', batch: '85 علبة / 10 كرتونة', exp: '2026-08', status: '🟡 تنبيه صلاحية شيكة', col: 'text-amber-500 bg-amber-500/10' },
                            { name: 'أوميبرازول للمعدة', code: 'POME-120', batch: '50 علبة / 5 كرتونة', exp: '2029-01', status: '🟢 كافٍ وآمن', col: 'text-emerald-400 bg-emerald-500/10' }
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-3.5 font-bold text-white">{row.name}</td>
                              <td className="p-3.5 text-gray-400 font-mono">{row.code}</td>
                              <td className="p-3.5 text-gray-300">{row.batch}</td>
                              <td className="p-3.5 text-gray-450 font-mono">{row.exp}</td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${row.col}`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </motion.div>
                )}

                {/* 4. Analytical Reports */}
                {activeTab === 'reports' && (
                  <motion.div
                    key="tab-reports"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full space-y-6 font-cairo"
                  >
                    
                    {/* Stats & profit comparison bars */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="bg-[#090e18] border border-white/5 rounded-2xl p-4 space-y-3">
                        <span className="text-[10px] text-gray-500 font-bold block">معدل نسبة الأرباح الإجمالية</span>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-6 h-6 text-emerald-400" />
                          <span className="text-2xl font-black text-white font-sans">31,520 ج.م</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 w-[68%]" />
                        </div>
                        <span className="text-[9px] text-gray-400 block font-bold">هدف الأرباح الشهري: 68% تم تحقيقه حتى الآن.</span>
                      </div>

                      <div className="bg-[#090e18] border border-white/5 rounded-2xl p-4 space-y-3">
                        <span className="text-[10px] text-gray-500 font-bold block">أكثر الأدوية طلباً ومبيعات</span>
                        <div className="space-y-1.5">
                          {[
                            { name: '1. بنادول أقراص مكن', val: '430 علبة' },
                            { name: '2. كونكور 5 ملجم ضغط', val: '180 علبة' }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-white">{item.name}</span>
                              <span className="text-cyan-400 font-sans">{item.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#090e18] border border-white/5 rounded-2xl p-4 space-y-3">
                        <span className="text-[10px] text-gray-500 font-bold block">مراقبة ديون صيدليات الآجل</span>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-amber-500 font-sans">8,640 ج.م</span>
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">تنبيه بالتحصيل</span>
                        </div>
                        <p className="text-[9px] text-gray-450 leading-relaxed font-bold">تذكير تلقائي مستمر للعملاء المتأخرين عبر رسائل السداد.</p>
                      </div>

                    </div>

                    {/* Progress bars of pharmacies segments */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white">توزيع مبيعات الأقسام (صيدليتي بلس)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { title: 'أدوية روشتات وأدوية محلية', percent: '65%', amt: '18,500 ج.م', bar: 'w-[65%] bg-blue-600' },
                          { title: 'مستحضرات تجميل وعناية بالبشرة', percent: '20%', amt: '5,800 ج.م', bar: 'w-[20%] bg-cyan-500' },
                          { title: 'بروتينات ومكملات غذائية رياضية', percent: '10%', amt: '2,900 ج.م', bar: 'w-[10%] bg-purple-500' },
                          { title: 'أجهزة ومستلزمات طبية', percent: '5%', amt: '1,450 ج.م', bar: 'w-[5%] bg-amber-500' }
                        ].map((item, index) => (
                          <div key={index} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-gray-300">{item.title}</span>
                              <span className="text-white font-sans">{item.percent} ({item.amt})</span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <div className={`h-full ${item.bar}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* 5. Mobile Companion notification screen */}
                {activeTab === 'mobile' && (
                  <motion.div
                    key="tab-mobile"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex items-center justify-center font-cairo py-4"
                  >
                    
                    {/* Simulated iPhone frame */}
                    <div className="w-[280px] h-[450px] bg-[#000000] border-4 border-[#1f2937] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col font-sans text-right" dir="rtl">
                      
                      {/* Top dynamic island mockup */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-2xl z-20 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-white/5" />
                      </div>

                      {/* Screen content */}
                      <div className="flex-1 bg-[#0c111e] p-4 pt-12 flex flex-col justify-between font-cairo">
                        
                        {/* Notify app top bar */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-gray-500 text-[10px]">
                            <span className="font-bold">فارما نايل موبايل</span>
                            <span>9:41 ص</span>
                          </div>

                          {/* App Title inside iphone */}
                          <div className="text-center pb-2 border-b border-white/5">
                            <h5 className="text-xs font-bold text-white">تنبيهات الفرع الحية</h5>
                            <span className="text-[9px] text-[#06B6D4] font-bold">فرع مدينة نصر الأول</span>
                          </div>

                          {/* Notification list inside iphone */}
                          <div className="space-y-2.5">
                            {[
                              { title: '⚠️ تنبيه وشيك نفاد', desc: 'باقي 2 علبة من فنتولين بخاخ بقاعدة البيانات', time: 'منذ دقيقة', cls: 'border-red-500/20 bg-red-500/5 text-gray-200' },
                              { title: '🔄 مزامنة الجرد السحابي', desc: 'تم تحديث مبيعات الفترة المسائية بنجاح', time: 'منذ 5 د', cls: 'border-emerald-500/20 bg-emerald-500/5 text-gray-200' },
                              { title: '📦 فاتورة شراء مستوردة', desc: 'تم استلام وتوثيق فاتورة المورد بالذكاء الاصطناعي', time: 'منذ 10 د', cls: 'border-blue-500/20 bg-blue-500/5 text-gray-200' }
                            ].map((note, index) => (
                              <div key={index} className={`p-2.5 rounded-xl border text-[10px] ${note.cls}`}>
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-white">{note.title}</span>
                                  <span className="text-gray-500 font-normal">{note.time}</span>
                                </div>
                                <p className="text-gray-400 mt-1 leading-relaxed">{note.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom navigation within Dynamic Mobile screen */}
                        <div className="bg-black/40 border border-white/5 p-2 rounded-2xl flex items-center justify-around text-gray-500">
                          <Activity className="w-5 h-5 text-cyan-400" />
                          <Boxes className="w-5 h-5" />
                          <Smartphone className="w-5 h-5" />
                        </div>

                      </div>

                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
