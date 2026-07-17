'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronDown, Check, Loader2, Plus, X, MapPin, Phone } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  is_active: boolean;
  chain_id?: string | null;
}

interface Props {
  isCollapsed: boolean;
}

export default function BranchSwitcher({ isCollapsed }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [branches, setBranches]           = useState<Branch[]>([]);
  const [currentId, setCurrentId]         = useState<string | null>(null);
  const [isOpen, setIsOpen]               = useState(false);
  const [isSwitching, setIsSwitching]     = useState(false);
  const [showNewForm, setShowNewForm]     = useState(false);
  const [isCreating, setIsCreating]       = useState(false);
  const [newName, setNewName]             = useState('');
  const [newAddress, setNewAddress]       = useState('');
  const [newPhone, setNewPhone]           = useState('');
  const [errorMsg, setErrorMsg]           = useState('');

  const userRole    = user?.user_metadata?.role;
  const chainId     = user?.user_metadata?.chain_id;
  const isAdmin     = userRole === 'admin';
  const isDeveloper = userRole === 'developer';

  
  const shouldRender = !!chainId || isDeveloper;

  const [chains, setChains] = useState<any[]>([]);

  useEffect(() => {
    if (isDeveloper) {
      supabase
        .from('chains')
        .select('id, name')
        .then(({ data }) => setChains(data ?? []));
    }
  }, [isDeveloper, supabase]);

  const fetchBranches = useCallback(async () => {
    if (isDeveloper) {
      const { data } = await supabase
        .from('pharmacies')
        .select('id, name, address, phone, is_active, chain_id')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      setBranches(data ?? []);
    } else {
      if (!chainId) return;
      const { data } = await supabase
        .from('pharmacies')
        .select('id, name, address, phone, is_active, chain_id')
        .eq('chain_id', chainId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      setBranches(data ?? []);
    }
  }, [chainId, isDeveloper, supabase]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    const storedId = localStorage.getItem('selected_pharmacy_id');
    const metaId   = user?.user_metadata?.pharmacy_id;
    setCurrentId(storedId || metaId || null);
  }, [user]);

  const currentBranch = branches.find(b => b.id === currentId);

  const handleSwitch = async (branch: Branch & { chain_id?: string | null }) => {
    if (branch.id === currentId) { setIsOpen(false); return; }
    setIsSwitching(true);
    try {
      localStorage.setItem('selected_pharmacy_id', branch.id);
      await supabase.auth.updateUser({ 
        data: { 
          pharmacy_id: branch.id,
          chain_id: branch.chain_id || null 
        } 
      });
      setCurrentId(branch.id);
      setIsOpen(false);
      
      await supabase
        .from('user_pharmacy_access')
        .upsert({ user_id: user!.id, pharmacy_id: branch.id, role: userRole ?? 'staff', is_primary: false },
                 { onConflict: 'user_id,pharmacy_id', ignoreDuplicates: true });
      router.refresh();
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setErrorMsg('الاسم مطلوب'); return; }
    setIsCreating(true);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/chain/pharmacies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ name: newName, address: newAddress, phone: newPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الفرع');
      await fetchBranches();
      setNewName(''); setNewAddress(''); setNewPhone('');
      setShowNewForm(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!shouldRender || branches.length === 0) return null;

  return (
    <div className="relative mx-3 mb-2">
      {}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] 
          hover:bg-[var(--glass-surface-heavy)] transition-all group ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        title={isCollapsed ? (currentBranch?.name ?? 'الفروع') : undefined}
      >
        <div className={`flex items-center gap-2 min-w-0 ${isCollapsed ? '' : 'flex-1'}`}>
          {isSwitching
            ? <Loader2 className="w-4 h-4 text-[var(--nile-teal)] animate-spin shrink-0" />
            : <Building2 className="w-4 h-4 text-[var(--nile-teal)] shrink-0" />
          }
          {!isCollapsed && (
            <span className="text-xs font-bold text-[var(--foreground)] truncate font-cairo">
              {currentBranch?.name ?? 'اختر فرعاً'}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-inactive)] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {}
      <AnimatePresence>
        {isOpen && (
          <>
            {}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[199]"
              style={{
                background: 'var(--surface-overlay)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
              onClick={() => setIsOpen(false)}
            />

            {}
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`fixed z-[200] w-80 bg-[var(--background)] border border-[var(--glass-border)] 
                rounded-2xl shadow-2xl overflow-hidden
                ${isCollapsed ? 'right-16 top-1/2 -translate-y-1/2' : 'bottom-20 right-4'}`}
              dir="rtl"
            >
              {}
              <div className="px-4 py-3 border-b border-[var(--glass-border)] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest font-cairo">
                  الفروع ({branches.length})
                </span>
                <button onClick={() => setIsOpen(false)} className="text-[var(--text-inactive)] hover:text-[var(--foreground)] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {}
              <div className="max-h-56 overflow-y-auto custom-scrollbar">
                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => handleSwitch(branch)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--glass-surface)] transition-colors text-right group"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      branch.id === currentId
                        ? 'bg-[var(--nile-teal)]/20 border border-[var(--nile-teal)]/40'
                        : 'bg-[var(--glass-surface)] group-hover:bg-[var(--glass-surface-heavy)]'
                    }`}>
                      {branch.id === currentId
                        ? <Check className="w-4 h-4 text-[var(--nile-teal)]" />
                        : <Building2 className="w-4 h-4 text-[var(--text-inactive)]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate font-cairo ${
                        branch.id === currentId ? 'text-[var(--nile-teal)]' : 'text-[var(--foreground)]'
                      }`}>{branch.name}</p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 items-center">
                        {isDeveloper && branch.chain_id && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-cairo font-bold shrink-0">
                            {chains.find(c => c.id === branch.chain_id)?.name || 'سلسلة منفصلة'}
                          </span>
                        )}
                        {branch.address && (
                          <p className="text-[10px] text-[var(--text-inactive)] truncate flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {branch.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {}
              {isAdmin && (
                <div className="border-t border-[var(--glass-border)]">
                  {!showNewForm ? (
                    <button
                      onClick={() => setShowNewForm(true)}
                      className="w-full px-4 py-3 flex items-center gap-2 text-[var(--nile-teal)] hover:bg-[var(--glass-surface)] transition-all text-sm font-bold font-cairo"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة فرع جديد
                    </button>
                  ) : (
                    <form onSubmit={handleCreateBranch} className="p-3 space-y-2 bg-[var(--surface-elevated)]">
                      {errorMsg && (
                        <p className="text-red-400 text-[11px] font-bold font-cairo">{errorMsg}</p>
                      )}
                      <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="اسم الفرع *"
                        required
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--foreground)] text-xs font-cairo focus:outline-none focus:border-[var(--nile-teal)]/50"
                      />
                      <input
                        type="text"
                        value={newAddress}
                        onChange={e => setNewAddress(e.target.value)}
                        placeholder="العنوان (اختياري)"
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--foreground)] text-xs font-cairo focus:outline-none focus:border-[var(--nile-teal)]/50"
                      />
                      <input
                        type="text"
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                        placeholder="رقم الهاتف (اختياري)"
                        dir="ltr"
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--foreground)] text-xs font-sans focus:outline-none focus:border-[var(--nile-teal)]/50"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isCreating}
                          className="flex-1 py-2 bg-[var(--nile-teal)] text-[var(--background)] text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          إنشاء
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowNewForm(false); setErrorMsg(''); }}
                          className="px-3 py-2 bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-muted)] text-xs rounded-lg hover:bg-[var(--glass-surface-heavy)] transition-all"
                        >
                          إلغاء
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}