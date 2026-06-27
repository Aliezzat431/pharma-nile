'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface LiveScannerProps {
  onScan: (barcode: string) => void;
  enabled?: boolean;
}

export default function LiveScanner({ onScan, enabled = true }: LiveScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1200;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }, []);

  const startScanner = useCallback(async () => {
    if (!enabled) return;

    await new Promise(r => setTimeout(r, 500));
    if (!mountedRef.current) return;

    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
        try { scannerRef.current.clear(); } catch {}
      }

      const el = document.getElementById('hidden-scanner-viewport');
      if (!el) return;

      const scanner = new Html5Qrcode('hidden-scanner-viewport', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 400, height: 400 },
          disableFlip: false,
        },
        (decodedText) => {

          const now = Date.now();
          if (decodedText === lastScanTimeRef.current.toString()) return;
          if (now - lastScanTimeRef.current < 3000) return;
          lastScanTimeRef.current = now;

          playBeep();
          onScan(decodedText);
        },
        () => {}
      );
    } catch (err: any) {

      if (err?.name === 'NotFoundError' || err?.message?.includes('Requested device not found')) return;
      console.warn('Scanner init skipped:', err?.message || err);
    }
  }, [enabled, onScan, playBeep]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      startScanner();
    }
    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        try {
          const stopPromise = scannerRef.current.stop();
          if (stopPromise) stopPromise.catch(() => {});
        } catch (e) {

        }
        try { scannerRef.current.clear(); } catch {}
        scannerRef.current = null;
      }
    };
  }, [enabled, startScanner]);


  return (
    <div 
      id="hidden-scanner-viewport" 
      style={{ 
        position: 'fixed', 
        top: '-9999px', 
        left: '-9999px',
        width: '1px', 
        height: '1px',
        opacity: 0, 
        pointerEvents: 'none', 
        overflow: 'hidden',
        zIndex: -1
      }}
      aria-hidden="true" 
    />
  );
}

