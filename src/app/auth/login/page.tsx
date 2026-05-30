"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Mail, ShieldAlert, UserPlus } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password, adminKey);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "فشل تسجيل الدخول. يرجى التحقق من بياناتك.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative selection:bg-[#00CED1] selection:text-white py-12 px-4 overflow-y-auto">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00CED1]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Container */}
      <div className="w-full max-w-md p-8 glass-panel rounded-3xl relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[#00CED1] to-[#00CED1]/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,206,209,0.3)]">
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
            <p className="text-sm font-cairo">{error}</p>
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
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-11 text-white focus:outline-none focus:border-[#00CED1] focus:ring-1 focus:ring-[#00CED1] transition-all placeholder:text-foreground/30"
                placeholder="admin@pharmacy.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground/70 mr-1 block font-cairo text-right">
                كلمة المرور
              </label>
            </div>
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
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-11 text-white focus:outline-none focus:border-[#00CED1] focus:ring-1 focus:ring-[#00CED1] transition-all placeholder:text-foreground/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#D4AF37]/80 mr-1 block font-cairo text-right">
                كود المدير (اختياري للموظف)
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#D4AF37]/40" />
              </div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                dir="ltr"
                className="w-full bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-xl py-3 pl-4 pr-11 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all placeholder:text-foreground/30"
                placeholder="••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00CED1] to-[#009b9e] text-white font-bold text-lg hover:shadow-[0_0_20px_rgba(0,206,209,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 font-cairo"
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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#00CED1] font-medium hover:bg-white/10 transition-all font-cairo"
          >
            <UserPlus className="w-4 h-4" />
            إنشاء حساب جديد للبحث
          </Link>
        </div>
      </div>
    </div>
  );
}
