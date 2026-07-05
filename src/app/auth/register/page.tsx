"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Loader2, Lock, Mail, ShieldAlert, UserPlus, User, 
  Building2, MapPin, Phone, Eye, EyeOff, Check, Key, 
  Layers, Landmark, Plus, Settings, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChainOption {
  id: string;
  name: string;
}

interface PharmacyOption {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();

  // Basic Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration Mode: Join Existing vs Create New
  const [regType, setRegType] = useState<"join" | "create">("join");

  // Join Mode State
  const [chains, setChains] = useState<ChainOption[]>([]);
  const [selectedChainId, setSelectedChainId] = useState("");
  const [chainVerifyPassword, setChainVerifyPassword] = useState("");
  const [isChainVerified, setIsChainVerified] = useState(false);
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");

  // Create Mode Sub-Type: 'standalone' | 'new_chain' | 'existing_chain'
  const [createType, setCreateType] = useState<"standalone" | "new_chain" | "existing_chain">("standalone");

  // New Chain Details
  const [newChainName, setNewChainName] = useState("");
  const [newChainPassword, setNewChainPassword] = useState("");

  // New Pharmacy Details
  const [newPharmacyName, setNewPharmacyName] = useState("");
  const [newPharmacyAddress, setNewPharmacyAddress] = useState("");
  const [newPharmacyPhone, setNewPharmacyPhone] = useState("");

  // Common UX States
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Initial Load: Retrieve all active Chains
  useEffect(() => {
    async function loadChains() {
      try {
        const supabaseClient = createClient();
        const { data, error: fetchError } = await supabaseClient
          .from("chains")
          .select("id, name")
          .order("name");

        if (fetchError) {
          console.error("Supabase Chains Fetch Error:", fetchError);
          setError("تعذر تحميل قائمة سلاسل الصيدليات.");
        } else if (data) {
          setChains(data);
          if (data.length > 0) {
            setSelectedChainId(data[0].id);
          }
        }
      } catch (err: any) {
        console.error("Unexpected Error loading chains:", err);
      }
    }
    loadChains();
  }, []);

  // Reset states when changing registration tabs
  const handleRegTypeChange = (type: "join" | "create") => {
    setRegType(type);
    setError("");
    setIsChainVerified(false);
    setChainVerifyPassword("");
    setPharmacies([]);
    setSelectedPharmacyId("");
  };

  // Reset states when changing creation options
  const handleCreateTypeChange = (type: "standalone" | "new_chain" | "existing_chain") => {
    setCreateType(type);
    setError("");
    setIsChainVerified(false);
    setChainVerifyPassword("");
  };

