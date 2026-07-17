'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeIframe, focusIframe, toggleMinimizeIframe } from '@/store/slices/agentSlice';
import { X, Maximize2, Minimize2, Minus } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function IframeModal() {
  const dispatch = useAppDispatch();
  const { iframes, activeIframeId } = useAppSelector((state) => state.agent);
  const [isMaximized, setIsMaximized] = useState(false);

  
  const activeIframe = iframes.find((f) => f.id === activeIframeId);

  if (!activeIframe || iframes.length === 0) return null;

  return (
    <AnimatePresence>
      {iframes.map((iframe) => {
        const isActive = iframe.id === activeIframeId;
        const isMinimized = iframe.isMinimized;

        if (isMinimized) {
          return (
            <motion.div
              key={iframe.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="fixed bottom-4 right-4 z-[9998]"
            >
              <button
                onClick={() => {
                  dispatch(focusIframe(iframe.id));
                  dispatch(toggleMinimizeIframe(iframe.id));
                }}
                className="px-4 py-2 bg-[var(--background)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition shadow-lg flex items-center gap-2"
              >
                <span className="text-sm font-cairo">{iframe.title}</span>
                <span className="text-xs text-[var(--text-muted)]">(مصغر)</span>
              </button>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={iframe.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--surface-overlay)] backdrop-blur-xl"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                dispatch(closeIframe(iframe.id));
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{
                scale: isMaximized ? 1 : 0.98,
                opacity: 1,
                y: 0,
              }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative rounded-2xl overflow-hidden glass-card shadow-2xl border-[var(--glass-border)]"
              style={{
                width: isMaximized ? '100vw' : iframe.width || 1000,
                height: isMaximized ? '100vh' : iframe.height || 750,
                maxWidth: '98vw',
                maxHeight: '95vh',
                backgroundColor: iframe.backgroundColor || 'var(--background)',
              }}
            >
              {}
              <div className="flex items-center justify-between px-6 py-4 bg-[var(--background)] border-b border-[var(--glass-border)]">
                <h3 className="text-[var(--text-primary)] font-bold font-cairo">{iframe.title}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      dispatch(focusIframe(iframe.id));
                      dispatch(toggleMinimizeIframe(iframe.id));
                    }}
                    className="p-2 hover:bg-[var(--glass-surface)] rounded-lg text-[var(--text-inactive)] hover:text-[var(--text-primary)] transition"
                    title="تصغير"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-2 hover:bg-[var(--glass-surface)] rounded-lg text-[var(--text-inactive)] hover:text-[var(--text-primary)] transition"
                    title={isMaximized ? 'تصغير النافذة' : 'تكبير النافذة'}
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => dispatch(closeIframe(iframe.id))}
                    className="p-2 rounded-lg text-[var(--text-inactive)] hover:bg-[var(--status-error)] hover:text-white transition"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {}
              <iframe
                src={iframe.url}
                className="w-full h-full"
                style={{
                  backgroundColor: iframe.backgroundColor || 'var(--background)',
                  border: 'none',
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                loading="lazy"
              />
            </motion.div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}