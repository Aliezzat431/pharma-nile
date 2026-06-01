import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import { AuthProvider } from '@/hooks/useAuth';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import UndoToast from '@/components/ui/UndoToast';
import AgentCopilot from '@/components/agent/AgentCopilot';
import WorkspaceManager from '@/components/agent/WorkspaceManager';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: 'PharmaNile - Pharmacy Stock Management System',
  description: 'Premium glassmorphism pharmacy OS for the Egyptian market',
};

import { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${cairo.variable}`}>
      <body className="antialiased bg-[#050505] text-white font-cairo">
        <StoreProvider>
          <AuthProvider>
            <Suspense fallback={<div className="min-h-screen bg-[#050505] animate-pulse"></div>}>
              <LayoutWrapper>
                 {children}
              </LayoutWrapper>
            </Suspense>
            <UndoToast />
            <AgentCopilot />
            <WorkspaceManager />
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
