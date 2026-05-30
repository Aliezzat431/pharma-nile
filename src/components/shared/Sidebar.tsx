"use client";

import React from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: Home, label: 'لوحة التحكم', href: '/dashboard' },
  { icon: ShoppingCart, label: 'ماكينة البيع', href: '/pos' },
  { icon: Package, label: 'إدارة المخزن', href: '/inventory' },
  { icon: AlertTriangle, label: 'النواقص', href: '/shortages' },
  { icon: History, label: 'الروشتات السابقة', href: '/history' },
  { icon: Users, label: 'طاقم العمل', href: '/staff' },
  { icon: BarChart3, label: 'التقارير المالية', href: '/reports' },
  { icon: Settings, label: 'الإعدادات', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed right-0 top-0 h-screen w-72 glass-panel m-4 border-r-0 rounded-2xl p-6 flex flex-col z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-nile-teal flex items-center justify-center neon-glow-teal">
          <PlusSquare className="text-obsidian w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight nile-gradient-text">
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
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-nile-teal/10 text-nile-teal border border-nile-teal/20" 
                  : "text-foreground/70 hover:text-foreground hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-nile-teal" : "text-foreground/50"
              )} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute left-4 w-1 h-5 bg-nile-teal rounded-full neon-glow-teal" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-foreground/50 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300 group">
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-lg">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
