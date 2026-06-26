'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';


export function usePageGSAP<T extends HTMLElement = HTMLDivElement>(stagger = 0.08) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll<HTMLElement>('[data-gsap="fade-up"]');
    if (!els.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        els,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power3.out',
          stagger,
          clearProps: 'transform,opacity',
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [stagger]);

  return ref;
}

/**
 * useGSAPList – animate a list of items whenever the data changes.
 * Attach returned ref to the UL/div container wrapping list items.
 */
export function useGSAPList<T extends HTMLElement = HTMLDivElement>(deps: unknown[]) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    const items = ref.current.children;
    if (!items.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.04,
          clearProps: 'transform,opacity',
        }
      );
    }, ref);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
