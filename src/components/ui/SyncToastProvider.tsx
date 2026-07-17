'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, WifiOff, Wifi, X, CloudUpload, AlertTriangle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'offline' | 'online';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

type ToastListener = (toast: Omit<Toast, 'id'>) => void;
const listeners: ToastListener[] = [];

export const showToast = (toast: Omit<Toast, 'id'>) => {
  listeners.forEach((l) => l(toast));
};

const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; colorVar: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    colorVar: 'var(--status-success)',
  },
  error: {
    icon: <AlertTriangle className="w-5 h-5" />,
    colorVar: 'var(--status-error)',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    colorVar: 'var(--status-warning)',
  },
  info: {
    icon: <CloudUpload className="w-5 h-5" />,
    colorVar: 'var(--status-info)',
  },
  offline: {
    icon: <WifiOff className="w-5 h-5" />,
    colorVar: 'var(--status-warning)',
  },
  online: {
    icon: <Wifi className="w-5 h-5" />,
    colorVar: 'var(--status-success)',
  },
};

export default function SyncToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const duration = toast.duration ?? 5000;
    setToasts((prev) => [...prev, { ...toast, id, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    listeners.push(addToast);
    return () => {
      const idx = listeners.indexOf(addToast);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, [addToast]);

  return (
    <div className="fixed bottom-10 right-6 z-[200] flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const cfg = variantConfig[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 120, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[260px] max-w-[360px]"
              style={{
                backgroundColor: 'var(--glass-surface-heavy)',
                borderColor: cfg.colorVar,
              }}
            >
              {}
              <div className="flex-shrink-0" style={{ color: cfg.colorVar }}>
                {cfg.icon}
              </div>

              {}
              <p className="flex-1 text-sm text-[var(--text-primary)] font-cairo leading-snug">
                {toast.message}
              </p>

              {}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-[var(--text-inactive)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {}
              {toast.duration! > 0 && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: toast.duration! / 1000, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-full"
                  style={{ backgroundColor: cfg.colorVar }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
