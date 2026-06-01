"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import Sidebar from './Sidebar';
import ChatWidget from '@/components/chat/ChatWidget';
import { useDispatch } from 'react-redux';
import { openIframe } from '@/store/slices/agentSlice';
import { Maximize2 } from 'lucide-react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const isAuthPage = pathname?.startsWith('/auth');
  const isMinimal = searchParams.get('minimal') === 'true';
  const isCopilot = searchParams.get('copilot') === 'true';

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
      
      {/* Main Content Area - remove margin if minimal */}
      <main className={`flex-1 h-screen overflow-y-auto relative z-10 ${(isMinimal || isCopilot) ? 'mr-0 p-0' : 'mr-72 p-8'}`}>
        {/* Quick Actions Header for Main Content */}
        {(!isMinimal && !isCopilot) && (
          <div className="flex justify-start mb-8 gap-4 pointer-events-auto">
            <button 
              onClick={handleCloneToWindow}
              className="px-4 py-2 bg-[#111111] hover:bg-[#1A1A1A] border border-white/10 rounded-xl flex items-center gap-2 text-xs font-bold text-[#00CED1] transition-all hover:scale-105 shadow-lg"
            >
              <Maximize2 className="w-4 h-4" />
              <span>فتح هذه الصفحة في نافذة مستقلة</span>
            </button>
          </div>
        )}
        {children}
      </main>
      
      {/* Background ambient lighting effects */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#00CED1]/10 blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="fixed bottom-[-10%] right-[20%] w-[50vw] h-[50vw] rounded-full bg-[#D4AF37]/5 blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      
      <ChatWidget />
    </div>
  );
}
