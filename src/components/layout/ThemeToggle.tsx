'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5 group relative overflow-hidden"
      aria-label="Toggle Theme"
    >
      <div className="relative z-10 flex items-center justify-center">
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-yellow-400 animate-in spin-in duration-500" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-400 animate-in spin-in duration-500" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </button>
  );
}
