'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, ShieldCheck, Zap, BarChart3, Pill, 
  Building2, Lock, Eye, EyeOff, Search, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, RefreshCw, Key, Landmark
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function WelcomePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const supabase = createClient();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Selector Wizard State
  const [phase, setPhase] = useState<'intro' | 'choose-chain' | 'verify-password' | 'choose-branch'>('intro');
  const [chains, setChains] = useState<{ id: string; name: string }[]>([]);
  const [filteredChains, setFilteredChains] = useState<{ id: string; name: string }[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<string>('');
  const [selectedChainName, setSelectedChainName] = useState<string>('');
  const [chainPassword, setChainPassword] = useState<string>('');
  const [branches, setBranches] = useState<{ id: string; name: string; address?: string | null; phone?: string | null }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wizardError, setWizardError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Loading simulation for dramatic effect
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowContent(true), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 20);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!showContent) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Cinematic Reveal
      tl.to(".loading-screen", { opacity: 0, duration: 1, ease: "power4.inOut" });
      
      tl.fromTo(containerRef.current, 
        { opacity: 0, scale: 1.1 }, 
        { opacity: 1, scale: 1, duration: 2, ease: 'expo.out' },
        "-=0.5"
      );

      // Title Reveal
      tl.fromTo(".char-reveal",
        { y: 100, opacity: 0, rotateX: -90 },
        { y: 0, opacity: 1, rotateX: 0, duration: 1.2, stagger: 0.05, ease: 'expo.out' },
        '-=1.5'
      );

      tl.fromTo(subtitleRef.current,
        { y: 30, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out' },
        '-=1'
      );

      if (featuresRef.current) {
        tl.fromTo(featuresRef.current.children,
          { opacity: 0, y: 40, rotateY: 45 },
          { opacity: 1, y: 0, rotateY: 0, duration: 1, stagger: 0.2, ease: 'power4.out' },
          '-=0.8'
        );
      }

      tl.fromTo(btnRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'back.out(2)' },
        '-=0.5'
      );

      // Infinite floating loop
      gsap.to('.hero-pill', {
        y: -15,
        rotation: 10,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [showContent]);

  // Load chains list from DB
  const loadChains = async () => {
    setIsLoading(true);
    setWizardError('');
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
      setWizardError("تعذر تحميل قائمة السلاسل. يرجى التحقق من الاتصال.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter chains search list
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredChains(chains);
    } else {
      setFilteredChains(chains.filter(c => c.name.toLowerCase().includes(query)));
    }
  }, [searchQuery, chains]);

  const handleStart = async () => {
    await loadChains();
    setPhase('choose-chain');
  };

  const handleSelectChain = (id: string, name: string) => {
    setSelectedChainId(id);
    setSelectedChainName(name);
    setChainPassword('');
    setWizardError('');
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
    try {
      // ✅ Enhanced error handling for RPC call
      const { data: isMatch, error } = await supabase.rpc('verify_chain_password', {
        p_chain_id: selectedChainId,
        p_password: chainPassword
      });

      if (error) {
        console.error("[Chain Password] RPC Error:", error);
        
        // Better error messaging for different failure modes
        if (error.message?.includes('function') || error.message?.includes('does not exist')) {
          setWizardError("خدمة التحقق من السلسلة غير متاحة. يرجى التواصل مع الإدارة.");
        } else if (error.message?.includes('permission') || error.message?.includes('denied')) {
          setWizardError("لا توجد صلاحيات للوصول إلى هذه السلسلة.");
        } else if (error.message?.includes('timeout') || error.message?.includes('connection')) {
          setWizardError("انقطع الاتصال بقاعدة البيانات. يرجى المحاولة مجدداً.");
        } else {
          // Generic error with more context
          setWizardError(`حدث خطأ أثناء فحص كلمة المرور: ${error.message || 'خطأ غير معروف'}`);
        }
        throw error;
      }

      if (isMatch) {
        setPasswordSuccess(true);
        setWizardError('');
        
        // Fetch branches of this chain
        const { data: branchData, error: bError } = await supabase
          .from('pharmacies')
          .select('id, name, address, phone')
          .eq('chain_id', selectedChainId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (bError) {
          console.error("[Chain Branches] Fetch Error:", bError);
          throw bError;
        }

        setTimeout(() => {
          setBranches(branchData || []);
          setPasswordSuccess(false);
          setPhase('choose-branch');
        }, 1000);
      } else {
        setWizardError("كلمة مرور السلسلة غير صحيحة. يرجى المحاولة مرة أخرى.");
      }
    } catch (err: any) {
      console.error("[handleVerifyPassword] Full Error Stack:", {
        message: err?.message,
        code: err?.code,
        status: err?.status,
        details: err?.details,
        hint: err?.hint
      });
      
      // Only show error if not already set by RPC error handler
      if (!wizardError) {
        setWizardError("حدث خطأ أثناء فحص كلمة المرور. يرجى تحديث الصفحة والمحاولة مجدداً.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBranch = (branchId: string) => {
    // 1 Year Expiration cookie setting
    const maxAge = 31536000;
    document.cookie = `pharma-nile-visited=true; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `pharma-nile-selected-chain-id=${selectedChainId}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `pharma-nile-selected-pharmacy-id=${branchId}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `pharma-nile-chain-verified=true; path=/; max-age=${maxAge}; SameSite=Lax`;

    localStorage.setItem('selected_pharmacy_id', branchId);
    localStorage.setItem('selected_chain_id', selectedChainId);

    // Fade out screen and route to login
    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 1.2,
      filter: 'blur(20px)',
      duration: 1,
      ease: 'expo.inOut',
      onComplete: () => {
        router.push('/auth/login');
      }
    });
  };

  const features = [
    { icon: Zap, text: 'استجابة فائقة السرعة', desc: 'أداء معزز بتقنيات Next.js 15', color: 'cyan' },
    { icon: ShieldCheck, text: 'حماية وتشفير متقدم', desc: 'تأمين كامل لبيانات المرضى والمبيعات', color: 'indigo' },
    { icon: BarChart3, text: 'ذكاء اصطناعي تحليلي', desc: 'توقعات دقيقة لحركة المخزون والأرباح', color: 'amber' },
  ];

  return (
    <main 
      ref={containerRef}
      className="min-h-screen bg-[#020202] flex flex-col items-center justify-center overflow-y-auto py-10"
      dir="rtl"
    >
      {/* Loading Phase */}
      {!showContent && (
        <div className="loading-screen fixed inset-0 z-50 bg-[#020202] flex flex-col items-center justify-center gap-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-white/5 border-t-cyan-400 rounded-full flex items-center justify-center"
          >
             <Pill className="text-cyan-400 w-8 h-8" />
          </motion.div>
          <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="font-cairo text-gray-500 text-xs tracking-[0.3em] uppercase">Initialising PharmaNile OS v2.0</p>
        </div>
      )}

      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {showContent && (
        <div className="w-full relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-4 font-cairo">
          <AnimatePresence mode="wait">
            
            {/* Phase 0: Intro */}
            {phase === 'intro' && (
              <motion.div 
                key="intro-phase"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl w-full flex flex-col items-center gap-10 md:gap-16"
              >
                {/* Hero Icon */}
                <div className="hero-pill relative w-24 h-24 md:w-32 md:h-32">
                  <div className="absolute inset-0 bg-cyan-400/20 blur-3xl animate-pulse" />
                  <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl border border-white/20 rounded-[2.5rem] flex items-center justify-center shadow-2xl group hover:shadow-[0_0_40px_#22d3ee] transition-shadow">
                    <Pill className="w-12 h-12 md:w-16 md:h-16 text-cyan-400 transition-transform group-hover:scale-110" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-400/10 to-transparent" />
                  </div>
                </div>

                {/* Typography */}
                <div className="text-center space-y-6">
                  <div className="overflow-hidden py-2">
                    <h1 className="text-7xl md:text-9xl font-black font-cairo text-white tracking-tighter flex items-center justify-center gap-0.5">
                      {"PharmaNile".split("").map((c, i) => (
                        <span key={i} className={`char-reveal inline-block ${c === 'N' || c === 'i' || c === 'l' || c === 'e' ? 'text-cyan-400' : ''}`}>
                          {c}
                        </span>
                      ))}
                    </h1>
                  </div>
                  <p 
                    ref={subtitleRef}
                    className="text-lg md:text-3xl text-gray-400 font-cairo font-light max-w-3xl mx-auto leading-relaxed"
                  >
                    المستقبل هنا. أدر صيدليتك بأحدث تقنيات <span className="text-white font-bold">الذكاء الاصطناعي</span> في تجربة فريدة
                  </p>
                </div>

                {/* Features Grid */}
                <div 
                  ref={featuresRef}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full"
                >
                  {features.map((f, i) => (
                    <div 
                      key={i}
                      className="group relative glass-panel p-6 md:p-8 border-white/5 bg-white/[0.02] overflow-hidden hover:bg-white/[0.06] transition-all duration-500 rounded-[2rem] border border-white/5"
                    >
                      <f.icon className={`w-8 h-8 md:w-10 md:h-10 mb-4 text-cyan-400 transition-transform group-hover:scale-110`} />
                      <h3 className="text-white font-bold font-cairo text-base md:text-lg mb-2">{f.text}</h3>
                      <p className="text-gray-500 font-cairo text-[10px] md:text-xs leading-relaxed uppercase tracking-widest">{f.desc}</p>
                      <div className="absolute bottom-0 left-0 h-[1px] bg-cyan-400/50 w-0 group-hover:w-full transition-all duration-700" />
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div className="flex flex-col items-center gap-6 mt-4">
                  <button
                    ref={btnRef}
                    onClick={handleStart}
                    className="group relative px-12 md:px-20 py-5 md:py-7 bg-white text-black font-black text-xl md:text-2xl rounded-3xl overflow-hidden hover:scale-105 active:scale-95 transition-transform flex items-center gap-3"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 font-cairo tracking-tighter group-hover:text-white transition-colors">
                      ابدأ رحلتك الآن
                    </span>
                    <ArrowRight className="relative z-10 w-6 h-6 group-hover:text-white group-hover:translate-x-[-10px] transition-transform" />
                  </button>
                  
                  <p className="text-gray-600 font-mono text-[9px] uppercase tracking-[0.5em] flex items-center gap-2">
                     <Sparkles className="w-3 h-3 text-cyan-400" /> Powered by Nile Engine 2.0
                  </p>
                </div>
              </motion.div>
            )}

            {/* Phase 1: Choose Chain */}
            {phase === 'choose-chain' && (
              <motion.div 
                key="choose-chain-phase"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full p-8 glass-panel border border-white/10 bg-black/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl rounded-3xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-cyan-400/10 rounded-2xl flex items-center justify-center mb-4 border border-cyan-400/20">
                    <Landmark className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white">اختر سلسلة الصيدليات</h2>
                  <p className="text-gray-400 text-xs mt-1">تحديد شبكة أو مالك السلسلة للدخول إليها</p>
                </div>

                {wizardError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 flex items-center gap-2.5 text-xs font-bold leading-relaxed">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{wizardError}</span>
                  </div>
                )}

                {/* Search field */}
                <div className="relative mb-5">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-cyan-400/50 transition-all text-sm text-right"
                    placeholder="ابحث عن سلسلة الصيدليات..."
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>

                {/* Chains scrollable list */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 select-none custom-scrollbar">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                      <span className="text-gray-400 text-xs">جاري تحميل السلاسل المتوفرة...</span>
                    </div>
                  ) : filteredChains.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-xs">لا توجد سلاسل مطابقة للبحث.</p>
                      <button
                        onClick={() => router.push('/auth/register')}
                        className="mt-3 text-cyan-400 text-xs font-bold hover:underline"
                      >
                        تسجيل صيدلية منفصلة جديدة
                      </button>
                    </div>
                  ) : (
                    filteredChains.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectChain(c.id, c.name)}
                        className="w-full text-right p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] hover:border-cyan-400/40 transition-all duration-300 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                          <span className="font-bold text-white text-sm">{c.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-[-4px] transition-transform" />
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setPhase('intro')}
                    className="text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>رجوع للصفحة الرئيسية</span>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/auth/register')}
                    className="text-xs text-cyan-400 hover:underline font-bold"
                  >
                    حساب جديد
                  </button>
                </div>
              </motion.div>
            )}

            {/* Phase 2: Verify Password */}
            {phase === 'verify-password' && (
              <motion.div 
                key="verify-password-phase"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full p-8 glass-panel border border-white/10 bg-black/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl rounded-3xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-cyan-400/10 rounded-2xl flex items-center justify-center mb-4 border border-cyan-400/20">
                    <Lock className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white">رمز حماية السلسلة</h2>
                  <p className="text-gray-400 text-xs mt-1">سلسلة: <span className="text-white font-bold">{selectedChainName}</span></p>
                </div>

                {wizardError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 flex items-center gap-2.5 text-xs font-bold leading-relaxed">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{wizardError}</span>
                  </div>
                )}

                {passwordSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center py-6 text-green-400 gap-3"
                  >
                    <CheckCircle2 className="w-16 h-16 animate-bounce" />
                    <span className="font-bold text-sm">تم التحقق من الوصول بنجاح!</span>
                  </motion.div>
                ) : (
                  <form onSubmit={handleVerifyPassword} className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-400 mr-1 block">كلمة مرور السلسلة</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={chainPassword}
                          onChange={(e) => setChainPassword(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-11 pl-11 text-white focus:outline-none focus:border-cyan-400/50 transition-all text-sm text-left"
                          placeholder="كلمة مرور السلسلة"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 hover:text-cyan-400 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <Key className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 mr-1 block mt-1">توضع وتُدار من شاشة إعدادات السلسلة عبر المدير</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>جاري التحقق...</span>
                        </>
                      ) : (
                        <span>التحقق والدخول</span>
                      )}
                    </button>
                  </form>
                )}

                <div className="mt-8 pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      setPhase('choose-chain');
                      setWizardError('');
                    }}
                    className="text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>رجوع لاختيار السلسلة</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Phase 3: Choose Branch */}
            {phase === 'choose-branch' && (
              <motion.div 
                key="choose-branch-phase"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full p-8 glass-panel border border-white/10 bg-black/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl rounded-3xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-cyan-400/10 rounded-2xl flex items-center justify-center mb-4 border border-cyan-400/20">
                    <Building2 className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white">اختر الفرع / الصيدلية</h2>
                  <p className="text-gray-400 text-xs mt-1">السلسلة: <span className="text-white font-bold">{selectedChainName}</span></p>
                </div>

                {wizardError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 flex items-center gap-2.5 text-xs font-bold leading-relaxed">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{wizardError}</span>
                  </div>
                )}

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 select-none custom-scrollbar">
                  {branches.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-xs">لا يوجد فروع مضافة لهذه السلسلة بعد.</p>
                      <button
                        onClick={() => router.push('/auth/register')}
                        className="mt-3 text-cyan-400 text-xs font-bold hover:underline"
                      >
                        سجل صيدلية جديدة
                      </button>
                    </div>
                  ) : (
                    branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBranch(b.id)}
                        className="w-full text-right p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] hover:border-cyan-400/40 transition-all duration-300 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{b.name}</span>
                          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-[-4px] transition-transform" />
                        </div>
                        {b.address && <span className="text-xs text-gray-400">{b.address}</span>}
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      setPhase('verify-password');
                      setWizardError('');
                    }}
                    className="text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>رجوع لرمز الحماية</span>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}

      {/* Decorative Scanline */}
      <div className="absolute inset-x-0 h-px bg-cyan-400/20 top-0 translate-y-[-100%] animate-scan pointer-events-none" />
      
      <style jsx>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(100vh); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </main>
  );
}
