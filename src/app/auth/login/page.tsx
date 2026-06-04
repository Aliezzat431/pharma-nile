"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Mail, ShieldAlert, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");
  const [pharmacies, setPharmacies] = useState<{ id: string, name: string }[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // جلب الصيدليات النشطة عند تحميل الصفحة
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
          setSelectedPharmacyId(data[0].id); // اختيار أول صيدلية تلقائياً
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

    // 1. التحقق من الرمز السري في كلمة المرور (إذا كان مطلوباً)
    if (!password.endsWith("")) {
      setError("كلمة المرور غير صالحة. يجب أن تنتهي بالرمز السري الخاص بالنظام.");
      return;
    }

    // 2. التحقق من اختيار الصيدلية
    if (!selectedPharmacyId) {
      setError("الرجاء اختيار الفرع/الصيدلية أولاً.");
      return;
    }

    setIsLoading(true);

    try {
      // تسجيل الدخول الأساسي عبر الـ Auth Hook الخاص بك
      await signIn(email, password, adminKey);

      // حفظ الصيدلية المختارة في المتصفح للرجوع إليها محلياً
      localStorage.setItem('selected_pharmacy_id', selectedPharmacyId);
      
      // تحديث بيانات الـ user_metadata لتتوافق مع سياسات الـ RLS الصارمة المستندة للـ Tenant
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { pharmacy_id: selectedPharmacyId }
      });

      if (updateError) {
        throw new Error(`فشل ربط الجلسة بالفرع: ${updateError.message}`);
      }

      router.push("/");
      router.refresh(); // لضمان تحديث الـ Layouts وحالة الـ RLS في المكونات الأخرى
    } catch (err: any) {
      setError(err?.message || "فشل تسجيل الدخول. يرجى التحقق من بياناتك.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative selection:bg-[var(--nile-teal)] selection:text-white py-12 px-4 overflow-y-auto">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--nile-teal)]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--royal-gold)]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Container */}
      <div className="w-full max-w-md p-8 glass-panel rounded-3xl relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[var(--nile-teal)] to-[var(--nile-teal)]/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,206,209,0.3)]">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 mb-2 font-cairo">
            مرحباً بك
          </h1>
          <p className="text-foreground/50 font-cairo">تسجيل الدخول للنظام</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm font-cairo text-right w-full">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/70 mr-1 block font-cairo text-right">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-foreground/40" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-11 text-white focus:outline-none focus:border-[var(--nile-teal)] focus:ring-1 focus:ring-[var(--nile-teal)] transition-all placeholder:text-foreground/30"
                placeholder="admin@pharmacy.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/70 mr-1 block font-cairo text-right">
              كلمة المرور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-foreground/40" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-11 text-white focus:outline-none focus:border-[var(--nile-teal)] focus:ring-1 focus:ring-[var(--nile-teal)] transition-all placeholder:text-foreground/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/70 mr-1 block font-cairo text-right">
              اختر الفرع / الصيدلية
            </label>
            <div className="relative">
              <select
                value={selectedPharmacyId}
                onChange={(e) => setSelectedPharmacyId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 pl-10 text-white focus:outline-none focus:border-[var(--nile-teal)] focus:ring-1 focus:ring-[var(--nile-teal)] transition-all font-cairo appearance-none text-right"
                required
              >
                {pharmacies.length === 0 ? (
                  <option value="" disabled className="bg-[var(--background)]">جاري تحميل الفروع...</option>
                ) : (
                  pharmacies.map(p => (
                    <option key={p.id} value={p.id} className="bg-[var(--background)]">{p.name}</option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--royal-gold)]/80 mr-1 block font-cairo text-right">
              كود المدير (اختياري للموظف)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[var(--royal-gold)]/40" />
              </div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                dir="ltr"
                className="w-full bg-[var(--royal-gold)]/5 border border-[var(--royal-gold)]/10 rounded-xl py-3 pl-4 pr-11 text-white focus:outline-none focus:border-[var(--royal-gold)] focus:ring-1 focus:ring-[var(--royal-gold)] transition-all placeholder:text-foreground/30"
                placeholder="••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || pharmacies.length === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--nile-teal)] to-[#009b9e] text-white font-bold text-lg hover:shadow-[0_0_20px_rgba(0,206,209,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 font-cairo"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الدخول...
              </>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-sm text-foreground/50 mb-4 font-cairo">ليس لديك حساب؟</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--nile-teal)] font-medium hover:bg-white/10 transition-all font-cairo"
          >
            <UserPlus className="w-4 h-4" />
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    </div>
  );
}
