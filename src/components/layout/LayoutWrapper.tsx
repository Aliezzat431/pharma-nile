"use client";

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import ChatWidget from '@/components/chat/ChatWidget';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return <div className="min-h-screen w-full bg-[#050505]">{children}</div>;
  }

  return (
    <div className="flex h-screen w-full relative">
      <Sidebar />
      
      {/* Main Content Area - offset by sidebar width (ml-72 for LTR, mr-72 for RTL) */}
      <main className="flex-1 mr-72 h-screen overflow-y-auto relative z-10 p-8">
        {children}
      </main>
      
      {/* Background ambient lighting effects */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#00CED1]/10 blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="fixed bottom-[-10%] right-[20%] w-[50vw] h-[50vw] rounded-full bg-[#D4AF37]/5 blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      
      <ChatWidget />
    </div>
  );
}
