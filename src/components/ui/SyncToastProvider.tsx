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

// Singleton event bus for showing toasts from anywhere
type ToastListener = (toast: Omit<Toast, 'id'>) => void;
const listeners: ToastListener[] = [];

export const showToast = (toast: Omit<Toast, 'id'>) => {
  listeners.forEach((l) => l(toast));
};

const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; borderColor: string; bgColor: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  error: {
    icon: <AlertTriangle className="w-5 h-5" />,
    borderColor: 'border-red-500/40',
    bgColor: 'bg-red-500/10',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  info: {
    icon: <CloudUpload className="w-5 h-5" />,
    borderColor: 'border-[#00CED1]/40',
    bgColor: 'bg-[#00CED1]/10',
    iconColor: 'text-[#00CED1]',
  },
  offline: {
    icon: <WifiOff className="w-5 h-5" />,
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  online: {
    icon: <Wifi className="w-5 h-5" />,
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
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
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[260px] max-w-[360px] ${cfg.bgColor} ${cfg.borderColor}`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 ${cfg.iconColor}`}>
                {cfg.icon}
              </div>

              {/* Message */}
              <p className="flex-1 text-sm text-white font-cairo leading-snug">
                {toast.message}
              </p>

              {/* Close */}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress bar */}
              {toast.duration! > 0 && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: toast.duration! / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-full ${
                    toast.variant === 'success' || toast.variant === 'online'
                      ? 'bg-emerald-400'
                      : toast.variant === 'error'
                      ? 'bg-red-400'
                      : toast.variant === 'offline' || toast.variant === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-[#00CED1]'
                  }`}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
