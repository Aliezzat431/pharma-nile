'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`bg-[var(--glass-surface-heavy)] rounded-lg overflow-hidden relative ${className}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--glass-surface-heavy)] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </motion.div>
      ))}
    </>
  );
}
