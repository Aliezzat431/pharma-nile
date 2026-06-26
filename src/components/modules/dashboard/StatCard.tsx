"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  variant?: 'teal' | 'gold' | 'red';
}

export function StatCard({ label, value, subValue, icon: Icon, variant = 'teal' }: StatCardProps) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      {}
      <div className={cn(
        "absolute -right-10 -bottom-10 w-32 h-32 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40",
        variant === 'teal' ? "bg-nile-teal" : 
        variant === 'gold' ? "bg-royal-gold" : "bg-red-500"
      )} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-3 rounded-xl",
          variant === 'teal' ? "bg-nile-teal/10 text-nile-teal" : 
          variant === 'gold' ? "bg-royal-gold/10 text-royal-gold" : "bg-red-500/10 text-red-500"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {subValue && (
          <span className="text-xs font-medium text-foreground/40 mt-1">
            {subValue}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground/60">{label}</p>
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

