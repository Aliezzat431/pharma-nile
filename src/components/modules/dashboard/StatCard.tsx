"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  variant?: 'teal' | 'gold' | 'error';
}

export function StatCard({ label, value, subValue, icon: Icon, variant = 'teal' }: StatCardProps) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      {}
      <div 
        className="absolute -right-10 -bottom-10 w-32 h-32 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40"
        style={{
          backgroundColor: variant === 'teal' ? 'var(--nile-teal)' : 
                           variant === 'gold' ? 'var(--royal-gold)' : 'var(--status-error)'
        }}
      />
      
      <div className="flex justify-between items-start mb-4">
        <div 
          className="p-3 rounded-xl shadow-inner"
          style={{
            backgroundColor: variant === 'teal' ? 'rgba(6, 182, 212, 0.1)' : 
                             variant === 'gold' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: variant === 'teal' ? 'var(--nile-teal)' : 
                   variant === 'gold' ? 'var(--royal-gold)' : 'var(--status-error)'
          }}
        >
          <Icon className="w-6 h-6" />
        </div>
        {subValue && (
          <span className="text-xs font-medium text-[var(--text-muted)] mt-1 font-cairo">
            {subValue}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--text-secondary)] font-cairo cursor-default">{label}</p>
        <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{value}</h3>
      </div>
    </div>
  );
}
