"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, AlertCircle, ArrowRight, ShieldCheck, Check, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError("Kérjük, minden mezőt tölts ki!");
      return;
    }

    if (!hasMinLength || !hasUpper || !hasNumber) {
      setError("A jelszónak legalább 8 karakteresnek kell lennie, és tartalmaznia kell legalább 1 nagybetűt és 1 számot.");
      return;
    }

    if (!passwordsMatch) {
      setError("A két jelszó nem egyezik meg!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hiba történt a regisztráció során.");
        return;
      }

      // Successful registration & auto-login
      window.location.href = "/";
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
      window.location.href = data.redirectUrl || "/discover";
    } catch {
      setError("Hálózati hiba a teszt belépéskor.");
      setDemoLoggingIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-primary-foreground font-black text-2xl shadow-lg shadow-primary/20">
            L
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Fiók Létrehozása
          </h1>
          <p className="text-sm text-muted-foreground">
            Csatlakozz a Librarian AI olvasói közösségéhez
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Instant Tester Login banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-emerald-500/15 to-primary/10 border border-primary/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Nem szeretnél regisztrálni?
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                1 kattintásos teszt
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Próbáld ki azonnal a digitális könyvtárat regisztráció nélkül:
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
                <span className="text-[10px] text-muted-foreground">11k könyv, AI</span>
              </button>

              <button
                type="button"
                disabled={loading || Boolean(demoLoggingIn)}
                onClick={() => handleInstantDemoLogin("supporter")}
                className="py-2.5 px-3 rounded-xl bg-background/80 hover:bg-background border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all shadow-sm flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-500 flex items-center gap-1">
                    ⭐ Támogató
                  </span>
                  {demoLoggingIn === "supporter" && <span className="text-[10px] text-emerald-500 animate-spin">⏳</span>}
                </div>
                <span className="text-[10px] text-muted-foreground">VIP kvóta, letöltés</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border/70"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-muted-foreground">Vagy hozz létre új fiókot</span>
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
                Felhasználónév
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="pl. Konyvmoly99"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/60 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                E-mail cím
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pl. olvaso@example.hu"
                  required
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
                  placeholder="Legalább 8 karakter, 1 nagybetű, 1 szám"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/60 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Jelszó megerősítése
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/60 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                />
              </div>
            </div>

            {/* Password checklist */}
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasMinLength ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  ✓
                </div>
                <span className={hasMinLength ? "text-foreground font-medium" : ""}>Legalább 8 karakter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasUpper ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  ✓
                </div>
                <span className={hasUpper ? "text-foreground font-medium" : ""}>Legalább 1 nagybetű (A–Z)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${hasNumber ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  ✓
                </div>
                <span className={hasNumber ? "text-foreground font-medium" : ""}>Legalább 1 számjegy (0–9)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Fiók létrehozása..." : "Regisztráció befejezése"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Már van fiókod?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Jelentkezz be itt
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Bcrypt jelszótitkosítás • Zárt hozzáférés • Adatvédelem</span>
        </div>
      </div>
    </div>
  );
}
