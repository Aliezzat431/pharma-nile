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

    supabase.auth.getSession().then(({ data: { session: sess }, error }) => {
      if (error) {

        if (error.message !== 'refresh_token_not_found') {
          console.error('[Auth] Initial session fetch error:', error.message);
        }
        setSession(null);
        setUser(null);
      } else {
        setSession(sess);
        setUser(sess?.user ?? null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setSession(sess);
        setUser(sess?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshShift = async () => {};

  const signIn = async (email: string, password: string, adminKey?: string) => {
    setLoading(true);
    try {
      const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[Auth] Sign-in failed:', error.message);
        throw error;
      }

      if (!authUser) throw new Error("User not found");

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', authUser.id)
        .limit(1)
        .maybeSingle();

      if (profileError) {
        console.error('[Auth] Profile fetch error:', profileError.message);
        throw profileError;
      }

      void profile; 
    } catch (err) {
      console.error('[Auth] signIn error:', err instanceof Error ? err.message : err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);

      setLoading(false);
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

