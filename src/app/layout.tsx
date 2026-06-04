import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import { AuthProvider } from '@/hooks/useAuth';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import UndoToast from '@/components/ui/UndoToast';
import AgentCopilot from '@/components/agent/AgentCopilot';
import WorkspaceManager from '@/components/agent/WorkspaceManager';
import DevToolsBlocker from '@/components/shared/DevToolsBlocker';
import { ThemeProvider } from 'next-themes';

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
    <html lang="ar" dir="rtl" className={`${inter.variable} ${cairo.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-[var(--background)] text-[var(--text-primary)] font-cairo">
        <DevToolsBlocker />
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
          <StoreProvider>
            <AuthProvider>
              <Suspense fallback={<div className="min-h-screen bg-[var(--background)] animate-pulse"></div>}>
                <LayoutWrapper>
                   {children}
                </LayoutWrapper>
              </Suspense>
              <UndoToast />
              <AgentCopilot />
              <WorkspaceManager />
            </AuthProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
