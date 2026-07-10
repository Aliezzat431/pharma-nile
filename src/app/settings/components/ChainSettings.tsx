"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Key, List, PlusCircle, AlertCircle, CheckCircle2, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChainSettings() {
  const { user } = useAuth();
  const supabase = createClient();

  const chainId = user?.user_metadata?.chain_id;

  const [chainName, setChainName] = useState("");
  const [chainPassword, setChainPassword] = useState("");
  const [pharmacies, setPharmacies] = useState<{ id: string; name: string; address: string | null; phone: string | null; created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isAddingPharmacy, setIsAddingPharmacy] = useState(false);

  
  const [newPharmName, setNewPharmName] = useState("");
  const [newPharmAddress, setNewPharmAddress] = useState("");
  const [newPharmPhone, setNewPharmPhone] = useState("");

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!chainId) return;

    const loadChainData = async () => {
      setIsLoading(true);
      try {
        
        const { data: chain, error: cErr } = await supabase
          .from('chains')
          .select('name, password')
          .eq('id', chainId)
          .maybeSingle();

        if (cErr) throw cErr;
        if (chain) {
          setChainName(chain.name);
          setChainPassword(chain.password || "");
        }

        
        const { data: pharms, error: phErr } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('chain_id', chainId)
          .order('created_at', { ascending: false });

        if (phErr) throw phErr;
        setPharmacies(pharms || []);
      } catch (err: any) {
        console.error("Error loading chain data:", err);
        setMessage({ type: 'error', text: 'حدث خطأ أثناء تحميل بيانات السلسلة.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadChainData();
  }, [chainId]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chainId) return;

    setIsSavingPassword(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('chains')
        .update({ password: chainPassword })
        .eq('id', chainId);

      if (error) throw error;
      setMessage({ type: 'success', text: 'تم تحديث كلمة مرور السلسلة بنجاح!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'فشل تحديث كلمة المرور.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAddPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chainId) return;

    if (!newPharmName.trim()) {
      setMessage({ type: 'error', text: 'يرجى إدخال اسم الصيدلية.' });
      return;
    }

    setIsAddingPharmacy(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .insert([
          {
            name: newPharmName.trim(),
            address: newPharmAddress.trim() || null,
            phone: newPharmPhone.trim() || null,
            chain_id: chainId,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: `تمت إضافة الصيدلية "${newPharmName}" بنجاح!` });
      setPharmacies(prev => [data, ...prev]);

      
      setNewPharmName("");
      setNewPharmAddress("");
      setNewPharmPhone("");
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'فشل إضافة الصيدلية.' });
    } finally {
      setIsAddingPharmacy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--nile-teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-cairo text-right" dir="rtl">
      {}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/25 text-green-400' 
                : 'bg-red-500/10 border-red-500/25 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-bold">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/40">
        <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
          <Building2 className="w-8 h-8 text-[var(--nile-teal)]" />
          <div>
            <h2 className="text-xl font-black text-white">{chainName || "سلسلة صيدليات"}</h2>
            <p className="text-xs text-gray-400">إدارة معلومات وبيانات الوصول لسلسلة الصيدليات الخاصة بك.</p>
          </div>
        </div>

        {}
        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 block mr-1">
              كلمة مرور السلسلة (تُستخدم للتحقق أثناء تسجيل الدخول)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={chainPassword}
                onChange={(e) => setChainPassword(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-11 pl-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm font-sans"
                placeholder="أدخل كلمة مرور قوية"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSavingPassword}
            className="px-6 py-2.5 bg-[var(--nile-teal)] text-black font-bold text-sm rounded-xl hover:bg-[var(--royal-gold)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {isSavingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>تحديث كلمة المرور</span>
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/40 h-fit">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <PlusCircle className="w-6 h-6 text-[var(--nile-teal)]" />
            <h3 className="text-lg font-bold text-white">إضافة فرع جديد للسلسلة</h3>
          </div>

          <form onSubmit={handleAddPharmacy} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 block mr-1">اسم الصيدلية / الفرع *</label>
              <input
                type="text"
                value={newPharmName}
                onChange={(e) => setNewPharmName(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm font-cairo"
                placeholder="صيدلية النيل - فرع القاهرة"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 block mr-1">العنوان</label>
              <input
                type="text"
                value={newPharmAddress}
                onChange={(e) => setNewPharmAddress(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm font-cairo"
                placeholder="شارع التسعين، التجمع الخامس"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 block mr-1">رقم الهاتف</label>
              <input
                type="text"
                value={newPharmPhone}
                onChange={(e) => setNewPharmPhone(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm font-sans"
                placeholder="01012345678"
              />
            </div>

            <button
              type="submit"
              disabled={isAddingPharmacy}
              className="w-full py-3 bg-gradient-to-r from-[var(--nile-teal)] to-[var(--royal-gold)] text-black font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isAddingPharmacy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الإضافة...</span>
                </>
              ) : (
                <span>إضافة الصيدلية للشبكة</span>
              )}
            </button>
          </form>
        </div>

        {}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/40">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <List className="w-6 h-6 text-[var(--nile-teal)]" />
            <h3 className="text-lg font-bold text-white">فروع الصيدليات المسجلة ({pharmacies.length})</h3>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {pharmacies.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">لا توجد صيدليات مضافة بعد لهذه السلسلة.</p>
            ) : (
              pharmacies.map((p) => (
                <div key={p.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">{p.name}</h4>
                    <p className="text-xs text-gray-400">{p.address || "بدون عنوان"}</p>
                    <p className="text-xs text-gray-400 font-sans">{p.phone || "بدون هاتف"}</p>
                  </div>
                  <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full font-bold">
                    نشط
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
