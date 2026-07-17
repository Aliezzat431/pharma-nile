"use client";

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWidget from '@/components/chat/ChatWidget';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { openIframe } from '@/store/slices/agentSlice';
import { Maximize2, Search, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import CommandPalette from '@/components/layout/CommandPalette';
import { syncOfflineReturns } from '@/lib/supabase/offline-orders';
import { processReturn } from '@/lib/api/orders';
import { showToast } from '@/components/ui/SyncToastProvider';
import DeveloperWidget from './DeveloperWidget';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/login') || pathname?.startsWith('/welcome');
  const isMinimal = searchParams.get('minimal') === 'true';
  const isCopilot = searchParams.get('copilot') === 'true';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(window.navigator.onLine);

      const handleOnline = async () => {
        setIsOnline(true);
        showToast({ variant: 'online', message: '✅ تم استعادة الاتصال بالإنترنت — جاري مزامنة البيانات...', duration: 4000 });
        
        try {
          const count = await syncOfflineReturns(processReturn);
          if (count > 0) {
            showToast({ variant: 'info', message: `🔄 تم رفع ${count} مرتجع مؤجل إلى السحابة بنجاح.`, duration: 5000 });
          }
          
          const swResp = await fetch('/api/__trigger_sync');
          const swData = await swResp.json();
          if (swData.synced > 0) {
            showToast({ variant: 'info', message: `✅ تمت مزامنة ${swData.synced} عملية تعديل/إضافة سحابياً.`, duration: 5000 });
          }
        } catch (err) {
          console.error('[LayoutWrapper] Failed to sync offline operations:', err);
        }
      };
      const handleOffline = () => {
        setIsOnline(false);
        showToast({ variant: 'offline', message: '📡 انقطع الاتصال. يعمل النظام في وضع عدم الاتصال.', duration: 5000 });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    const handleLayout = () => {
      const saved = localStorage.getItem('sidebar-collapsed');
      setIsSidebarCollapsed(saved === 'true');
    };

    handleLayout();
    window.addEventListener('sidebar-toggle', handleLayout);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }

      if (e.altKey && e.shiftKey) {
        const key = e.key.toLowerCase();
        const routes: Record<string, string> = {
          'd': '/',
          'p': '/pos',
          'i': '/inventory',
          's': '/shortages',
          'c': '/customers',
          'g': '/settings',
        };

        if (routes[key]) {
          e.preventDefault();
          router.push(routes[key]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('sidebar-toggle', handleLayout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  const handleCloneToWindow = () => {
    const title = pathname === '/' ? 'لوحة التحكم' : 
                 pathname?.split('/').pop()?.toUpperCase() || 'Page';
    dispatch(openIframe({
      url: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''),
      title: `نسخة: ${title}`,
      width: 1000,
      height: 750
    }));
  };

  if (isAuthPage) {
    return <div className="min-h-screen w-full bg-[var(--background)]">{children}</div>;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-10 h-10 text-[var(--nile-teal)] animate-spin" />
      </div>
    );
  }

  const pharmacyId = user?.user_metadata?.pharmacy_id;
  const userRole = user?.user_metadata?.role;

  // ─── Developer route protection ─────────────────────────────────────────────
  if (pathname === '/dev' && userRole !== 'developer' && userRole !== 'admin') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--background)] gap-4 text-center px-4 font-cairo" dir="rtl">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-[var(--foreground)]">غير مصرح بالدخول</h2>
        <p className="text-[var(--text-muted)] max-w-md">هذه الصفحة مخصصة لمطور النظام فقط.</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2.5 bg-[var(--nile-teal)]/20 hover:bg-[var(--nile-teal)] hover:text-[var(--background)] font-bold text-[var(--nile-teal)] transition-all rounded-xl"
        >
          العودة للوحة التحكم
        </button>
      </div>
    );
  }

  // ─── Pharmacy context guard ──────────────────────────────────────────────────
  // chain_admin and developer can have NULL pharmacy_id
  if (!pharmacyId && userRole !== 'chain_admin' && userRole !== 'developer') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--background)] gap-4 text-center px-4" dir="rtl">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold font-cairo text-[var(--foreground)]">غير مصرح بالدخول للنظام (Multi-Tenant)</h2>
        <p className="text-[var(--text-muted)] font-cairo max-w-md">يرجى تسجيل الدخول بشكل صحيح كمسؤول لاستعادة هوية الصيدلية.</p>
        <button 
          onClick={() => router.push('/auth/login')}
          className="mt-4 px-6 py-2.5 bg-[var(--nile-teal)]/20 hover:bg-[var(--nile-teal)] hover:text-[var(--background)] font-cairo font-bold text-[var(--nile-teal)] transition-all rounded-xl"
        >
          الذهاب لصفحة تسجيل الدخول
        </button>
      </div>
    );
  }

  const isPos = pathname?.startsWith('/pos');
  const showBlocker = false;

  if (showBlocker) {
    return (
      <div className="flex h-screen w-full relative">
        {(!isMinimal && !isCopilot) && <Sidebar />}
        <main className={`flex-1 h-screen flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 text-center transition-all duration-500 ease-in-out ${
          isSidebarCollapsed ? 'mr-0 md:mr-24' : 'mr-0 md:mr-72'
        }`}>
          <div className="glass-panel w-full max-w-md p-8 border border-amber-500/20 shadow-[0_0_50px_rgba(212,175,55,0.08)] flex flex-col items-center gap-6 animate-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 animate-pulse">
              <WifiOff className="w-8 h-8 text-[#D4AF37]" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-cairo text-[var(--foreground)]">انقطع الاتصال بالإنترنت (وضع الطوارئ)</h2>
              <p className="text-[10px] text-[#D4AF37] font-bold tracking-wider uppercase font-sans">Cairo Local Mode Active</p>
            </div>

            <p className="text-[12px] text-[var(--text-muted)] font-cairo leading-relaxed">
              تعذر الاتصال بقاعدة البيانات السحابية. تم تعليق شاشات الإدارة مؤقتاً لحين استعادة الشبكة.
            </p>

            <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/5 rounded-xl p-3 text-emerald-500 text-xs text-right leading-relaxed w-full font-cairo">
              💡 <span className="font-bold underline text-[var(--foreground)]">ملاحظة:</span> نقطة البيع (POS) تعمل بالكامل دون اتصال.
            </div>

            <button
              onClick={() => router.push('/pos')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--royal-gold)] to-[#f2cd56] text-[var(--background)] font-bold font-cairo hover:shadow-[0_0_20px_var(--royal-gold-glow)] transition-all hover:scale-[1.02] active:scale-95 text-sm"
            >
              الانتقال لنقطة البيع (POS Terminal)
            </button>
          </div>
        </main>
        <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />
        <ChatWidget />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full relative flex-col">
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[11px] py-1.5 px-4 text-center font-semibold font-cairo flex items-center justify-center gap-2 border-b border-amber-500/25 animate-in slide-in-from-top duration-300 z-50">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>وضع عدم الاتصال — يتم حفظ المبيعات محلياً ومزامنتها فور الإتاحة.</span>
        </div>
      )}
      
      <div className="flex flex-1 h-full w-full relative">
        {(!isMinimal && !isCopilot) && <Sidebar />}
        
        <main 
          className={`flex-1 h-screen overflow-y-auto overflow-x-hidden relative z-10 transition-all duration-500 ease-in-out ${
            (isMinimal || isCopilot) 
            ? 'mr-0 p-0' 
            : isSidebarCollapsed 
              ? 'mr-0 md:mr-24 p-4 sm:p-6 md:p-8 w-full' 
              : 'mr-0 md:mr-72 p-4 sm:p-6 md:p-8 w-full'
          }`}
        >
          {(!isMinimal && !isCopilot) && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 pointer-events-auto gap-4 md:gap-0">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                  onClick={() => window.dispatchEvent(new Event('sidebar-toggle'))}
                  className="md:hidden p-2 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--glass-surface-heavy)] transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                
                <button 
                  onClick={handleCloneToWindow}
                  className="px-4 py-2 bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] border border-[var(--glass-border)] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[var(--nile-teal)] transition-all hover:scale-105 shadow-lg backdrop-blur-sm flex-1 md:flex-none"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>فتح النافذة</span>
                </button>
              </div>

              <button 
                onClick={() => setIsCmdOpen(true)}
                className="glass-card px-4 py-2 flex items-center gap-4 text-muted hover:text-[var(--text-primary)] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 group-hover:text-[var(--nile-teal)] transition-colors" />
                  <span className="text-xs font-cairo font-bold">ابحث عن أي شيء (Ctrl+K)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[10px]">Ctrl</span>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[10px]">K</span>
                </div>
              </button>
            </div>
          )}
          
          <div className="animate-entrance">
            {children}
          </div>
        </main>
        
        <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[var(--nile-teal)]/5 blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
        <div className="fixed bottom-[-10%] right-[20%] w-[50vw] h-[50vw] rounded-full bg-[var(--royal-gold)]/3 blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      </div>
      
      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />
      <ChatWidget />
      <DeveloperWidget />
    </div>
  );
}