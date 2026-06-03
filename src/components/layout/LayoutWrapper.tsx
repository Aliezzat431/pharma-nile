"use client";

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWidget from '@/components/chat/ChatWidget';
import { useDispatch } from 'react-redux';
import { openIframe } from '@/store/slices/agentSlice';
import { Maximize2, Search } from 'lucide-react';
import CommandPalette from '@/components/layout/CommandPalette';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthPage = pathname?.startsWith('/auth');
  const isMinimal = searchParams.get('minimal') === 'true';
  const isCopilot = searchParams.get('copilot') === 'true';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  useEffect(() => {
    const handleLayout = () => {
      const saved = localStorage.getItem('sidebar-collapsed');
      setIsSidebarCollapsed(saved === 'true');
    };

    handleLayout();
    window.addEventListener('sidebar-toggle', handleLayout);
    
    // Global Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette: Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }

      // Quick Navigation: Alt + Shift + [Key]
      if (e.altKey && e.shiftKey) {
        const key = e.key.toLowerCase();
        const routes: Record<string, string> = {
          'd': '/',          // Dashboard
          'p': '/pos',        // Point of Sale
          'i': '/inventory',  // Inventory
          's': '/shortages',  // Shortages (Nawaqis)
          'c': '/customers',  // Customers
          'g': '/settings',   // Settings (G representing Gear/Settings)
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
    return <div className="min-h-screen w-full bg-[#050505]">{children}</div>;
  }

  return (
    <div className="flex h-screen w-full relative">
      {(!isMinimal && !isCopilot) && <Sidebar />}
      
      {/* Main Content Area */}
      <main 
        className={`flex-1 h-screen overflow-y-auto overflow-x-hidden relative z-10 transition-all duration-500 ease-in-out ${
          (isMinimal || isCopilot) 
          ? 'mr-0 p-0' 
          : isSidebarCollapsed 
            ? 'mr-0 md:mr-24 p-4 sm:p-6 md:p-8 w-full' 
            : 'mr-0 md:mr-72 p-4 sm:p-6 md:p-8 w-full'
        }`}
      >
        {/* Quick Actions Header for Main Content */}
        {(!isMinimal && !isCopilot) && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 pointer-events-auto gap-4 md:gap-0">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Mobile Sidebar Toggle */}
              <button 
                onClick={() => window.dispatchEvent(new Event('sidebar-toggle'))}
                className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              
              <button 
                onClick={handleCloneToWindow}
                className="px-4 py-2 bg-[#111111]/80 hover:bg-[#1A1A1A] border border-white/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#00CED1] transition-all hover:scale-105 shadow-lg backdrop-blur-sm flex-1 md:flex-none"
              >
                <Maximize2 className="w-4 h-4" />
                <span>فتح النافذة</span>
              </button>
            </div>

            <button 
              onClick={() => setIsCmdOpen(true)}
              className="glass-card px-4 py-2 flex items-center gap-4 text-gray-500 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 group-hover:text-[#00CED1] transition-colors" />
                <span className="text-xs font-cairo font-bold">ابحث عن أي شيء (Ctrl+K)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">Ctrl</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">K</span>
              </div>
            </button>
          </div>
        )}
        
        <div className="animate-entrance">
          {children}
        </div>
      </main>
      
      {/* Background ambient lighting effects */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#00CED1]/5 blur-[120px] pointer-events-none -z-10 mix-blend-screen transition-opacity duration-1000"></div>
      <div className="fixed bottom-[-10%] right-[20%] w-[50vw] h-[50vw] rounded-full bg-[#D4AF37]/3 blur-[150px] pointer-events-none -z-10 mix-blend-screen transition-opacity duration-1000"></div>
      
      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />
      <ChatWidget />
    </div>
  );
}

