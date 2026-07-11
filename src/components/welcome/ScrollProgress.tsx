'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 h-[2px] z-50 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
