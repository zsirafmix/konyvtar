"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function performLogout() {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (e) {
        console.error("Logout error:", e);
      } finally {
        window.location.href = "/login?switch=true";
      }
    }
    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-xl max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto animate-pulse">
          <LogOut className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-foreground">Kijelentkezés folyamatban...</h1>
        <p className="text-xs text-muted-foreground">
          Munkamenet biztonságos lezárása és visszairányítás a bejelentkezéshez.
        </p>
        <a
          href="/login?switch=true"
          className="inline-block text-xs text-primary font-bold hover:underline pt-2"
        >
          Kattints ide, ha a böngésző nem irányít át automatikusan &rarr;
        </a>
      </div>
    </div>
  );
}
