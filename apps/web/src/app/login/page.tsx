"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, BookOpen, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("from") || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Kérjük, add meg az e-mail címedet és a jelszavadat!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hiba történt a bejelentkezéskor.");
        return;
      }

      // Successful login
      window.location.href = returnUrl;
    } catch (err: any) {
      setError("Hálózati hiba történt. Kérjük, próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  const [demoLoggingIn, setDemoLoggingIn] = useState<string | null>(null);

  const handleInstantDemoLogin = async (role: "reader" | "supporter") => {
    setError("");
    setDemoLoggingIn(role);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hiba történt a tesztfiók aktiválásakor.");
        setDemoLoggingIn(null);
        return;
      }
      window.location.href = data.redirectUrl || returnUrl;
    } catch {
      setError("Hálózati hiba a teszt belépéskor.");
      setDemoLoggingIn(null);
    }
  };

  const handleFillDemo = (emailVal: string, passVal: string) => {
    setIdentifier(emailVal);
    setPassword(passVal);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-primary-foreground font-black text-2xl shadow-lg shadow-primary/20">
            L
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Librarian AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Lépj be az intelligens digitális könyvtáradba
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Instant Tester Login banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-emerald-500/15 to-primary/10 border border-primary/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Próba regisztráció nélkül
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                1 kattintásos teszt
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Teszteld a könyvtárat regisztráció nélkül! Válassz egy szerepkört:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={loading || Boolean(demoLoggingIn)}
                onClick={() => handleInstantDemoLogin("reader")}
                className="py-2.5 px-3 rounded-xl bg-background/80 hover:bg-background border border-border/80 hover:border-primary/50 text-left transition-all shadow-sm flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-foreground flex items-center gap-1">
                    📖 Olvasó
                  </span>
                  {demoLoggingIn === "reader" && <span className="text-[10px] text-primary animate-spin">⏳</span>}
                </div>
                <span className="text-[10px] text-muted-foreground">11k könyv, AI keresés</span>
              </button>

              <button
                type="button"
                disabled={loading || Boolean(demoLoggingIn)}
                onClick={() => handleInstantDemoLogin("supporter")}
                className="py-2.5 px-3 rounded-xl bg-background/80 hover:bg-background border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all shadow-sm flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-500 flex items-center gap-1">
                    ⭐ VIP Támogató
                  </span>
                  {demoLoggingIn === "supporter" && <span className="text-[10px] text-emerald-500 animate-spin">⏳</span>}
                </div>
                <span className="text-[10px] text-muted-foreground">1000 AI kvóta, letöltés</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border/70"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-muted-foreground">Vagy belépés saját fiókkal</span>
            <div className="flex-grow border-t border-border/70"></div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                E-mail cím vagy felhasználónév
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="pl. olvaso@librarian.ai"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/60 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Jelszó
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/60 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Bejelentkezés folyamatban..." : "Bejelentkezés"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo test account helper */}
          <div className="pt-4 border-t border-border/60">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 text-center">
              Példa tesztfiók adatok
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFillDemo("olvaso@librarian.ai", "UserPassword123!")}
                className="p-2.5 rounded-lg bg-secondary/70 hover:bg-secondary border border-border/70 text-left transition-colors"
              >
                <span className="font-bold block text-foreground">📖 Olvasó (Ingyenes)</span>
                <span className="text-[10px] text-muted-foreground">olvaso@librarian.ai</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("supporter@librarian.ai", "UserPassword123!")}
                className="p-2.5 rounded-lg bg-secondary/70 hover:bg-secondary border border-border/70 text-left transition-colors"
              >
                <span className="font-bold block text-emerald-500">⭐ Támogató (VIP)</span>
                <span className="text-[10px] text-muted-foreground">supporter@librarian.ai</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Még nincs fiókod?{" "}
            <Link href="/register" className="font-bold text-primary hover:underline">
              Regisztrálj most
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Biztonságos kapcsolat • Bcrypt titkosítás • OWASP szabványok</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
          Betöltés...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
