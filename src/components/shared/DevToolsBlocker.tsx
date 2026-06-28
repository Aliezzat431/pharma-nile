'use client';

import { useEffect } from 'react';

export default function DevToolsBlocker() {
  useEffect(() => {
    const blockDevTools = (e: KeyboardEvent) => {

      if (e.key === 'F12') {
        // e.preventDefault();
        // e.stopPropagation();
        // return false;
      }

      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('keydown', blockDevTools, true);
    document.addEventListener('contextmenu', blockContextMenu, true);

    return () => {
      document.removeEventListener('keydown', blockDevTools, true);
      document.removeEventListener('contextmenu', blockContextMenu, true);
    };
  }, []);

  return null;
}

