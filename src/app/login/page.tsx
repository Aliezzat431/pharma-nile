"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn, loading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      await signIn(data.email, data.password);
    } catch (err: any) {
      setError(err.message || "خطأ في تسجيل الدخول");
    }
  };

  if (user) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian">
      <form
        onSubmit={handleSubmit(onSubmit)}
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
            {...register("email")}
            className={cn(
              "w-full rounded-xl bg-[var(--glass-surface)] px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-nile-teal",
              "placeholder:text-foreground/40",
              errors.email && "focus:ring-red-500 border border-red-500"
            )}
            placeholder="example@domain.com"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground/70">
            كلمة المرور
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register("password")}
              className={cn(
                "w-full rounded-xl bg-[var(--glass-surface)] px-4 py-2 pr-4 pl-10 text-foreground focus:outline-none focus:ring-2 focus:ring-nile-teal",
                "placeholder:text-foreground/40",
                errors.password && "focus:ring-red-500 border border-red-500"
              )}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-foreground/40 hover:text-nile-teal transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
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