  // 2. Verify chain password client-side to unlock its branches
  const handleVerifyChain = async () => {
    if (!selectedChainId) {
      setError("❌ الرجاء تحديد السلسلة المراد فحصها.");
      return;
    }
    if (!chainVerifyPassword.trim()) {
      setError("❌ الرجاء إدخال رمز مرور السلسلة لتأكيد الهوية.");
      return;
    }

    setIsVerifyingChain(true);
    setError("");
    try {
      const supabaseClient = createClient();
      const { data: isMatch, error: checkError } = await supabaseClient.rpc("verify_chain_password", {
        p_chain_id: selectedChainId,
        p_password: chainVerifyPassword.trim()
      });

      if (checkError) throw checkError;

      if (isMatch) {
        setIsChainVerified(true);
        // Load branches of the selected chain
        const { data: bData, error: bError } = await supabaseClient
          .from("pharmacies")
          .select("id, name")
          .eq("chain_id", selectedChainId)
          .eq("is_active", true)
          .order("created_at");

        if (bError) throw bError;
        setPharmacies(bData || []);
        if (bData && bData.length > 0) {
          setSelectedPharmacyId(bData[0].id);
        } else {
          setSelectedPharmacyId("");
          setError("ℹ️ هذه السلسلة لا تحتوي على فروع نشطة حالياً. يمكنك التحدث إلى المالك.");
        }
      } else {
        setError("❌ رمز مرور السلسلة غير صحيح. يرجى إعادة المحاولة.");
        setIsChainVerified(false);
      }
    } catch (err: any) {
      console.error(err);
      setError("❌ خطأ أثناء التحقق من رمز مرور السلسلة.");
      setIsChainVerified(false);
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const BLOCKED_EMAILS = ["developer@pharma-nile.com"];

  // 3. Final Submission via server API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (BLOCKED_EMAILS.includes(email.trim().toLowerCase())) {
      setError("❌ هذا البريد الإلكتروني محجوز ولا يمكن استخدامه.");
      return;
    }

    if (!name.trim() || name.trim().length < 3) {
      setError("❌ يرجى إدخال اسم كامل صحيح (لا يقل عن 3 أحرف).");
      return;
    }

    // Validation for Join pathway
    if (regType === "join") {
      if (!isChainVerified) {
        setError("❌ يرجى التحقق من رمز مرور السلسلة أولاً.");
        return;
      }
      if (!selectedPharmacyId) {
        setError("❌ يرجى اختيار فرع الصيدلية للانضمام إليه.");
        return;
      }
    }

    // Validation for Create pathway
    if (regType === "create") {
      if (!newPharmacyName.trim()) {
        setError("❌ يرجى إدخال اسم فرع الصيدلية.");
        return;
      }
      if (createType === "new_chain") {
        if (!newChainName.trim() || !newChainPassword.trim()) {
          setError("❌ يرجى ملء اسم السلسلة ورمز المرور الخاص بها.");
          return;
        }
      }
      if (createType === "existing_chain") {
        if (!selectedChainId) {
          setError("❌ يرجى تحديد السلسلة المراد إنشاء الفرع بداخلها.");
          return;
        }
        if (!chainVerifyPassword.trim()) {
          setError("❌ يرجى إدخال رمز مرور السلسلة لتصريح إضافة فروع لها.");
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      const reqBody: any = {
        email: email.trim(),
        password,
        full_name: name.trim(),
        regType,
      };

      if (regType === "join") {
        reqBody.selectedPharmacyId = selectedPharmacyId;
      } else {
        reqBody.newPharmacyName = newPharmacyName.trim();
        reqBody.newPharmacyAddress = newPharmacyAddress.trim();
        reqBody.newPharmacyPhone = newPharmacyPhone.trim();

        if (createType === "new_chain") {
          reqBody.createChain = true;
          reqBody.chainName = newChainName.trim();
          reqBody.chainPassword = newChainPassword.trim();
        } else if (createType === "existing_chain") {
          reqBody.createChain = false;
          reqBody.chainId = selectedChainId;
          reqBody.chainPassword = chainVerifyPassword.trim();
        } else {
          reqBody.createChain = false;
        }
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "فشل تسجيل البيانات.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2500);

    } catch (err: any) {
      setError(err?.message || "فشلت عملية حفظ الحساب والتهيئة.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] font-cairo" dir="rtl">
        <div className="w-full max-w-md p-8 glass-panel rounded-3xl text-center border border-white/5 bg-background/50">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
            <UserPlus className="w-10 h-10 text-green-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">تم تسجيل الحساب بنجاح!</h2>
          <p className="text-gray-400 mb-6">جاري إعداد بيئة العمل والنظام ثم التحويل...</p>
          <Loader2 className="w-8 h-8 animate-spin text-[var(--nile-teal)] mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative selection:bg-[var(--nile-teal)] selection:text-white py-20 px-4 overflow-y-auto font-cairo text-right" dir="rtl">
      {/* Visual Light Overlays */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--nile-teal)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--royal-gold)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl p-8 glass-panel rounded-3xl relative z-10 border border-white/5 bg-background/50 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[var(--nile-teal)] to-[var(--nile-teal)]/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,206,209,0.2)] border border-[var(--nile-teal)]/20">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
            بوابة تسجيل حساب جديد
          </h1>
          <p className="text-gray-400 text-sm">أول منصة متكاملة لإدارة سلاسل وفروع الصيدليات بذكاء</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-00 font-bold text-red-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm w-full">{error}</p>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-black/60 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleRegTypeChange("join")}
            className={`py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              regType === "join"
                ? "bg-[var(--nile-teal)] text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            انضمام لصيدلية / موظف
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleRegTypeChange("create")}
            className={`py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              regType === "create"
                ? "bg-[var(--nile-teal)] text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Plus className="w-4 h-4" />
            إنشاء صيدلية / إدارة
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 mr-1 block">الاسم بالكامل</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={name}
                disabled={isLoading}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm text-right disabled:opacity-50"
                placeholder="د. أحمد محمد"
              />
            </div>
          </div>

          {/* Tab Content: JOIN */}
          {regType === "join" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--nile-teal)] mr-1 block">اختر السلسلة التابعة لها الصيدلية</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Landmark className="h-4 w-4 text-[var(--nile-teal)]/70" />
                  </div>
                  <select
                    value={selectedChainId}
                    disabled={isLoading || isChainVerified}
                    onChange={(e) => {
                      setSelectedChainId(e.target.value);
                      setIsChainVerified(false);
                    }}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm appearance-none cursor-pointer text-right disabled:opacity-50"
                  >
                    <option value="" disabled>-- اختر السلسلة --</option>
                    {chains.map((chain) => (
                      <option key={chain.id} value={chain.id} className="bg-[#050505] text-white">
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!isChainVerified ? (
                <div className="space-y-3 p-3 bg-black/60 rounded-xl border border-white/5 transition-all">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-amber-400/80 mr-1 block">رمز مرور السلسلة الأمن</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Key className="h-4 w-4 text-amber-500/70" />
                      </div>
                      <input
                        type="password"
                        value={chainVerifyPassword}
                        onChange={(e) => setChainVerifyPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-amber-500/50 transition-all text-sm font-sans text-left"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isVerifyingChain}
                    onClick={handleVerifyChain}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 font-bold text-xs rounded-xl text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all flex items-center justify-center gap-2"
                  >
                    {isVerifyingChain ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Key className="w-3.5 h-3.5" />
                    )}
                    التحقق والحصول على الفروع
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    تم التحقق من السلسلة بنجاح. الرجاء تحديد الفرع.
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 mr-1 block">الفرع المتاح للتسجيل</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Building2 className="h-4 w-4 text-gray-500" />
                      </div>
                      <select
                        value={selectedPharmacyId}
                        onChange={(e) => setSelectedPharmacyId(e.target.value)}
                        required={regType === "join"}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm appearance-none cursor-pointer text-right"
                      >
                        {pharmacies.length === 0 ? (
                          <option value="">لا يوجد فروع مسجلة لهذه السلسلة بعد</option>
                        ) : (
                          pharmacies.map((p) => (
                            <option key={p.id} value={p.id} className="bg-[#050505] text-white">
                              {p.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Tab Content: CREATE */}
          {regType === "create" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Selector for createType */}
              <div className="grid grid-cols-3 gap-1 bg-black/60 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => handleCreateTypeChange("standalone")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    createType === "standalone" ? "bg-[var(--royal-gold)] text-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  صيدلية مستقلة
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateTypeChange("new_chain")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    createType === "new_chain" ? "bg-[var(--royal-gold)] text-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  إنشاء سلسلة جديدة
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateTypeChange("existing_chain")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    createType === "existing_chain" ? "bg-[var(--royal-gold)] text-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  إضافة فرع لسلسلة قائمة
                </button>
              </div>

              {/* Sub-form block */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                {/* 1. New Chain Fields */}
                {createType === "new_chain" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-3 border-b border-white/5 pb-4"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--royal-gold)] mr-1 block">اسم سلسلة الصيدليات الجديدة *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <Landmark className="h-4 w-4 text-[var(--royal-gold)]/70" />
                        </div>
                        <input
                          type="text"
                          value={newChainName}
                          onChange={(e) => setNewChainName(e.target.value)}
                          placeholder="مثال: مجموعة صيدليات الشفاء"
                          className="w-full bg-[#0a0a0a] border border-[#d4af37]/20 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--royal-gold)]/50 transition-all text-sm text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--royal-gold)] mr-1 block">رمز مرور السلسلة (لتحصين إضافة فروع جديدة) *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-[var(--royal-gold)]/70" />
                        </div>
                        <input
                          type="password"
                          value={newChainPassword}
                          onChange={(e) => setNewChainPassword(e.target.value)}
                          placeholder="هذا الرمز ستحتاجه لإضافة فروع لاحقاً أو موظفين"
                          className="w-full bg-[#0a0a0a] border border-[#d4af37]/20 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--royal-gold)]/50 transition-all text-sm font-sans text-left"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. Existing Chain verification fields before adding branch */}
                {createType === "existing_chain" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-3 border-b border-white/5 pb-4"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--royal-gold)] mr-1 block">اختر السلسلة المراد إضافة الفرع إليها *</label>
                      <select
                        value={selectedChainId}
                        onChange={(e) => setSelectedChainId(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[var(--royal-gold)]/50 transition-all text-sm appearance-none cursor-pointer text-right"
                      >
                        {chains.map((chain) => (
                          <option key={chain.id} value={chain.id}>
                            {chain.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--royal-gold)] mr-1 block">رمز مرور هذه السلسلة للتحقق من المالك *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <Key className="h-4 w-4 text-[var(--royal-gold)]/70" />
                        </div>
                        <input
                          type="password"
                          value={chainVerifyPassword}
                          onChange={(e) => setChainVerifyPassword(e.target.value)}
                          placeholder="رمز المرور الحالي الخاص بالسلسلة"
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--royal-gold)]/50 transition-all text-sm font-sans text-left"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Pharmacy Branch fields */}
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">بيانات الفرع/الصيدلية</h3>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 mr-1 block">اسم الصيدلية / الفرع الرئيسي *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={newPharmacyName}
                      disabled={isLoading}
                      onChange={(e) => setNewPharmacyName(e.target.value)}
                      required={regType === "create"}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm text-right"
                      placeholder="صيدلية النيل - الفرع الرئيسي"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 mr-1 block">العنوان</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-600" />
                    </div>
                    <input
                      type="text"
                      value={newPharmacyAddress}
                      disabled={isLoading}
                      onChange={(e) => setNewPharmacyAddress(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm text-right"
                      placeholder="العنوان التفصيلي للفرع"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 mr-1 block">رقم الهاتف</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-600" />
                    </div>
                    <input
                      type="text"
                      value={newPharmacyPhone}
                      disabled={isLoading}
                      onChange={(e) => setNewPharmacyPhone(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm text-left font-sans"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Account Login Details Section */}
          <div className="border-t border-white/5 pt-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">معلومات تسجيل الدخول للحساب</h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 mr-1 block">البريد الإلكتروني للقرين</label>
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
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm text-left font-sans"
                  placeholder="name@pharma-nile.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 mr-1 block">كلمة المرور الشخصية</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  dir="ltr"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pr-10 pl-11 text-white focus:outline-none focus:border-[var(--nile-teal)]/50 transition-all text-sm text-left font-sans"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 hover:text-[var(--nile-teal)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submission button */}
          <button
            type="submit"
            disabled={isLoading || isVerifyingChain}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--nile-teal)] to-[#009b9e] text-black font-bold hover:opacity-90 hover:shadow-[0_0_20px_rgba(0,206,209,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري إنشاء الحساب وإعداد الخوادم...</span>
              </>
            ) : (
              <span>{regType === "create" ? "إنشاء الصيدلية وتهيئة النظام" : "إتمام تسجيل الحساب"}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            لديك حساب بالفعل؟{" "}
            <a href="/auth/login" className="text-[var(--nile-teal)] hover:underline font-bold">
              تسجيل الدخول من هنا
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
