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
  Maximize2,
  Box,
  BadgeDollarSign,
  HeartHandshake,
  AlertCircle,
  FileUp,
  PanelLeftOpen // أيقونة التوسيع
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useAppDispatch } from '@/store/hooks';
import { openIframe } from '@/store/slices/agentSlice';
import ThemeToggle from './ThemeToggle';
import { usePreferences } from '@/hooks/usePreferences';

const menuGroups = [
  {
    title: 'العمليات اليومية',
    items: [
      { icon: LayoutDashboard, label: 'لوحة التحكم', href: '/' },
      { icon: ShoppingCart, label: 'نقطة البيع', href: '/pos' },
      { icon: Sparkles, label: 'محسن الذكي', href: '/copilot' },
    ]
  },
  {
    title: 'المخزن والعملاء',
    items: [
      { icon: Package, label: 'المخزون', href: '/inventory' },
      { icon: Box, label: 'التحويلات', href: '/transfers' },
      { icon: AlertCircle, label: 'النواقص', href: '/shortages' },
      { icon: Users, label: 'العملاء', href: '/customers' },
      { icon: History, label: 'المرتجعات', href: '/returns' },
    ]
  },
  {
    title: 'الماليات والتقارير',
    items: [
      { icon: TrendingUp, label: 'المبيعات', href: '/orders' },
      { icon: FileText, label: 'الفواتير', href: '/invoices' },
      { icon: FileUp, label: 'استيراد فاتورة', href: '/invoices/import' },
      { icon: BadgeDollarSign, label: 'الماليات', href: '/financials' },
      { icon: HeartHandshake, label: 'صدقة جارية', href: '/sadqah' },
    ]
  },
  {
    title: 'النظام',
    items: [
      { icon: Users, label: 'الموظفين', href: '/staff' },
      { icon: Settings, label: 'الإعدادات', href: '/settings' },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar-collapsed');
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      } else if (saved) {
        setIsCollapsed(saved === 'true');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (!isMobile) {
      localStorage.setItem('sidebar-collapsed', String(newState));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <motion.aside 
        initial={false}
        animate={{ 
          width: isMobile ? 288 : (isCollapsed ? 96 : 288),
          x: isMobile ? (isCollapsed ? 288 : 0) : 0
        }}
        className={`bg-[var(--panel-bg)] backdrop-blur-xl border-l border-[var(--glass-border)] h-screen fixed right-0 top-0 flex flex-col z-[100] transition-all duration-500 ease-in-out`}
      >
        {/* Header Section */}
        <div className={`p-6 pb-2 mb-4 transition-all duration-500 ${isCollapsed ? 'px-4' : 'p-8'}`}>
          <div className={`flex items-center gap-3 bg-gradient-to-l bg-[var(--nile-teal)]/10 to-transparent p-3 rounded-2xl border-r-4 border-[var(--nile-teal)] relative group overflow-hidden`}>
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-[var(--nile-teal)] flex items-center justify-center neon-glow-teal z-10 transition-transform group-hover:rotate-12">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h1 className="text-xl font-bold text-white tracking-tight font-cairo">
                  {preferences?.pharmacyName || 'PharmaNile'}
                </h1>
                <p className="text-[10px] text-[var(--nile-teal)] font-bold uppercase tracking-widest opacity-80">Premium OS</p>
              </div>
            )}
            
            {/* Internal Collapse Button (Visible when expanded) */}
            {!isCollapsed && (
              <button 
                onClick={toggleSidebar}
                className="absolute left-2 p-1.5 bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] rounded-lg text-[var(--sidebar-text-inactive)] hover:text-[var(--foreground)] transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar scroll-smooth py-4">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-5 text-[10px] font-bold text-[var(--sidebar-text-inactive)] uppercase tracking-[0.2em] mb-2 font-cairo animate-in fade-in duration-700">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <div key={item.href} className="group relative flex items-center">
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (isMobile) setIsCollapsed(true);
                        }}
                        className={`flex-1 flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                          isActive 
                          ? 'bg-[var(--nile-teal-glow)] text-[var(--nile-teal)] border-r-2 border-[var(--nile-teal)] shadow-lg' 
                          : 'text-[var(--sidebar-text-inactive)] hover:bg-[var(--glass-surface)] hover:text-[var(--foreground)]'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                      >
                        <item.icon className={`w-5 h-5 min-w-[20px] transition-transform group-hover:scale-110 ${isActive ? 'text-[var(--nile-teal)]' : ''}`} />
                        {!isCollapsed && (
                          <span className="font-cairo font-bold text-sm tracking-wide whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-300">
                            {item.label}
                          </span>
                        )}
                        {(isActive && !isCollapsed) && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-[var(--nile-teal)] neon-glow-teal" />}
                      </Link>
                      
                      {/* Tooltip for Collapsed State */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--background)] border border-[var(--glass-border)] rounded-lg text-[var(--foreground)] text-xs font-bold font-cairo opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[200] whitespace-nowrap shadow-2xl">
                          {item.label}
                        </div>
                      )}
                      
                      {/* Expand Window Button (Only in Expanded Mode) */}
                      {!isCollapsed && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            dispatch(openIframe({
                              url: item.href,
                              title: item.label,
                              width: 1000,
                              height: 750
                            }));
                          }}
                          className="absolute left-4 opacity-0 group-hover:opacity-100 p-2 hover:bg-[var(--nile-teal)]/20 text-[var(--nile-teal)] rounded-xl transition-all z-10"
                          title="فتح في نافذة مستقلة"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-[var(--glass-border)] space-y-3">
          <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${isCollapsed ? 'justify-center' : 'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)]'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--nile-teal)] to-[var(--royal-gold)] p-[2px]">
              <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center text-xs font-bold text-[var(--foreground)] overflow-hidden">
                {user?.user_metadata?.full_name?.substring(0, 2) || 'PH'}
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-[var(--foreground)] truncate font-cairo">
                  {user?.user_metadata?.full_name || 'Pharma Nile'}
                </p>
                <p className="text-[10px] text-[var(--sidebar-text-inactive)] font-bold font-inter truncate">Admin Level</p>
              </div>
            )}
          </div>

          <div className="flex px-1 gap-2">
             <ThemeToggle align="sidebar" />
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all group overflow-hidden ${
              isCollapsed ? "justify-center rounded-2xl" : "rounded-2xl"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
            {!isCollapsed && (
              <span className="text-sm font-bold font-cairo whitespace-nowrap">
                تسجيل الخروج
              </span>
            )}
          </button>
        </div>

        {/* ✅ Integrated Expand Button (Inside Nav, on the left edge) */}
        {isCollapsed && !isMobile && (
          <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-[101]">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={toggleSidebar}
              className="p-2 bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-l-xl rounded-r-none text-[var(--nile-teal)] hover:bg-[var(--glass-surface)] hover:text-[var(--foreground)] transition-all shadow-lg backdrop-blur-md"
              title="توسيع القائمة"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {/* Background Glow Effect */}
        {!isCollapsed && (
          <div className="absolute top-[20%] -left-20 w-40 h-40 bg-[var(--nile-teal)]/5 rounded-full blur-[80px] -z-10" />
        )}
      </motion.aside>
    </>
  );
}