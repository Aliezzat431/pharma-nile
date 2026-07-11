import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'فارما نايل — نظام إدارة الصيدليات السحابي الأول في مصر',
  description:
    'فارما نايل هو نظام إدارة الصيدليات السحابي المتكامل الذي يضم كاشير البيع، تتبع الصلاحيات، الجرد بالباركود، وتقارير الأرباح. يعمل أوفلاين بالكامل ومناسب للصيدليات الفردية والسلاسل الكبيرة.',
  keywords: [
    'نظام صيدلية',
    'إدارة صيدلية',
    'كاشير صيدلية',
    'POS صيدلية',
    'نظام مخزون صيدلية',
    'فارما نايل',
    'برنامج صيدلية مصر',
    'نظام صلاحية أدوية',
    'إدارة مخزن دواء',
    'سحابي صيدلية',
  ],
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: 'https://pharma-nile.cloud/welcome',
    siteName: 'فارما نايل',
    title: 'فارما نايل — نظام إدارة الصيدليات السحابي',
    description:
      'أكثر من 500 صيدلية في مصر تثق بفارما نايل. كاشير فوري، جرد ذكي، وتقارير مبيعات سحابية متكاملة. جرب مجاناً 14 يوماً.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'فارما نايل — نظام إدارة الصيدليات',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فارما نايل — نظام إدارة الصيدليات السحابي',
    description: 'أكثر من 500 صيدلية في مصر تثق بفارما نايل. جرب مجاناً 14 يوماً.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: 'https://pharma-nile.cloud/welcome',
  },
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090d16]" />}>
      {children}
    </Suspense>
  );
}
