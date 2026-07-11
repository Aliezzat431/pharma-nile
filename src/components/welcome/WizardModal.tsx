'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Lock, Eye, EyeOff, Search, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, RefreshCw, Key, Landmark, Bug, XCircle, X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import gsap from 'gsap';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WizardModal({ isOpen, onClose }: WizardModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase] = useState<'choose-chain' | 'verify-password' | 'choose-branch'>('choose-chain');
  const [chains, setChains] = useState<{ id: string; name: string }[]>([]);
  const [filteredChains, setFilteredChains] = useState<{ id: string; name: string }[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<string>('');
  const [selectedChainName, setSelectedChainName] = useState<string>('');
  const [chainPassword, setChainPassword] = useState<string>('');
  const [branches, setBranches] = useState<{ id: string; name: string; address?: string | null; phone?: string | null }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wizardError, setWizardError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);
  
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [debugDetails, setDebugDetails] = useState<{
    step: string;
    error: string;
    details: any;
  } | null>(null);

  const loadChains = async () => {
    setIsLoading(true);
    setWizardError('');
    setDebugDetails(null);
    try {
      const { data, error } = await supabase
        .from('chains')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setChains(data || []);
      setFilteredChains(data || []);
    } catch (err: any) {
      console.error("Error loading chains:", err);
      setDebugDetails({
        step: 'تحميل السلاسل',
        error: err.message || 'خطأ غير معروف',
        details: err
      });
      setWizardError(`❌ تعذر تحميل قائمة السلاسل: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadChains();
      setPhase('choose-chain');
    }
  }, [isOpen]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredChains(chains);
    } else {
      setFilteredChains(chains.filter(c => c.name.toLowerCase().includes(query)));
    }
  }, [searchQuery, chains]);

  const handleSelectChain = (id: string, name: string) => {
    setSelectedChainId(id);
    setSelectedChainName(name);
    setChainPassword('');
    setWizardError('');
    setDebugDetails(null);
    setPhase('verify-password');
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chainPassword.trim()) {
      setWizardError("يرجى إدخال كلمة مرور السلسلة.");
      return;
    }

    setIsLoading(true);
    setWizardError('');
    setDebugDetails(null);
    
    try {
      const { data: chainExists, error: chainCheckError } = await supabase
        .from('chains')
        .select('id, name, password')
        .eq('id', selectedChainId)
        .single();

      if (chainCheckError) {
        setDebugDetails({
          step: 'التحقق من وجود السلسلة',
          error: chainCheckError.message,
          details: chainCheckError
        });
        setWizardError(`❌ السلسلة غير موجودة: ${chainCheckError.message}`);
        setIsLoading(false);
        return;
      }

      if (!chainExists) {
        setDebugDetails({
          step: 'التحقق من وجود السلسلة',
          error: 'السلسلة غير موجودة في قاعدة البيانات',
          details: { chainId: selectedChainId }
        });
        setWizardError('❌ السلسلة غير موجودة في النظام');
        setIsLoading(false);
        return;
      }

      if (!chainExists.password) {
        setDebugDetails({
          step: 'التحقق من كلمة المرور',
          error: 'كلمة المرور غير محددة لهذه السلسلة',
          details: { chainName: chainExists.name }
        });
        setWizardError('⚠️ هذه السلسلة ليس لديها كلمة مرور محددة. يرجى التواصل مع المدير.');
        setIsLoading(false);
        return;
      }

      const { data: isMatch, error: rpcError } = await supabase.rpc('verify_chain_password', {
        p_chain_id: selectedChainId,
        p_password: chainPassword
      });

      if (rpcError) {
        setDebugDetails({
          step: 'RPCverify',
          error: rpcError.message,
          details: rpcError
        });
        setWizardError(`❌ خطأ في التحقق من صحة كود التشفير: ${rpcError.message}`);
        setIsLoading(false);
        return;
      }

      if (isMatch) {
        setPasswordSuccess(true);
        setWizardError('');
        
        const { data: branchData, error: bError } = await supabase
          .from('pharmacies')
          .select('id, name, address, phone')
          .eq('chain_id', selectedChainId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (bError) {
          setDebugDetails({
            step: 'جلب فروع السلسلة',
            error: bError.message,
            details: bError
          });
          setWizardError(`✅ تم التحقق ولكن حدث خطأ في جلب الفروع: ${bError.message}`);
          setIsLoading(false);
          return;
        }

        setTimeout(() => {
          setBranches(branchData || []);
          setPasswordSuccess(false);
          setPhase('choose-branch');
        }, 1000);
      } else {
        setWizardError("❌ كلمة مرور السلسلة غير صحيحة. يرجى المحاولة مرة أخرى.");
      }
    } catch (err: any) {
      setDebugDetails({
        step: 'خطأ غير متوقع',
        error: err.message,
        details: err
      });
      setWizardError(`❌ خطأ غير متوقع: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBranch = (branchId: string) => {
    const maxAge = 31536000;
    document.cookie = `pharma-nile-visited=true; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `pharma-nile-selected-chain-id=${selectedChainId}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `pharma-nile-selected-pharmacy-id=${branchId}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `pharma-nile-chain-verified=true; path=/; max-age=${maxAge}; SameSite=Lax`;

    localStorage.setItem('selected_pharmacy_id', branchId);
    localStorage.setItem('selected_chain_id', selectedChainId);

    onClose();
    router.push('/auth/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-cairo">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-md p-6 overflow-hidden border bg-[#0d1425]/90 border-white/10 glass-panel rounded-3xl text-right shadow-2xl"
            dir="rtl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute left-4 top-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Choose Chain */}
            {phase === 'choose-chain' && (
              <div className="pt-2">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto bg-cyan-400/10 rounded-2xl flex items-center justify-center mb-3 border border-cyan-400/20">
                    <Landmark className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">اختر سلسلة الصيدليات</h3>
                  <p className="text-gray-400 text-xs mt-1">تحديد شبكة أو مالك السلسلة للدخول إليها</p>
                </div>

                {wizardError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{wizardError}</span>
                  </div>
                )}

                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-cyan-400/50 transition-all text-sm text-right"
                    placeholder="ابحث عن سلسلة الصيدليات..."
                  />
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 select-none custom-scrollbar">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                      <span className="text-gray-400 text-xs">جاري تحميل السلاسل المتوفرة...</span>
                    </div>
                  ) : filteredChains.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-xs">لا توجد سلاسل مطابقة للبحث.</p>
                      <button
                        onClick={() => { onClose(); router.push('/auth/register'); }}
                        className="mt-2 text-cyan-400 text-xs font-bold hover:underline"
                      >
                        تسجيل صيدلية منفصلة جديدة
                      </button>
                    </div>
                  ) : (
                    filteredChains.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectChain(c.id, c.name)}
                        className="w-full text-right p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] hover:border-cyan-400/40 transition-all duration-200 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
                          <span className="font-bold text-white text-sm">{c.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-[-3px] transition-transform" />
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-400">لإنشاء صيدلية جديدة في النظام؟</span>
                  <button
                    onClick={() => { onClose(); router.push('/auth/register'); }}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    إنشاء حساب جديد
                  </button>
                </div>
              </div>
            )}

            {/* Verify Password */}
            {phase === 'verify-password' && (
              <div className="pt-2">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto bg-cyan-400/10 rounded-2xl flex items-center justify-center mb-3 border border-cyan-400/20">
                    <Lock className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">رمز حماية السلسلة</h3>
                  <p className="text-gray-400 text-xs mt-1">سلسلة: <span className="text-white font-bold">{selectedChainName}</span></p>
                </div>

                {wizardError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{wizardError}</span>
                  </div>
                )}

                {debugDetails && showDebug && (
                  <div className="mb-4 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-xs font-mono">
                    <p className="text-yellow-400 font-bold mb-1">تفاصيل الخطأ:</p>
                    <p className="text-gray-300">{debugDetails.error}</p>
                  </div>
                )}

                {passwordSuccess ? (
                  <div className="flex flex-col items-center justify-center py-6 text-green-400 gap-2">
                    <CheckCircle2 className="w-12 h-12 animate-bounce" />
                    <span className="font-bold text-sm">تم التحقق من الوصول بنجاح!</span>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyPassword} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-400 mr-1 block">كلمة مرور السلسلة</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={chainPassword}
                          onChange={(e) => setChainPassword(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-10 pl-10 text-white focus:outline-none focus:border-cyan-400/50 transition-all text-sm text-left"
                          placeholder="كلمة مرور السلسلة"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 hover:text-cyan-400 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <Key className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm rounded-xl hover:scale-[1.01] active:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>جاري التحقق...</span>
                        </>
                      ) : (
                        <span>التحقق والدخول</span>
                      )}
                    </button>
                  </form>
                )}

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => { setPhase('choose-chain'); setWizardError(''); setDebugDetails(null); }}
                    className="text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>رجوع لاختيار السلسلة</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-gray-500 hover:text-cyan-400 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Bug className="w-3.5 h-3.5" />
                    <span>تصحيح</span>
                  </button>
                </div>
              </div>
            )}

            {/* Choose Branch */}
            {phase === 'choose-branch' && (
              <div className="pt-2">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto bg-cyan-400/10 rounded-2xl flex items-center justify-center mb-3 border border-cyan-400/20">
                    <Building2 className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">اختر الفرع / الصيدلية</h3>
                  <p className="text-gray-400 text-xs mt-1">السلسلة: <span className="text-white font-bold">{selectedChainName}</span></p>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 select-none custom-scrollbar">
                  {branches.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-xs">لا يوجد فروع مضافة لهذه السلسلة بعد.</p>
                      <button
                        onClick={() => { onClose(); router.push('/auth/register'); }}
                        className="mt-2 text-cyan-400 text-xs font-bold hover:underline"
                      >
                        سجل صيدلية جديدة
                      </button>
                    </div>
                  ) : (
                    branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBranch(b.id)}
                        className="w-full text-right p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] hover:border-cyan-400/40 transition-all duration-200 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{b.name}</span>
                          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-[-3px] transition-transform" />
                        </div>
                        {b.address && <span className="text-xs text-gray-400">{b.address}</span>}
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => { setPhase('verify-password'); setWizardError(''); setDebugDetails(null); }}
                    className="text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>رجوع لرمز الحماية</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
