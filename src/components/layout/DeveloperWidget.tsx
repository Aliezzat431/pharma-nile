"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, Terminal, Shield, RefreshCw, Cpu, HardDrive, 
  Trash2, Layers, UserCheck, Check, Sparkles, Navigation
} from 'lucide-react';

export default function DeveloperWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [statusText, setStatusText] = useState('جاهز');
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  
  const isDev = user?.user_metadata?.role === 'developer';
  const currentPharmacyId = user?.user_metadata?.pharmacy_id;
  const currentChainId = user?.user_metadata?.chain_id;
  const simulatedRole = user?.user_metadata?.simulated_role || 'developer';

  // Load all pharmacies/branches for the developer to impersonate
  useEffect(() => {
    if (isDev && isOpen) {
      const loadBranches = async () => {
        const { data, error } = await supabase
          .from('pharmacies')
          .select('id, name, chain_id, chains(name)');
        
        if (!error && data) {
          setBranches(data);
        }
      };
      
      const testLatency = async () => {
        const start = performance.now();
        await supabase.from('pharmacies').select('id').limit(1);
        setDbLatency(Math.round(performance.now() - start));
      };

      loadBranches();
      testLatency();
    }
  }, [isDev, isOpen]);

  // Don't render anything if the logged-in user is not a developer
  if (!isDev) return null;

  const currentBranchName = branches.find(b => b.id === currentPharmacyId)?.name || 'غير محدد';
  const currentChainName = branches.find(b => b.id === currentPharmacyId)?.chains?.name || 'غير محدد';

  const handleRoleSimulation = async (role: string) => {
    setStatusText('جاري تحديث الصلاحيات...');
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user?.user_metadata,
        simulated_role: role === 'developer' ? null : role
      }
    });

    if (error) {
      setStatusText('فشل التحديث');
    } else {
      setStatusText('تم التحديث! جاري إعادة التحميل...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleBranchImpersonation = async (branchId: string, chainId: string) => {
    setStatusText('جاري تحويل الفرع...');
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user?.user_metadata,
        pharmacy_id: branchId || null,
        chain_id: chainId || null
      }
    });

    if (error) {
      setStatusText('فشل التحويل');
    } else {
      setStatusText('تم التحويل بنجاح! جاري التحديث...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleClearSession = async () => {
    setStatusText('جاري مسح الجلسة...');
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user?.user_metadata,
        pharmacy_id: null,
        chain_id: null,
        simulated_role: null
      }
    });

    if (error) {
      setStatusText('فشل المسح');
    } else {
      setStatusText('تم الاستعادة! جاري إعادة التحميل...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 left-6 z-[120]" dir="rtl">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all border relative cursor-pointer ${
            isOpen 
            ? 'bg-rose-600 border-rose-500 text-white' 
            : 'bg-slate-900/90 border-[var(--nile-teal)]/30 text-[var(--nile-teal)] hover:border-[var(--nile-teal)]'
          }`}
        >
          {isOpen ? (
            <Terminal className="w-6 h-6 animate-pulse" />
          ) : (
            <Code className="w-6 h-6" />
          )}
          
          {/* Active impersonation status indicator */}
          {currentPharmacyId && !isOpen && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] text-black font-extrabold items-center justify-center">✓</span>
            </span>
          )}
        </motion.button>
      </div>

      {/* Floating Impersonation Command Center Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, x: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 left-6 w-96 bg-slate-950/95 border border-white/10 rounded-3xl shadow-2xl p-6 z-[130] font-cairo backdrop-blur-xl pointer-events-auto"
            dir="rtl"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--nile-teal)] to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.25)]">
                  <Terminal className="text-white w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">وحدات مطور PharmaNile</h4>
                  <span className="text-[10px] text-gray-500 font-mono">Simulate & Control Tenant</span>
                </div>
              </div>
              
              <span className="text-[10px] bg-slate-900 border border-white/5 px-2.5 py-1 rounded-full text-[var(--nile-teal)] font-mono font-bold">
                {statusText}
              </span>
            </div>

            {/* Quick Simulation Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-gray-500 font-bold">زمن استجابة DB</span>
                <span className="text-white font-mono font-bold">{dbLatency ? `${dbLatency}ms` : '—'}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-gray-500 font-bold">الفرع الحالي</span>
                <span className="text-emerald-400 font-bold truncate">{currentBranchName}</span>
              </div>
            </div>

            {/* Role Simulation Selector */}
            <div className="space-y-2 mb-4">
              <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                محاكاة صلاحيات دور الوظيفة (Role UX):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { value: 'developer', label: 'مطور' },
                  { value: 'admin', label: 'مسؤول' },
                  { value: 'manager', label: 'مدير' },
                  { value: 'staff', label: 'موظف' }
                ].map(r => (
                  <button
                    key={r.value}
                    onClick={() => handleRoleSimulation(r.value)}
                    className={`py-1.5 rounded-lg text-[10.5px] font-bold border transition-all ${
                      simulatedRole === r.value
                      ? 'bg-[var(--nile-teal)]/20 border-[var(--nile-teal)] text-[var(--nile-teal)]'
                      : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fast Branch Switcher */}
            <div className="space-y-2 mb-4">
              <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                تحويل الفرع المستهدف (RLS Context):
              </label>
              <select
                value={currentPharmacyId || ''}
                onChange={(e) => {
                  const b = branches.find(x => x.id === e.target.value);
                  if (b) handleBranchImpersonation(b.id, b.chain_id);
                }}
                className="w-full text-xs font-bold text-white bg-slate-900 border border-white/10 rounded-xl p-2.5 outline-none focus:border-[var(--nile-teal)]/50 font-cairo cursor-pointer"
              >
                <option value="">-- فضاء عام (غير محدد) --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.chains?.name || 'مستقل'})
                  </option>
                ))}
              </select>
            </div>

            {/* Impersonation Info Banner */}
            {currentPharmacyId && (
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-3 mb-4 text-[11px] space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>الصيدلية المحاكاة:</span>
                  <strong className="text-white font-bold">{currentBranchName}</strong>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>السلسلة التابعة:</span>
                  <strong className="text-white font-bold">{currentChainName}</strong>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>معرف الفرع:</span>
                  <code className="text-emerald-400 select-all font-mono font-bold">{currentPharmacyId}</code>
                </div>
              </div>
            )}

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/dev');
                }}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-600/25 transition-all group scale-95 hover:scale-100 cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                <span className="text-[10px] font-bold">لوحة المطور</span>
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/');
                }}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 hover:bg-blue-600/25 transition-all group scale-95 hover:scale-100 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span className="text-[10px] font-bold">الرئيسية</span>
              </button>

              <button
                onClick={handleClearSession}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 bg-rose-600/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-600/25 transition-all group scale-95 hover:scale-100 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">إنهاء الجلسة</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
