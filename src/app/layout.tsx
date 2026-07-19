import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import { AuthProvider } from '@/hooks/useAuth';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import UndoToast from '@/components/ui/UndoToast';
import SyncToastProvider from '@/components/ui/SyncToastProvider';
import ServiceWorkerRegistrar from '@/components/shared/ServiceWorkerRegistrar';
import AgentCopilot from '@/components/agent/AgentCopilot';
import WorkspaceManager from '@/components/agent/WorkspaceManager';
import DevToolsBlocker from '@/components/shared/DevToolsBlocker';
import { ThemeProvider } from 'next-themes';
import { GlobalErrorBoundary } from '@/lib/error-boundary';
import { IframeModal } from '@/components/ui/IframeModal'; 

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });

export const metadata: Metadata = {
  metadataBase: new URL('https://pharma-nile.vercel.app'),
  title: {
    default: 'PharmaNile — Premium Medical OS & Pharmacy Management',
    template: '%s | PharmaNile',
  },
  description: 'نظام إدارة صيدلية متكامل مع نقطة بيع تعمل بدون إنترنت، استيراد فواتير بالذكاء الاصطناعي، وإدارة شاملة للمخزون والعمليات الطبية. Advanced POS, AI bill importing, and medical operations.',
  keywords: ['PharmaNile', 'فارما نايل', 'إدارة الصيدليات', 'Pharmacy Software', 'Medical OS', 'POS صيدلية'],
  openGraph: {
    title: 'PharmaNile — Premium Medical OS & Pharmacy Management',
    description: 'نظام إدارة الفواتير والمخزون الطبي المتطور - PharmaNile',
    type: 'website',
    locale: 'ar_EG',
    siteName: 'PharmaNile',
    url: 'https://pharma-nile.vercel.app',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PharmaNile Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PharmaNile — Premium Medical OS',
    description: 'نظام إدارة الفواتير والمخزون الطبي المتطور',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/shortcut-icon.png',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  themeColor: '#0891B2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PharmaNile',
  },
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
        <GlobalErrorBoundary>
          <DevToolsBlocker />
          <ServiceWorkerRegistrar />
          <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
            <StoreProvider>
              <AuthProvider>
                <Suspense fallback={<div className="min-h-screen bg-[var(--background)] animate-pulse"></div>}>
                  <LayoutWrapper>
                     {children}
                  </LayoutWrapper>
                </Suspense>
                <UndoToast />
                <SyncToastProvider />
                <AgentCopilot />
                <WorkspaceManager />
                <IframeModal /> {}
              </AuthProvider>
            </StoreProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}