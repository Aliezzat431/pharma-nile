'use client';

import { useState, useEffect } from 'react';
import { Pill, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface NavbarProps {
  onOpenWizard: () => void;
}

export default function Navbar({ onOpenWizard }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  const menuItems = [
    { label: 'المميزات', href: '#features' },
    { label: 'لقطات الشاشة', href: '#screens' },
    { label: 'لماذا فارما نايل', href: '#why-us' },
    { label: 'الأسعار', href: '#pricing' },
    { label: 'آراء العملاء', href: '#testimonials' },
    { label: 'الأسئلة الشائعة', href: '#faq' },
    { label: 'اتصل بنا', href: '#contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: topOffset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header 
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[var(--background)]/85 backdrop-blur-md border-b border-white/10 py-3 shadow-lg' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Right Section: Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg relative group">
            <Pill className="w-5.5 h-5.5 text-white group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-400/10 to-transparent" />
          </div>
          <span className="text-xl font-black text-white font-cairo tracking-tight">
            فارما <span className="text-cyan-400">نايل</span>
          </span>
        </div>

        {/* Middle Section: Desktop Nav links */}
        <nav className="hidden lg:flex items-center gap-6">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-gray-300 hover:text-cyan-400 text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Left Section: Action Buttons + Theme Toggle */}
        <div className="flex items-center gap-4">
          {/* Light/Dark Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all active:scale-95 border border-white/5"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
            </button>
          )}

          {/* Desktop Call to actions */}
          <button
            onClick={onOpenWizard}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 active:scale-95 transition-all"
          >
            دخول النظام
          </button>
          <button
            onClick={onOpenWizard}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white shadow-md active:scale-95 transition-all"
          >
            ابدأ التجربة مجاناً
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bg-[#0c1221]/95 backdrop-blur-lg border-b border-white/10 py-6 px-4 space-y-4 shadow-2xl flex flex-col items-center">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-gray-300 hover:text-cyan-400 text-sm font-semibold tracking-wide transition-colors py-1 block w-full text-center"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-4 border-t border-white/5 flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={() => { setIsMobileMenuOpen(false); onOpenWizard(); }}
              className="w-full py-3 rounded-xl text-sm font-bold bg-white/5 text-gray-200 border border-white/10 text-center"
            >
              دخول النظام
            </button>
            <button
              onClick={() => { setIsMobileMenuOpen(false); onOpenWizard(); }}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-center shadow-md font-cairo"
            >
              التسجيل المجاني (14 يوماً)
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
