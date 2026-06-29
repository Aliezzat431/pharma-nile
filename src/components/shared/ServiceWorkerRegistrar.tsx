'use client';

import { useEffect } from 'react';

/**
 * Registers the PharmaNile Service Worker for PWA offline support.
 * Must be a client component mounted inside the root layout.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New SW installed — silently skip waiting so it activates on next visit
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        console.log('[SW] Registered. Scope:', registration.scope);
      } catch (err) {
        console.error('[SW] Registration failed:', err);
      }
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}
