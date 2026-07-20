'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  PlusSquare,
  History,
  AlertTriangle,
  Sun,
  Moon,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const menuItems = [
  { icon: Home, label: 'لوحة التحكم', href: '/dashboard' },
  { icon: ShoppingCart, label: 'ماكينة البيع', href: '/pos' },
  { icon: Package, label: 'إدارة المخزن', href: '/inventory' },
  { icon: AlertTriangle, label: 'النواقص', href: '/shortages' },
  { icon: History, label: 'الروشتات السابقة', href: '/history' },
  { icon: Users, label: 'طاقم العمل', href: '/staff' },
  { icon: BarChart3, label: 'التقارير المالية', href: '/reports' },
  { icon: Bot, label: 'المساعد محسن', href: '/copilot' },
  { icon: Settings, label: 'الإعدادات', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!mounted) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-72 glass-panel m-4 rounded-2xl p-6 flex flex-col z-50 float-right shadow-2xl" dir="rtl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center neon-glow-teal" style={{ backgroundColor: 'var(--nile-teal)' }}>
          <PlusSquare className="text-[var(--background)] w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight nile-gradient-text font-cairo">
          صيدليتي بلس
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group font-cairo",
                isActive 
                  ? "bg-[var(--nile-teal-glow)] text-[var(--nile-teal)] border border-[var(--nile-teal)]" 
                  : "text-[var(--text-inactive)] hover:text-[var(--foreground)] hover:bg-[var(--glass-surface-heavy)] border border-transparent"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-[var(--nile-teal)]" : "text-[var(--text-inactive)] group-hover:text-[var(--text-secondary)]"
              )} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="absolute left-4 w-1 h-5 rounded-full neon-glow-teal" style={{ backgroundColor: 'var(--nile-teal)' }} />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 font-cairo">
        {}
        <button 
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[var(--text-inactive)] hover:text-[var(--status-warning)] hover:bg-[var(--glass-surface-heavy)] transition-all duration-300 group"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">الوضع الليلي</span>
            </>
          ) : (
            <>
              <Sun className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">الوضع النهاري</span>
            </>
          )}
        </button>

        {}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[var(--text-inactive)] hover:text-[var(--status-error)] hover:bg-[var(--glass-surface-heavy)] transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
