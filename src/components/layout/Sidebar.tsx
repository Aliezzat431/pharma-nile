'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, PackageOpen, Users, LogOut, Settings, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from './ThemeToggle';

const SIDEBAR_LINKS = [
  { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
  { name: 'نقطة البيع', href: '/pos', icon: ShoppingCart },
  { name: 'مرتجعات المبيعات', href: '/returns', icon: RotateCcw },
  { name: 'المخزون والمنتجات', href: '/inventory', icon: PackageOpen },
  { name: 'إدارة الموظفين', href: '/staff', icon: Users },
  { name: 'إعدادات النظام', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user, activeShift } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside className="w-72 h-screen fixed right-0 top-0 p-6 flex flex-col glass-panel z-50">
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00CED1] to-[#47eaed] flex items-center justify-center neon-glow-teal shadow-lg text-black">
            <PackageOpen className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pharma<span className="nile-gradient-text text-[#00CED1]">Nile</span>
          </h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {SIDEBAR_LINKS.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive
                  ? 'bg-[#00CED1]/10 text-foreground border border-[#00CED1]/30'
                  : 'text-[color:var(--sidebar-text-inactive)] hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-[#00CED1]' : 'text-[color:var(--sidebar-text-inactive)] group-hover:text-foreground'
                }`} 
              />
              <span className={`font-medium ${isActive ? 'font-semibold' : ''} font-cairo`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout / User Session */}
      <div className="mt-auto">
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden">
             {user?.user_metadata?.avatar_url ? (
               <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <span className="text-[#D4AF37] font-bold">{user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'D'}</span>
             )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-foreground truncate font-cairo">{user?.user_metadata?.full_name || 'أحمد'}</p>
            <p className="text-xs text-[#00CED1] truncate font-cairo">{activeShift ? `وردية ${activeShift.shift_type === 'Morning' ? 'صباحية' : 'مسائية'}` : 'لا توجد وردية'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-[color:var(--sidebar-text-inactive)] hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
