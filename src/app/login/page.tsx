"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { signIn, loading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "خطأ في تسجيل الدخول");
    }
  };

  // If already logged in, redirect (client side) – simple placeholder
  if (user) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian">
      <form
        onSubmit={handleSubmit}
        className="glass-panel w-full max-w-md p-8 space-y-6"
      >
        <h2 className="text-2xl font-bold nile-gradient-text text-center mb-4">
          تسجيل الدخول إلى صيدليتي بلس
        </h2>
        {error && (
          <p className="text-red-400 text-center text-sm">{error}</p>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/70">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "w-full rounded-xl bg-white/5 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-nile-teal",
              "placeholder:text-foreground/40"
            )}
            placeholder="example@domain.com"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/70">
            كلمة المرور
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(
              "w-full rounded-xl bg-white/5 px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-nile-teal",
              "placeholder:text-foreground/40"
            )}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-lg transition-colors",
            loading ? "bg-nile-teal/30 cursor-not-allowed" : "bg-nile-teal text-obsidian hover:bg-nile-teal/90"
          )}
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            "تسجيل الدخول"
          )}
        </button>
      </form>
    </div>
  );
}
