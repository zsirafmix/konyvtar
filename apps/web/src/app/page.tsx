"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Library,
  Crown,
  Shield,
  Award,
  User,
  Search,
  Cloud,
} from "lucide-react";
import { NewBooksShelf } from "@/components/dashboard/NewBooksShelf";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";

export default function DashboardPage() {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setActiveUser(data.user);
        }
      } catch (err) {
        console.warn("Nem sikerült lekérni a felhasználót:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const role = activeUser?.role || "user";
  const displayName = activeUser?.displayName || "Olvasó";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-10 pb-20">
      {/* Top Welcome & Atmosphere Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-secondary/40 border border-border/70 p-6 sm:p-8 shadow-sm">
        {/* Glow circles */}
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/25">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>LIBRARIAN AI • DIGITÁLIS OLVASÓI IRÁNYÍTÓPULT</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Üdvözlünk újra,{" "}
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                {displayName}
              </span>
              ! 👋
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Fedezd fel a több mint <strong className="text-foreground">11 472 kötetes</strong> Calibre gyűjteményt, beszélgess a közösséggel a fórumon és a chaten, vagy kérdezd a mesterséges intelligenciát az olvasmányaidról.
            </p>
          </div>

          {/* Quick status pill card */}
          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/80 border border-border/70 text-xs">
              <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                {role === "admin" ? (
                  <Crown className="w-4 h-4 text-amber-400" />
                ) : role === "moderator" ? (
                  <Shield className="w-4 h-4 text-blue-400" />
                ) : role === "superuser" ? (
                  <Award className="w-4 h-4 text-emerald-400" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Szerepkör
                </span>
                <span className="font-extrabold text-foreground text-sm uppercase">
                  {role === "admin"
                    ? "Adminisztrátor"
                    : role === "moderator"
                    ? "Moderátor"
                    : role === "superuser"
                    ? "1$ Superuser"
                    : "Olvasó"}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/50 text-xs text-muted-foreground">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>MEGA Cloud Index Szinkronizálva</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Újonnan feltöltött könyvek (Horizontally Scrollable) */}
      <NewBooksShelf />

      {/* SECTION 2: Csempés Főmenü (6 Modern Large Tiles) */}
      <DashboardGrid />
    </div>
  );
}
