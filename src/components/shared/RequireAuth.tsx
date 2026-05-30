import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Simple loading placeholder
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <div className="glass-panel p-6 rounded-xl">
          <p className="text-foreground/70">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
