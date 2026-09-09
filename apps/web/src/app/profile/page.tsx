"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Crown,
  Shield,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  KeyRound,
  LogOut,
  Settings,
  Lock,
  Download,
  MessageCircle,
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passMessage, setPassMessage] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Nem sikerült lekérni a profilt:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setChangingPass(true);
    setPassMessage("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPassMessage("Jelszavad sikeresen frissítve!");
        setOldPassword("");
        setNewPassword("");
      } else {
        setPassMessage(data.error || "Hiba a jelszó módosításakor.");
      }
    } catch {
      setPassMessage("Hálózati hiba történt.");
    } finally {
      setChangingPass(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "2026. jan. 1.";
    try {
      return new Date(dateStr).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-44 rounded-3xl bg-secondary/80 w-full" />
        <div className="h-64 rounded-3xl bg-secondary/80 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <User className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Nem sikerült betölteni a profilt</h2>
        <Link href="/login" className="text-primary font-bold hover:underline">
          Kérjük, jelentkezz be újra &rarr;
        </Link>
      </div>
    );
  }

  const role = user.role || "user";
  const perms = user.permissions || {};
  const isSuperuser = role === "superuser" || user.membershipStatus === "SUPPORTER";

  const permissionItems = [
    { key: "canDownload", label: "Könyvek letöltése (EPUB / MOBI / PDF)", value: perms.canDownload ?? true },
    { key: "canDirectDownload", label: "Közvetlen gyors felhőletöltés (Superuser)", value: perms.canDirectDownload ?? false },
    { key: "canUploadPrivate", label: "Saját privát könyvek feltöltése a felhőbe", value: perms.canUploadPrivate ?? false },
    { key: "canUseChat", label: "Közösségi chat hozzáférés", value: perms.canUseChat ?? true },
    { key: "canSendChatMessages", label: "Üzenetküldés a közösségi csevegőben", value: perms.canSendChatMessages ?? true },
    { key: "canCreateChatRooms", label: "Új csevegőszobák létrehozása", value: perms.canCreateChatRooms ?? false },
    { key: "canModerateChat", label: "Chat moderációs jogosultság", value: perms.canModerateChat ?? false },
    { key: "canModerate", label: "Könyvtári és fórum tartalom moderációja", value: perms.canModerate ?? false },
    { key: "canAdmin", label: "Teljes rendszeradminisztrátori hozzáférés", value: perms.canAdmin ?? false },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-24">
      {/* Profile Card Header */}
      <section className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-primary-foreground font-black text-3xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            {user.displayName?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                {user.displayName}
              </h1>

              {/* Role Badges */}
              {role === "admin" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Crown className="w-3.5 h-3.5" />
                  <span>ADMINISZTRÁTOR</span>
                </span>
              )}
              {role === "moderator" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/15 text-blue-500 border border-blue-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  <span>MODERÁTOR</span>
                </span>
              )}
              {isSuperuser && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <Award className="w-3.5 h-3.5" />
                  <span>1$ SUPERUSER</span>
                </span>
              )}
              {role === "user" && !isSuperuser && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-muted-foreground border border-border">
                  OLVASÓ
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Regisztráció: {formatDate(user.createdAt)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 text-xs font-bold transition-colors cursor-pointer shrink-0 z-10"
        >
          <LogOut className="w-4 h-4" />
          <span>Kijelentkezés</span>
        </button>
      </section>

      {/* AI Quota & Limits Card */}
      <section className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Könyvtáros Napi Keret</h2>
              <p className="text-xs text-muted-foreground">
                A rendszerbe épített RAG asszisztens napi kérdéskorlátja a szerepköröd alapján
              </p>
            </div>
          </div>

          <span className="text-sm font-extrabold text-foreground px-3 py-1 rounded-xl bg-secondary border border-border">
            {perms.aiDailyLimit || 20} kérdés / nap
          </span>
        </div>

        {perms.aiDailyLimit <= 20 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Szeretnél több kérdést feltenni az AI-nak?</strong> Csupán 1 dolláros támogatással a napi kereted azonnal <strong>1000 kérdésre</strong> emelkedik!
              </span>
            </div>
            <Link
              href="/supporter"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold shrink-0 hover:opacity-90 shadow-sm transition-opacity"
            >
              Prémium $1 Támogatás &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Granular Permissions Section */}
      <section className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Fiók jogosultságok</span>
          </h2>
          <span className="text-[11px] font-bold text-muted-foreground uppercase">
            Szerveroldali RBAC állapot
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {permissionItems.map((item) => (
            <div
              key={item.key}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                item.value
                  ? "bg-secondary/70 border-border/80 text-foreground"
                  : "bg-secondary/20 border-border/40 text-muted-foreground/60"
              }`}
            >
              <span className="font-semibold">{item.label}</span>
              {item.value ? (
                <div className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aktív</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground/60 shrink-0">
                  <XCircle className="w-4 h-4" />
                  <span>Inaktív</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Security & Password Settings */}
      <section className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
          <KeyRound className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-foreground">Biztonsági beállítások</h2>
        </div>

        {passMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              passMessage.includes("sikeres")
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-destructive/10 text-destructive border border-destructive/30"
            }`}
          >
            {passMessage}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Jelenlegi jelszó</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-secondary/80 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground">Új jelszó (min. 8 karakter)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3.5 py-2 rounded-xl bg-secondary/80 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={changingPass || !oldPassword || !newPassword}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {changingPass ? "Mentés folyamatban..." : "Jelszó megváltoztatása"}
          </button>
        </form>
      </section>
    </div>
  );
}
