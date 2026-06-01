"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Session, User } from "@supabase/supabase-js";

const supabase = createClient();

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, adminKey?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshShift: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (error) {
        console.error("Failed to get initial session:", error);
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if (mounted) {
          console.log("🔐 Auth state changed:", event, sess?.user?.id);
          setSession(sess);
          setUser(sess?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const refreshShift = async () => {
    // Placeholder for shift refresh logic
    console.log("Shift refreshed");
  };

  const signIn = async (email: string, password: string, adminKey?: string) => {
    setLoading(true);
    console.group("🔐 [DEBUG] signIn attempt");
    console.log("📧 Email:", email);
    console.log("🔑 Admin key provided:", !!adminKey);
    try {
      // Step 1: Supabase auth
      console.log("⏳ Step 1: Calling supabase.auth.signInWithPassword...");
      const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Step 1 FAILED - Supabase auth error:", error.message, error);
        throw error;
      }
      console.log("✅ Step 1 OK - Supabase auth user:", authUser?.id, authUser?.email);

      if (!authUser) throw new Error("User not found");

      // Step 2: Fetch user profile
      console.log("⏳ Step 2: Fetching user_profiles for id:", authUser.id);
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", authUser.id)
        .limit(1)
        .maybeSingle();

      if (profileError) {
        console.error("❌ Step 2 FAILED - Profile fetch error:", profileError.message, profileError);
        throw profileError;
      }
      console.log("✅ Step 2 OK - Profile:", profile);

      // Step 3: Admin key check
      if (profile?.role === "admin") {
        console.log("⏳ Step 3: Admin role detected, checking admin key...");
        if (!adminKey) {
          console.warn("⚠️ Step 3 FAILED - No admin key provided for admin user");
          await supabase.auth.signOut();
          throw new Error("مطلوب مفتاح الإدارة لحسابات المسؤولين");
        }

        console.log("⏳ Step 3: Calling /api/auth/verify-admin...");
        const verifyResponse = await fetch("/api/auth/verify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminKey }),
        });

        console.log("Step 3 verify response status:", verifyResponse.status);
        if (!verifyResponse.ok) {
          console.error("❌ Step 3 FAILED - Admin key verification failed");
          await supabase.auth.signOut();
          throw new Error("مفتاح الإدارة غير صحيح");
        }
        console.log("✅ Step 3 OK - Admin key verified");
      } else {
        console.log("ℹ️ Step 3 SKIPPED - User is not admin, role:", profile?.role);
      }

      console.log("🎉 Login successful!");
    } catch (err) {
      console.error("🔴 signIn caught error:", err);
      // Clear state on login error
      setUser(null);
      setSession(null);
      throw err;
    } finally {
      console.groupEnd();
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    console.log("🚪 Starting logout...");
    try {
      // Sign out from Supabase (this will trigger onAuthStateChange)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Supabase signOut error:", error);
        throw error;
      }
      console.log("✅ Supabase signOut successful");
    } catch (err) {
      console.error("🔴 SignOut error:", err);
      // Force clear state even if signOut fails
      setUser(null);
      setSession(null);
    } finally {
      // Ensure state is cleared
      setUser(null);
      setSession(null);
      setLoading(false);
      console.log("✅ Logout complete - user state cleared");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, refreshShift }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
