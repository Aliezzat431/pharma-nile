'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  CreditCard,
  History,
  Sparkles,
  Maximize2
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { openIframe } from '@/store/slices/agentSlice';
const menuItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', href: '/' },
  { icon: ShoppingCart, label: 'نقطة البيع', href: '/pos' },
  { icon: Package, label: 'المخزون', href: '/inventory' },
  { icon: Users, label: 'العملاء', href: '/customers' },
  { icon: Sparkles, label: 'محسن (الذكاء الاصطناعي)', href: '/copilot' },
  { icon: TrendingUp, label: 'المبيعات', href: '/orders' },
  { icon: FileText, label: 'الفواتير', href: '/invoices' },
  { icon: CreditCard, label: 'الماليات', href: '/financials' },
  { icon: History, label: 'المرتجعات', href: '/returns' },
  { icon: Users, label: 'الموظفين', href: '/staff' },
  { icon: Settings, label: 'الإعدادات', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <aside className="w-72 bg-[#0A0A0A] border-l border-white/5 h-screen fixed right-0 top-0 flex flex-col z-[100] shadow-2xl">
      {/* Brand Header */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 bg-gradient-to-l from-[#00CED1]/10 to-transparent p-4 rounded-2xl border-r-4 border-[#00CED1]">
          <div className="w-10 h-10 rounded-xl bg-[#00CED1] flex items-center justify-center neon-glow-teal">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight font-cairo">PharmaNile</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Premium OS</p>
          </div>
        </div>
      </div>

      {/* Navigation Links - Scrollable */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.href} className="group relative flex items-center gap-1">
              <Link
                href={item.href}
                className={`flex-1 flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-gradient-to-l from-[#00CED1]/20 to-[#00CED1]/5 text-[#00CED1] border-r-2 border-[#00CED1] shadow-lg shadow-[#00CED1]/5' 
                  : 'text-gray-500 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-[#00CED1]' : ''}`} />
                <span className="font-cairo font-bold text-sm tracking-wide">{item.label}</span>
                {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-[#00CED1] shadow-[0_0_10px_#00CED1]" />}
              </Link>
              
              {/* Open in Window Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  dispatch(openIframe({
                    url: item.href,
                    title: item.label,
                    width: 900,
                    height: 700
                  }));
                }}
                className="absolute left-4 opacity-0 group-hover:opacity-100 p-2 hover:bg-[#00CED1]/20 text-[#00CED1] rounded-xl transition-all z-10"
                title="فتح في نافذة مستقلة"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </nav>

      {/* User & Shift Info section */}
      <div className="p-6 border-t border-white/5 bg-gradient-to-t from-white/5 to-transparent">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
             {mounted && user?.user_metadata?.avatar_url ? (
               <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <span className="text-[#D4AF37] font-bold text-lg font-cairo">
                 {mounted ? (user?.user_metadata?.full_name?.charAt(0) || 'P') : '...'}
               </span>
             )}
             <div className="absolute inset-0 bg-[#00CED1]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1 overflow-hidden">
             <p className="text-sm font-bold text-white truncate font-cairo">
                {mounted ? (user?.user_metadata?.full_name || 'طبيب صيدلي') : '...'}
             </p>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_green]" />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">لا توجد وردية</p>
             </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-300 font-bold font-cairo text-sm group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
