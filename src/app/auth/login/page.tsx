"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Mail, ShieldAlert, UserPlus, Building2, Sparkles, Eye, EyeOff, Code } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  // Mode state
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  // Normal Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");
  const [pharmacies, setPharmacies] = useState<{ id: string, name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);

  // Developer Form State
  const [devPasswordInput, setDevPasswordInput] = useState("");
  const [showDevPassword, setShowDevPassword] = useState(false);

  // Common State
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('pharmacies')
          .select('id, name')
          .eq('is_active', true);

        if (fetchError) {
          console.error("Error fetching pharmacies:", fetchError.message);
          setError("تعذر جلب قائمة الفروع، يرجى تحديث الصفحة.");
          return;
        }

        if (data && data.length > 0) {
          setPharmacies(data);
          setSelectedPharmacyId(data[0].id);
        } else {
          setError("لا توجد صيدليات نشطة مسجلة في النظام حالياً.");
        }
      } catch (err) {
        console.error("Unexpected error loading pharmacies:", err);
        setError("حدث خطأ غير متوقع أثناء تحميل الفروع.");
      }
    };

    loadPharmacies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedPharmacyId) {
      setError("الرجاء اختيار الفرع/الصيدلية أولاً.");
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password, adminKey);
      localStorage.setItem('selected_pharmacy_id', selectedPharmacyId);

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { pharmacy_id: selectedPharmacyId }
      });

      if (updateError) {
        throw new Error(`فشل ربط الجلسة بالفرع: ${updateError.message}`);
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "فشل تسجيل الدخول. يرجى التحقق من بياناتك.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeveloperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1 — validate the password server-side and pre-stamp role=developer
      const res = await fetch('/api/auth/developer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: devPasswordInput })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطأ في تسجيل دخول المطور");
      }

      // Step 2 — sign in with the validated credentials.
      // The API has already stamped role=developer in metadata so the JWT
      // issued here will carry the correct role claim for the middleware.
      // DEVELOPER_PASSWORD in .env is also the Supabase account password.
      await signIn(data.email, devPasswordInput);

      router.push("/dev");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "فشلت عملية التحقق كمطور.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative selection:bg-[var(--nile-teal)] selection:text-white py-12 px-4 overflow-hidden font-cairo text-right" dir="rtl">
      
      {/* Background Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[var(--nile-teal)]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} 
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[color:var(--royal-gold)]/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
        className="w-full max-w-md p-8 glass-panel rounded-3xl relative z-10 border border-white/10 bg-black/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: "spring", duration: 1.5, bounce: 0.5, delay: 0.2 }}
            className={`w-24 h-24 mx-auto bg-gradient-to-tr rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_40px_var(--nile-teal-glow)] relative group ${
              isDeveloperMode ? 'from-purple-600 to-[var(--nile-teal)]' : 'from-[var(--nile-teal)] to-[var(--royal-gold)]'
            }`}
          >
            <div className="absolute inset-0 rounded-[2rem] bg-white/20 blur-xl opacity-0 transition-opacity group-hover:opacity-100" />
            {isDeveloperMode ? (
              <Code className="w-12 h-12 text-white z-10 animate-pulse" />
            ) : (
              <Sparkles className="w-12 h-12 text-black z-10" />
            )}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-black mb-3 nile-gradient-text tracking-tight"
          >
            {isDeveloperMode ? 'بوابة مطور النظام' : 'نظام الإدارة المتقدم'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest"
          >
            {isDeveloperMode ? 'System Developer Terminal' : 'Premium Workspace Authorization'}
          </motion.p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm w-full">{error}</p>
          </div>
        )}

        {isDeveloperMode ? (
          /* Developer Sign In Form */
          <form onSubmit={handleDeveloperSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-purple-400 mr-1 block">
                كلمة مرور المطور الصارمة
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-purple-400" />
                </div>
                <input
                  type={showDevPassword ? 'text' : 'password'}
                  value={devPasswordInput}
                  disabled={isLoading}
                  onChange={(e) => setDevPasswordInput(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full bg-[var(--background)] border border-purple-500/30 rounded-xl py-3 pr-11 pl-11 text-white focus:outline-none focus:border-purple-500 transition-all text-sm text-left font-sans disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowDevPassword(v => !v)}
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 hover:text-purple-400 transition-colors"
                  tabIndex={-1}
                >
                  {showDevPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="relative w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 overflow-hidden group shadow-[0_10px_30px_rgba(139,92,246,0.2)] mt-6 text-black"
              style={{ background: 'linear-gradient(135deg, var(--nile-teal), #8b5cf6)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[20deg] w-1/3 -translate-x-[200%] group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
              <div className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin drop-shadow" />
                    <span>جاري التحقق كمطور...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>دخول المطور</span>
                  </>
                )}
              </div>
            </motion.button>
          </form>
        ) : (
          /* Normal Pharmacy Sign In Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 mr-1 block">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-11 pl-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm text-left font-sans disabled:opacity-50"
                  placeholder="admin@pharmacy.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 mr-1 block">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-11 pl-11 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm text-left font-sans disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 hover:text-[var(--nile-teal)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 mr-1 block">
                اختر الفرع / الصيدلية
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-gray-500" />
                </div>
                <select
                  value={selectedPharmacyId}
                  disabled={isLoading || pharmacies.length === 0}
                  onChange={(e) => setSelectedPharmacyId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-11 pl-10 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm appearance-none cursor-pointer text-right disabled:opacity-50"
                  required
                >
                  {pharmacies.length === 0 ? (
                    <option value="" disabled className="bg-[var(--background)]">جاري تحميل الفروع...</option>
                  ) : (
                    pharmacies.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#050505] text-white">{p.name}</option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--royal-gold)]/80 mr-1 block">
                كود المدير (اختياري للموظف)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[var(--royal-gold)]/40" />
                </div>
                <input
                  type={showAdminKey ? 'text' : 'password'}
                  value={adminKey}
                  disabled={isLoading}
                  onChange={(e) => setAdminKey(e.target.value)}
                  dir="ltr"
                  className="w-full bg-[var(--royal-gold)]/5 border border-[var(--royal-gold)]/10 rounded-xl py-2.5 pr-11 pl-11 text-white focus:outline-none focus:border-[var(--royal-gold)]/40 transition-all text-sm text-left font-sans disabled:opacity-50"
                  placeholder="••••"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminKey(v => !v)}
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--royal-gold)]/40 hover:text-[var(--royal-gold)] transition-colors"
                  tabIndex={-1}
                >
                  {showAdminKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading || pharmacies.length === 0}
              className="relative w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 overflow-hidden group shadow-[0_10px_30px_-10px_var(--nile-teal-glow)] mt-6 bg-[color:var(--nile-teal)]"
              style={{ background: 'linear-gradient(135deg, var(--nile-teal), var(--royal-gold))' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[20deg] w-1/3 -translate-x-[200%] group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
              <div className="relative z-10 flex items-center gap-2 text-black">
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin drop-shadow" />
                    <span className="tracking-wide">جاري التحقق...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 drop-shadow" />
                    <span className="tracking-wide text-xl">دخول النظام</span>
                  </>
                )}
              </div>
            </motion.button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-3">
          {isDeveloperMode ? (
            <button
              onClick={() => setIsDeveloperMode(false)}
              className="w-full py-3 rounded-2xl font-bold bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm flex items-center justify-center gap-2"
            >
              العودة لتسجيل دخول الموظفين
            </button>
          ) : (
            <>
              <div>
                <p className="text-sm text-gray-400 mb-2">ليس لديك حساب؟</p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--nile-teal)] font-medium hover:bg-white/10 transition-all text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  إنشاء حساب جديد
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setIsDeveloperMode(true)}
                className="w-full py-3 mt-2 rounded-2xl font-bold bg-purple-500/10 border border-purple-500/25 text-purple-300 hover:bg-purple-500/20 transition-all text-sm flex items-center justify-center gap-2"
              >
                <Code className="w-4 h-4" />
                تسجيل الدخول كمطور النظام
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
