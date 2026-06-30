"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock, Mail, ShieldAlert, UserPlus, User, Building2, MapPin, Phone, Eye, EyeOff } from "lucide-react";

interface PharmacyOption {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [regType, setRegType] = useState<"join" | "create">("join");
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");

  const [newPharmacyName, setNewPharmacyName] = useState("");
  const [newPharmacyAddress, setNewPharmacyAddress] = useState("");
  const [newPharmacyPhone, setNewPharmacyPhone] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadPharmacies() {
      try {
        const supabaseClient = createClient();
        
        const { data, error: fetchError } = await supabaseClient
          .from("pharmacies")
          .select("id, name")
          .eq("is_active", true);

        if (fetchError) {
          console.error("Supabase Fetch Error:", fetchError);
          setError(`تعذر تحميل الفروع: ${fetchError.message}`);
          setRegType("create");
          return;
        }

        if (data && data.length > 0) {
          setPharmacies(data);
          setSelectedPharmacyId(data[0].id);
          setRegType("join");
        } else {
          setRegType("create");
        }
      } catch (err: any) {
        console.error("Unexpected Error:", err);
        setError("حدث خطأ غير متوقع أثناء الاتصال بقاعدة البيانات.");
        setRegType("create");
      }
    }
    
    loadPharmacies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || name.trim().length < 3) {
      setError("❌ يرجى إدخال اسم كامل صحيح (لا يقل عن 3 أحرف).");
      return;
    }
    if (regType === "join" && !selectedPharmacyId) {
      setError("❌ يرجى اختيار صيدلية للانضمام إليها.");
      return;
    }
    if (regType === "create" && !newPharmacyName.trim()) {
      setError("❌ يرجى إدخال اسم الصيدلية الجديدة.");
      return;
    }

    setIsLoading(true);
    const supabaseClient = createClient();

    try {
      let targetPharmacyId = selectedPharmacyId;

      if (regType === "create") {
        const { data: newPharmacy, error: pharmError } = await supabaseClient
          .from("pharmacies")
          .insert([
            {
              name: newPharmacyName.trim(),
              address: newPharmacyAddress.trim() || null,
              phone: newPharmacyPhone.trim() || null,
              is_active: true
            }
          ])
          .select()
          .single();

        if (pharmError) throw pharmError;
        if (!newPharmacy) throw new Error("فشل إنشاء سجل الصيدلية الجديدة.");
        
        targetPharmacyId = newPharmacy.id;
      }

      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            role: "admin", 
            pharmacy_id: targetPharmacyId,
          }
        }
      });

      if (signUpError) throw signUpError;

      // The user profile and access mappings are created automatically by the database trigger
      // bound to auth.users (handle_new_user_registration). No manual inserters are required client-side.

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2500);
      
    } catch (err: any) {
      setError(err?.message || "فشل تسجيل البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] font-cairo" dir="rtl">
        <div className="w-full max-w-md p-8 glass-panel rounded-3xl text-center border border-white/5 bg-background/50">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
            <UserPlus className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">تم تسجيل الحساب بنجاح!</h2>
          <p className="text-gray-400 mb-6">جاري تحويلك لصفحة تسجيل الدخول...</p>
          <Loader2 className="w-8 h-8 animate-spin text-[#00CED1] mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative selection:bg-[#00CED1] selection:text-white py-20 px-4 overflow-y-auto font-cairo text-right" dir="rtl">
      {}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00CED1]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 glass-panel rounded-3xl relative z-10 border border-white/5 bg-background/50 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[#00CED1] to-[#00CED1]/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,206,209,0.2)] border border-[#00CED1]/20">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
            حساب جديد
          </h1>
          <p className="text-gray-400 text-sm">إنشاء حساب وإدارة فرع صيدليتك</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm w-full">{error}</p>
          </div>
        )}

        {}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-black/60 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            disabled={pharmacies.length === 0 || isLoading}
            onClick={() => setRegType("join")}
            className={`py-2.5 text-sm font-medium rounded-lg transition-all ${
              regType === "join"
                ? "bg-[#00CED1] text-black font-bold shadow-md"
                : "text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            انضمام لصيدلية
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setRegType("create")}
            className={`py-2.5 text-sm font-medium rounded-lg transition-all ${
              regType === "create"
                ? "bg-[#00CED1] text-black font-bold shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            إنشاء صيدلية جديدة
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 mr-1 block">الاسم الكامل</label>
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
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-[#00CED1]/50 transition-all text-sm text-right disabled:opacity-50"
                placeholder="د. أحمد محمد"
              />
            </div>
          </div>

          {}
          {regType === "join" ? (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-medium text-gray-400 mr-1 block">اختر الصيدلية المتاحة</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-gray-500" />
                </div>
                <select
                  value={selectedPharmacyId}
                  disabled={isLoading}
                  onChange={(e) => setSelectedPharmacyId(e.target.value)}
                  required={regType === "join"}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-[#00CED1]/50 transition-all text-sm appearance-none cursor-pointer text-right disabled:opacity-50"
                >
                  {pharmacies.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#050505] text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-white/[0.01] border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#00CED1] mr-1 block">اسم الصيدلية الجديدة *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-[#00CED1]/50" />
                  </div>
                  <input
                    type="text"
                    value={newPharmacyName}
                    disabled={isLoading}
                    onChange={(e) => setNewPharmacyName(e.target.value)}
                    required={regType === "create"}
                    className="w-full bg-black/40 border border-[#00CED1]/20 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-[#00CED1]/50 transition-all text-sm text-right disabled:opacity-50"
                    placeholder="صيدلية النيل - فرع جديد"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 mr-1 block">العنوان</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-600" />
                  </div>
                  <input
                    type="text"
                    value={newPharmacyAddress}
                    disabled={isLoading}
                    onChange={(e) => setNewPharmacyAddress(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-[#00CED1]/50 transition-all text-sm text-right disabled:opacity-50"
                    placeholder="القاهرة، شارع التحرير"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 mr-1 block">رقم هاتف الصيدلية</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <input
                    type="text"
                    value={newPharmacyPhone}
                    disabled={isLoading}
                    onChange={(e) => setNewPharmacyPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-[#00CED1]/50 transition-all text-sm text-left font-sans disabled:opacity-50"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>
            </div>
          )}

          {}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 mr-1 block">البريد الإلكتروني</label>
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
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-[#00CED1]/50 transition-all text-sm text-left font-sans disabled:opacity-50"
                placeholder="user@pharmacy.com"
              />
            </div>
          </div>

          {}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 mr-1 block">كلمة المرور</label>
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
                minLength={6}
                dir="ltr"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-10 pl-11 text-white focus:outline-none focus:border-[#00CED1]/50 transition-all text-sm text-left font-sans disabled:opacity-50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 hover:text-[#00CED1] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00CED1] to-[#009b9e] text-black font-bold hover:opacity-90 hover:shadow-[0_0_20px_rgba(0,206,209,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري معالجة البيانات...</span>
              </>
            ) : (
              <span>{regType === "create" ? "إنشاء الصيدلية والحساب" : "إنشاء الحساب"}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            لديك حساب بالفعل؟{" "}
            <a href="/auth/login" className="text-[#00CED1] hover:underline font-medium">
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
