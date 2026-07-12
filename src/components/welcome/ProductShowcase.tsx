'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Trash2, CheckCircle2, TrendingUp, AlertTriangle,
  DollarSign, Activity, Boxes, BarChart3, Smartphone, Laptop,
  Search, Check, LayoutDashboard, Package, Users, Settings,
  ShoppingCart, Sparkles, Wifi, Barcode, FileText, BadgeDollarSign,
  History, Box, AlertCircle, Tag, PackageOpen, Wallet, ArrowDownRight,
  BarChart, RefreshCw, Filter, ChevronDown, PlusCircle, Plus, FileUp
} from 'lucide-react';

/* ─────────────── SIDEBAR MENU (mirrors real Sidebar.tsx) ─────────────── */
const sidebarGroups = [
  {
    title: 'العمليات اليومية',
    items: [
      { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
      { id: 'pos',       label: 'نقطة البيع',  icon: ShoppingCart },
    ]
  },
  {
    title: 'المخزن والعملاء',
    items: [
      { id: 'inventory', label: 'المخزون',   icon: Package },
      { id: 'transfers', label: 'التحويلات', icon: Box },
      { id: 'customers', label: 'العملاء',   icon: Users },
      { id: 'returns',   label: 'المرتجعات', icon: History },
    ]
  },
  {
    title: 'الماليات والتقارير',
    items: [
      { id: 'reports',   label: 'الماليات',  icon: BadgeDollarSign },
      { id: 'invoices',  label: 'الفواتير',  icon: FileText },
    ]
  },
];

const ACTIVE_TABS = ['dashboard', 'pos', 'inventory', 'reports', 'mobile'] as const;
type TabId = typeof ACTIVE_TABS[number];

/* ─────────────── MOCK DATA ─────────────── */
const PRODUCTS = [
  { name: 'Panadol Extra',     price: 32,  stock: '120 pcs', detail: 'FEFO',  low: false },
  { name: 'Concor 5mg',        price: 42,  stock: '25 pcs',  detail: 'FEFO',  low: false },
  { name: 'Augmentin 1g',      price: 99,  stock: '18 pcs',  detail: 'FEFO',  low: false },
  { name: 'Ventolin Inhaler',  price: 38,  stock: '2 pcs',   detail: 'LOW!',  low: true  },
  { name: 'Omeprazole 20mg',   price: 65,  stock: '50 pcs',  detail: 'FEFO',  low: false },
  { name: 'Milga Tablets',     price: 55,  stock: '40 pcs',  detail: 'FEFO',  low: false },
];

const INVENTORY_ROWS = [
  { name: 'Panadol Extra',    company: 'GSK',           method: 'FEFO', qty: 120, price: 32,  low: false },
  { name: 'Concor 5mg',       company: 'Bayer',         method: 'FEFO', qty: 25,  price: 42,  low: false },
  { name: 'Ventolin Inhaler', company: 'GSK',           method: 'FEFO', qty: 2,   price: 38,  low: true  },
  { name: 'Augmentin 1g',     company: 'GSK',           method: 'FEFO', qty: 18,  price: 99,  low: false },
  { name: 'Omeprazole 20mg',  company: 'Local Pharma',  method: 'FEFO', qty: 50,  price: 65,  low: false },
  { name: 'Milga Tablets',    company: 'Minapharm',     method: 'FEFO', qty: 40,  price: 55,  low: false },
];

const RECENT_TX = [
  { id: '#9403', time: '2 min ago', total: '164.00 ج.م', items: '3 items', method: 'Cash' },
  { id: '#9398', time: '15 min',    total: '85.00 ج.م',  items: '1 item',  method: 'Visa' },
  { id: '#9395', time: '1 hr',      total: '430.50 ج.م', items: '5 items', method: 'Debt' },
];

const CHART_BARS = [
  { day: 'Sat', h: '60%', amt: '8,200' },
  { day: 'Sun', h: '45%', amt: '6,100' },
  { day: 'Mon', h: '85%', amt: '11,400' },
  { day: 'Tue', h: '70%', amt: '9,600' },
  { day: 'Wed', h: '95%', amt: '12,800' },
  { day: 'Thu', h: '88%', amt: '11,900' },
  { day: 'Fri', h: '35%', amt: '4,700' },
];

/* ═══════════════════════════════════════════════════════════════════════ */
export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [cart, setCart] = useState([
    { id: 1, name: 'Panadol Extra',  price: 32, q: 2 },
    { id: 2, name: 'Concor 5mg',     price: 42, q: 1 },
  ]);
  const [checkoutOk, setCheckoutOk] = useState(false);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.q, 0);

  const addToCart = (p: { name: string; price: number }) =>
    setCart(prev => {
      const ex = prev.find(i => i.name === p.name);
      if (ex) return prev.map(i => i.name === p.name ? { ...i, q: i.q + 1 } : i);
      return [...prev, { id: Date.now(), name: p.name, price: p.price, q: 1 }];
    });

  const updateQ = (id: number, d: number) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, q: Math.max(1, i.q + d) } : i));

  const removeItem = (id: number) =>
    setCart(prev => prev.filter(i => i.id !== id));

  const checkout = () => {
    setCheckoutOk(true);
    setTimeout(() => {
      setCheckoutOk(false);
      setCart([
        { id: 1, name: 'Panadol Extra', price: 32, q: 2 },
        { id: 2, name: 'Concor 5mg',    price: 42, q: 1 },
      ]);
    }, 2500);
  };

  const activePath = { dashboard: '/', pos: '/pos', inventory: '/inventory', reports: '/financials', mobile: '/companion' }[activeTab];

  const tabs = [
    { id: 'dashboard' as TabId, label: 'لوحة التحكم', icon: Laptop },
    { id: 'pos'       as TabId, label: 'نقطة البيع (POS)', icon: ShoppingBag },
    { id: 'inventory' as TabId, label: 'إدارة المخزن', icon: Boxes },
    { id: 'reports'   as TabId, label: 'التقارير المالية', icon: BarChart3 },
    { id: 'mobile'    as TabId, label: 'تطبيق المتابعة', icon: Smartphone },
  ];

  return (
    <section id="screens" className="py-20 bg-black/30 font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Title */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-5xl font-black text-white">واجهة حقيقية، نسخة طبق الأصل</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base font-semibold">
            ما تراه هنا هو النظام الفعلي — نفس الشاشات التي تعمل بها الصيدليات يومياً.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-5xl mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#06B6D4] to-cyan-500 text-white shadow-xl shadow-[#06B6D4]/20 border border-transparent'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Browser window */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#0b101d] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">

            {/* Browser chrome */}
            <div className="bg-[#080d17] px-6 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="bg-black/40 px-8 py-1.5 rounded-lg text-gray-500 text-[10px] font-mono font-bold tracking-wide select-none">
                pharma-nile.com{activePath}
              </div>
              <div className="w-16" />
            </div>

            {/* App content area */}
            <div className="flex min-h-[520px] text-right" dir="rtl">
              <AnimatePresence mode="wait">

                {activeTab !== 'mobile' ? (
                  <div key="desktop-layout" className="flex-1 flex w-full">

                    {/* ── Real Sidebar clone ── */}
                    <div className="w-[200px] bg-[#070b13] border-l border-white/[0.06] flex flex-col shrink-0 select-none hidden md:flex">

                      {/* Logo */}
                      <div className="p-4 pb-2">
                        <div className="flex items-center gap-2.5 bg-[#06B6D4]/10 px-3 py-2.5 rounded-2xl border-r-4 border-[#06B6D4]">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#2563EB] flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                            <Sparkles className="w-4 h-4 text-black" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white leading-none">صيدلية النيل</p>
                            <p className="text-[8px] text-gray-500 font-bold tracking-wider mt-0.5">Premium OS</p>
                          </div>
                        </div>
                      </div>

                      {/* Nav groups */}
                      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
                        {sidebarGroups.map(group => (
                          <div key={group.title} className="space-y-0.5">
                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.15em] px-3 mb-1.5">{group.title}</p>
                            {group.items.map(item => {
                              const isActive = item.id === activeTab;
                              const canClick = ACTIVE_TABS.includes(item.id as TabId);
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => canClick && setActiveTab(item.id as TabId)}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all relative ${
                                    canClick ? 'cursor-pointer' : 'cursor-default opacity-60'
                                  } ${
                                    isActive
                                      ? 'text-white'
                                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-l from-[#06B6D4]/10 to-transparent border-r-2 border-[#06B6D4] rounded-xl" />
                                  )}
                                  <item.icon className={`w-3.5 h-3.5 z-10 ${isActive ? 'text-[#06B6D4]' : ''}`} />
                                  <span className="z-10">{item.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </nav>

                      {/* User footer */}
                      <div className="p-3 border-t border-white/5">
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#2563EB] p-[1.5px] shrink-0">
                            <div className="w-full h-full rounded-full bg-[#070b13] flex items-center justify-center text-[9px] font-black text-white">أح</div>
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-white truncate">د. أحمد محمد</p>
                            <p className="text-[8px] text-gray-500">Admin Level</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Main Viewport ── */}
                    <div className="flex-1 bg-[#090d16] overflow-y-auto max-h-[520px] p-5">
                      <AnimatePresence mode="wait">

                        {/* ══ DASHBOARD ══ */}
                        {activeTab === 'dashboard' && (
                          <motion.div key="dash" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                            {/* Page header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h1 className="text-2xl font-black text-white">نورت صيدليتك، د. أحمد 👋</h1>
                                <p className="text-xs text-gray-400 mt-1">تقرير نشاط اليوم — فرع مدينة نصر الأول</p>
                              </div>
                              <button className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-[#06B6D4] font-bold hover:bg-white/10 transition-all">
                                <RefreshCw className="w-3 h-3 inline ml-1" />تحديث
                              </button>
                            </div>

                            {/* 4 stat cards — mirrors real dashboard */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                              {[
                                { label: 'مبيعات اليوم',   val: '12,450 ج.م', icon: Wallet,         color: '#06B6D4', bg: 'bg-[#06B6D4]/10', sub: '+18.5% ↑' },
                                { label: 'صافي الأرباح',   val: '3,860 ج.م',  icon: TrendingUp,     color: '#D4AF37', bg: 'bg-[#D4AF37]/10', sub: '+12.3% ↑' },
                                { label: 'نواقص التنبيه',  val: '3 أصناف',    icon: AlertCircle,    color: '#f87171', bg: 'bg-red-500/10',   sub: 'حرجة الآن' },
                                { label: 'صلاحية وشيكة',   val: '16 علبة',    icon: AlertTriangle,  color: '#fb923c', bg: 'bg-orange-500/10', sub: 'تنتهي قريباً' },
                              ].map((s, i) => (
                                <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden group hover:border-white/10 transition-all">
                                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                    <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</p>
                                    <p className="text-sm font-black text-white mt-0.5 font-sans">{s.val}</p>
                                    <p className="text-[9px] mt-0.5" style={{ color: s.color }}>{s.sub}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Chart + Recent */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                              {/* Bar chart */}
                              <div className="lg:col-span-2 bg-[#080d17] border border-white/[0.06] rounded-2xl p-5">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="text-xs font-bold text-white">إحصائيات المبيعات — آخر 7 أيام</h4>
                                  <button onClick={() => setActiveTab('reports')} className="text-[10px] text-[#06B6D4] font-bold hover:underline">التقرير الكامل ←</button>
                                </div>
                                <div className="h-[150px] flex items-end gap-2 pb-2 border-b border-white/5 relative">
                                  {[25, 50, 75].map(pct => (
                                    <div key={pct} className="absolute right-0 left-0 border-t border-dashed border-white/[0.04]" style={{ bottom: `${pct}%` }} />
                                  ))}
                                  {CHART_BARS.map((bar, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                                      <span className="text-[7px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-sans">{bar.amt}</span>
                                      <div
                                        className="w-full rounded-t-md transition-all hover:brightness-125"
                                        style={{ height: bar.h, background: i === 6 ? '#D4AF37' : 'linear-gradient(to top, #06B6D4, #2563EB)' }}
                                      />
                                      <span className="text-[8px] text-gray-500 font-bold">{bar.day}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Recent invoices */}
                              <div className="bg-[#080d17] border border-white/[0.06] rounded-2xl p-5 flex flex-col">
                                <h4 className="text-xs font-bold text-white mb-3">آخر الفواتير الصادرة</h4>
                                <div className="space-y-2 flex-1">
                                  {RECENT_TX.map((tx, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:border-white/10 transition-all text-xs">
                                      <div>
                                        <p className="font-bold text-white">Invoice {tx.id}</p>
                                        <p className="text-[9px] text-gray-500 mt-0.5">{tx.time} • {tx.items}</p>
                                      </div>
                                      <div className="text-left">
                                        <span className="text-[#06B6D4] font-black font-sans block">{tx.total}</span>
                                        <span className="text-[8px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded block mt-0.5 text-center">{tx.method}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Quick actions */}
                            <div>
                              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">عمليات سريعة</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                  { title: 'POS Terminal',      desc: 'ابدأ جلسة بيع فورية', to: 'pos',       highlight: true },
                                  { title: 'Import Invoice AI', desc: 'استيراد بالذكاء الاصطناعي', to: 'inventory', highlight: false },
                                  { title: 'Receive Stock',     desc: 'إضافة تشغيلة جديدة',   to: 'inventory', highlight: false },
                                  { title: 'Low Stock Alert',   desc: 'رصد نواقص المخزون',    to: 'inventory', highlight: false },
                                ].map((op, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setActiveTab(op.to as TabId)}
                                    className={`p-3 rounded-xl text-right border transition-all text-xs font-bold ${
                                      op.highlight
                                        ? 'bg-gradient-to-br from-[#06B6D4] to-[#2563EB] text-white border-transparent hover:brightness-110'
                                        : 'bg-white/[0.02] border-white/5 text-white hover:bg-white/5 hover:border-white/15'
                                    }`}
                                  >
                                    <span className="block font-black">{op.title}</span>
                                    <span className="block text-[8px] font-medium opacity-75 mt-0.5">{op.desc}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* ══ POS ══ */}
                        {activeTab === 'pos' && (
                          <motion.div key="pos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                            {/* POS Header — mirrors POSHeader.tsx */}
                            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                              <h1 className="text-2xl font-bold font-cairo">
                                نقطة <span className="text-[#06B6D4]">البيع</span> (POS)
                              </h1>
                              <div className="flex gap-2 text-xs">
                                <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-gray-300">
                                  <Barcode className="w-3.5 h-3.5 text-[#06B6D4]" />الماسح جاهز
                                </div>
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-emerald-400">
                                  <Wifi className="w-3.5 h-3.5" />متصل بالشبكة
                                </div>
                              </div>
                            </header>

                            {/* 2-col POS layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                              {/* Product catalog — mirrors POSProductCard.tsx */}
                              <div className="lg:col-span-2 space-y-3">
                                <div className="relative">
                                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                  <input disabled placeholder="ابحث بالاسم أو امسح الباركود..." className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pr-9 pl-3 text-xs text-right text-white placeholder-gray-600 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                  {PRODUCTS.map((p, i) => (
                                    <div
                                      key={i}
                                      onClick={() => addToCart(p)}
                                      className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.07] hover:border-[#06B6D4]/50 rounded-xl p-3 flex flex-col cursor-pointer active:scale-95 transition-all group"
                                    >
                                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full self-start ${p.low ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                        {p.detail}
                                      </span>
                                      <h5 className="text-white font-bold text-xs mt-2 group-hover:text-[#06B6D4] transition-colors">{p.name}</h5>
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-[#D4AF37] font-black text-xs font-sans">{p.price} ج.م</span>
                                        <span className="text-gray-600 text-[9px]">{p.stock}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Cart — mirrors POSCartItem.tsx */}
                              <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4 flex flex-col min-h-[300px] relative overflow-hidden">
                                {checkoutOk && (
                                  <div className="absolute inset-0 bg-[#090d16]/95 flex flex-col items-center justify-center text-center p-4 z-20 backdrop-blur-sm">
                                    <CheckCircle2 className="w-12 h-12 text-[#06B6D4] animate-bounce mb-3" />
                                    <h4 className="text-sm font-bold text-white">تم تأكيد الفاتورة!</h4>
                                    <p className="text-[10px] text-gray-400 mt-1">تمت المزامنة السحابية.</p>
                                  </div>
                                )}

                                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                                  <h4 className="text-xs font-bold text-white">سلة البيع</h4>
                                  <span className="text-[9px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-lg font-bold">نقدي</span>
                                </div>

                                <div className="flex-1 space-y-2 overflow-y-auto max-h-[160px]">
                                  {cart.length === 0
                                    ? <p className="text-center text-gray-600 text-xs py-8">السلة فارغة</p>
                                    : cart.map(item => (
                                      <div key={item.id} className="bg-[#070b13] p-2.5 rounded-xl border border-white/5 flex items-center gap-2 relative overflow-hidden">
                                        <div className="absolute right-0 top-0 w-0.5 h-full bg-[#06B6D4]/50" />
                                        <div className="flex-1 pl-1">
                                          <p className="font-bold text-white text-xs">{item.name}</p>
                                          <p className="text-[9px] text-gray-500 font-sans">{item.price} ج.م / علبة</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg">
                                            <button onClick={() => updateQ(item.id, -1)} className="px-1.5 py-0.5 text-gray-500 hover:text-white text-xs font-bold">−</button>
                                            <span className="text-[#06B6D4] font-bold text-xs min-w-[20px] text-center">{item.q}</span>
                                            <button onClick={() => updateQ(item.id, +1)} className="px-1.5 py-0.5 text-gray-500 hover:text-white text-xs font-bold">+</button>
                                          </div>
                                          <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                </div>

                                <div className="border-t border-white/5 pt-3 mt-3 space-y-3">
                                  <div className="flex justify-between text-xs font-bold text-white">
                                    <span>المجموع المستحق</span>
                                    <span className="text-[#06B6D4] font-black font-sans text-sm">{cartTotal.toFixed(2)} ج.م</span>
                                  </div>
                                  <button
                                    onClick={checkout}
                                    disabled={cart.length === 0}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    تأكيد وطباعة الفاتورة
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* ══ INVENTORY ══ */}
                        {activeTab === 'inventory' && (
                          <motion.div key="inv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                            {/* Header — mirrors inventory/page.tsx */}
                            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                              <div>
                                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#06B6D4] to-[#2563EB] flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                    <PackageOpen className="w-5 h-5 text-black" />
                                  </div>
                                  <span className="nile-gradient-text">إدارة المخزن</span>
                                </h1>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 mr-14">Tracking Products, Batches & Expirations</p>
                              </div>
                              <div className="flex gap-2">
                                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-bold hover:bg-white/10 transition-all">
                                  <FileUp className="w-3.5 h-3.5 text-[#D4AF37]" />استيراد ملف
                                </button>
                                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-xs text-[#06B6D4] font-bold hover:bg-[#06B6D4]/20 transition-all">
                                  <Plus className="w-3.5 h-3.5" />إضافة صنف
                                </button>
                              </div>
                            </header>

                            {/* 4 stat cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                              {[
                                { label: 'إجمالي المنتجات', val: '1,248', icon: PackageOpen, color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10' },
                                { label: 'إجمالي الرصيد',   val: '18,420', icon: Tag,         color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
                                { label: 'نواقص المخزون',  val: '3',     icon: AlertCircle, color: 'text-red-400',   bg: 'bg-red-500/10' },
                                { label: 'قيمة المخزن',    val: '240K ج.م', icon: DollarSign,color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                              ].map((s, i) => (
                                <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3 group hover:border-white/10 transition-all">
                                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                                    <s.icon className={`w-5 h-5 ${s.color}`} />
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</p>
                                    <p className="text-lg font-black text-white font-sans">{s.val}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Search + filter bar */}
                            <div className="flex gap-3">
                              <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-2 flex items-center gap-2">
                                <Search className="w-4 h-4 text-gray-500 mr-1 shrink-0" />
                                <input disabled placeholder="بحث بالاسم، الشركة أو الباركود..." className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 outline-none" />
                              </div>
                              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 flex items-center gap-1.5 hover:bg-white/10 transition-all font-bold">
                                <Filter className="w-3.5 h-3.5" />جميع الأنواع<ChevronDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Table — mirrors inventory/page.tsx table */}
                            <div className="bg-[#080d17] border border-white/[0.06] rounded-2xl overflow-hidden">
                              <table className="w-full text-right text-xs">
                                <thead>
                                  <tr className="bg-white/[0.03] border-b border-white/5 text-gray-400 text-[10px] uppercase tracking-wider">
                                    <th className="p-3 font-bold">المعلومات الأساسية</th>
                                    <th className="p-3 font-bold hidden lg:table-cell">الشركة</th>
                                    <th className="p-3 font-bold">النظام</th>
                                    <th className="p-3 font-bold text-center">الرصيد</th>
                                    <th className="p-3 font-bold text-left">أحدث سعر</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                  {INVENTORY_ROWS.map((row, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                                      <td className="p-3">
                                        <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${row.low ? 'bg-red-500/10' : 'bg-white/5'}`}>
                                            <Tag className={`w-4 h-4 ${row.low ? 'text-red-400' : 'text-gray-500'}`} />
                                          </div>
                                          <div>
                                            <p className="font-bold text-white">{row.name}</p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${row.low ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                              {row.low ? 'ناقص حرج' : 'مستقر'}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 text-gray-400 hidden lg:table-cell">{row.company}</td>
                                      <td className="p-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 border border-white/10 px-2 py-0.5 rounded-full bg-white/5">{row.method}</span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={`text-base font-black font-sans ${row.low ? 'text-red-400' : 'text-emerald-400'}`}>{row.qty}</span>
                                        <p className="text-[8px] text-gray-600 uppercase">علبة</p>
                                      </td>
                                      <td className="p-3 text-left font-bold text-white font-sans">
                                        {row.price} <span className="text-[9px] text-gray-500 font-cairo">ج.م</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}

                        {/* ══ FINANCIALS ══ */}
                        {activeTab === 'reports' && (
                          <motion.div key="rep" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                            {/* Header — mirrors financials/page.tsx */}
                            <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-[#06B6D4] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                  <TrendingUp className="w-5 h-5 text-black" />
                                </div>
                                <span className="nile-gradient-text">التقارير المالية</span>
                              </h1>
                              <div className="flex gap-2 items-center">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1">
                                  <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#06B6D4]/25 text-[#06B6D4]">يومي</button>
                                  <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white">شهري</button>
                                </div>
                                <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-400 outline-none">
                                  <option>آخر 30 يوم</option>
                                  <option>آخر 7 أيام</option>
                                </select>
                              </div>
                            </header>

                            {/* 4 stat cards — mirrors financials */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                              {[
                                { label: 'إجمالي المبيعات', val: '31,520 ج.م', icon: Wallet,         color: '#06B6D4' },
                                { label: 'صافي الأرباح',    val: '9,860 ج.م',  icon: TrendingUp,     color: '#D4AF37' },
                                { label: 'إجمالي التكاليف', val: '21,660 ج.م', icon: ArrowDownRight,  color: '#f87171' },
                                { label: 'عدد العمليات',   val: '412',         icon: BarChart,       color: '#94a3b8' },
                              ].map((s, i) => (
                                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <p className="text-[9px] text-gray-400 font-bold">{s.label}</p>
                                    <s.icon className="w-4 h-4 opacity-40" style={{ color: s.color }} />
                                  </div>
                                  <p className="text-xl font-black text-white font-sans">{s.val}</p>
                                </div>
                              ))}
                            </div>

                            {/* Chart area + Pie donut */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                              {/* Area chart simulation */}
                              <div className="lg:col-span-2 bg-[#080d17] border border-white/[0.06] rounded-2xl p-5">
                                <h2 className="text-sm font-bold text-white mb-4">منحنى الدخل والأرباح</h2>
                                <div className="h-[160px] relative">
                                  {/* SVG area chart simulation */}
                                  <svg viewBox="0 0 320 120" className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                                      </linearGradient>
                                    </defs>
                                    {/* Grid lines */}
                                    {[30, 60, 90].map(y => (
                                      <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                                    ))}
                                    {/* Revenue area */}
                                    <path d="M0,90 C20,80 40,60 60,55 S100,40 120,45 S160,30 180,35 S220,20 240,25 S280,30 320,28" stroke="#06B6D4" strokeWidth="2.5" fill="none" />
                                    <path d="M0,90 C20,80 40,60 60,55 S100,40 120,45 S160,30 180,35 S220,20 240,25 S280,30 320,28 L320,120 L0,120Z" fill="url(#revGrad)" />
                                    {/* Profit dashed */}
                                    <path d="M0,100 C20,95 40,80 60,75 S100,65 120,68 S160,55 180,58 S220,45 240,50 S280,50 320,48" stroke="#D4AF37" strokeWidth="1.5" fill="none" strokeDasharray="5,3" />
                                  </svg>
                                  {/* X axis labels */}
                                  <div className="flex justify-between mt-1 text-[8px] text-gray-600 font-sans">
                                    {['1 Jul', '5 Jul', '10 Jul', '15 Jul', '20 Jul', '25 Jul', '30 Jul'].map(d => (
                                      <span key={d}>{d}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-4 mt-2">
                                  <div className="flex items-center gap-1.5 text-[10px] text-[#06B6D4]"><span className="w-5 h-0.5 bg-[#06B6D4] rounded" />إيرادات</div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-[#D4AF37]"><span className="w-5 h-0.5 bg-[#D4AF37] border-dashed border-t border-[#D4AF37] rounded" />أرباح</div>
                                </div>
                              </div>

                              {/* Payment distribution */}
                              <div className="bg-[#080d17] border border-white/[0.06] rounded-2xl p-5 flex flex-col">
                                <h2 className="text-sm font-bold text-white mb-4">توزيع طرق الدفع</h2>
                                {/* Donut simulation */}
                                <div className="flex-1 flex items-center justify-center">
                                  <svg viewBox="0 0 100 100" className="w-32 h-32">
                                    <circle cx="50" cy="50" r="35" fill="none" stroke="#06B6D4" strokeWidth="14" strokeDasharray="132 18" strokeDashoffset="0" strokeLinecap="round" />
                                    <circle cx="50" cy="50" r="35" fill="none" stroke="#D4AF37" strokeWidth="14" strokeDasharray="36 114" strokeDashoffset="-132" strokeLinecap="round" />
                                    <circle cx="50" cy="50" r="35" fill="none" stroke="#f87171" strokeWidth="14" strokeDasharray="18 132" strokeDashoffset="-168" strokeLinecap="round" />
                                  </svg>
                                </div>
                                <div className="space-y-2 mt-2">
                                  {[
                                    { name: 'نقدي',  pct: '73%', val: '23,020 ج.م', color: '#06B6D4' },
                                    { name: 'آجل',   pct: '20%', val: '6,304 ج.م',  color: '#D4AF37' },
                                    { name: 'فيزا',  pct: '7%',  val: '2,196 ج.م',  color: '#f87171' },
                                  ].map((p, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs font-cairo">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                                        <span className="text-gray-400">{p.name} ({p.pct})</span>
                                      </div>
                                      <span className="font-bold text-white font-sans text-[10px]">{p.val}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                      </AnimatePresence>
                    </div>

                  </div>

                ) : (

                  /* ══ MOBILE ══ */
                  <motion.div
                    key="mobile"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex justify-center items-center py-6 bg-[#090d16] flex-1"
                  >
                    <div className="w-[260px] h-[460px] bg-black border-[3px] border-[#1f2937] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col font-cairo">
                      {/* Dynamic island */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-2xl z-20 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      </div>

                      <div className="flex-1 bg-[#070b13] p-4 pt-10 flex flex-col gap-4" dir="rtl">
                        {/* App bar */}
                        <div className="flex items-center justify-between text-[9px] text-gray-500">
                          <span className="font-bold text-[#06B6D4]">PharmaNile</span>
                          <span className="font-sans">9:41 AM ●●●</span>
                        </div>

                        {/* Title */}
                        <div className="text-center border-b border-white/5 pb-3">
                          <h5 className="text-xs font-black text-white">تنبيهات الفرع الذكية</h5>
                          <span className="text-[9px] text-[#06B6D4] font-bold">فرع مدينة نصر الأول</span>
                        </div>

                        {/* Notifications */}
                        <div className="space-y-2.5 flex-1">
                          {[
                            { title: '⚠️ Low Stock Alert',    desc: 'Ventolin Inhaler — 2 units remaining', time: '1m',  cls: 'border-red-500/20 bg-red-500/5' },
                            { title: '🔄 Cloud Sync Done',     desc: '124 sales synced to cloud successfully', time: '5m',  cls: 'border-emerald-500/20 bg-emerald-500/5' },
                            { title: '📦 Invoice Imported',    desc: 'Supplier invoice processed via AI', time: '10m', cls: 'border-blue-500/20 bg-blue-500/5' },
                            { title: '💊 Expiry Warning',      desc: 'Milga Tablets batch expires Aug 2026', time: '1h',  cls: 'border-amber-500/20 bg-amber-500/5' },
                          ].map((n, i) => (
                            <div key={i} className={`p-2.5 rounded-xl border text-[9px] ${n.cls}`}>
                              <div className="flex justify-between items-center font-bold mb-0.5">
                                <span className="text-white">{n.title}</span>
                                <span className="text-gray-500 font-sans font-normal">{n.time}</span>
                              </div>
                              <p className="text-gray-400 leading-relaxed">{n.desc}</p>
                            </div>
                          ))}
                        </div>

                        {/* Bottom nav */}
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-2 flex items-center justify-around text-gray-500">
                          <Activity className="w-4 h-4 text-[#06B6D4]" />
                          <Package className="w-4 h-4" />
                          <BarChart3 className="w-4 h-4" />
                          <Settings className="w-4 h-4" />
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
