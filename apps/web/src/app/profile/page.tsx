"use client";

import React from "react";
import Link from "next/link";
import { User, Award, BookOpen, Star, Bookmark, Heart, Settings, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-20">
      {/* Profile Header */}
      <div className="p-8 rounded-3xl bg-card border border-border flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-emerald-400 p-1 flex-shrink-0">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
            alt="Profilkép"
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-2xl font-extrabold text-foreground">Főkönyvtáros Admin</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>SUPPORTING MEMBER</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400">
              SUPER_ADMIN
            </span>
          </div>

          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            A Librarian AI rendszergazdája és kurátora. Éjszakai hard sci-fi olvasó és rendszerépítő.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Kedvenc műfajok:</span>
            {["Sci-Fi", "Filozófia", "Kiberpunk", "Űropera"].map((g) => (
              <span key={g} className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {g}
              </span>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center sm:justify-start gap-6 pt-4 text-xs">
            <div>
              <span className="font-extrabold text-base text-foreground block">38</span>
              <span className="text-muted-foreground">Elolvasott könyv</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="font-extrabold text-base text-foreground block">24</span>
              <span className="text-muted-foreground">Értékelés</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="font-extrabold text-base text-foreground block">12</span>
              <span className="text-muted-foreground">Követő</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <span className="font-extrabold text-base text-foreground block">19</span>
              <span className="text-muted-foreground">Követve</span>
            </div>
          </div>
        </div>

        <Link
          href="/settings"
          className="p-2.5 rounded-2xl bg-secondary hover:bg-accent text-secondary-foreground transition-colors"
          title="Profil szerkesztése"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      {/* Profile Shelves Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-card border border-border space-y-1">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Jelenleg olvasás alatt</span>
          </span>
          <p className="font-extrabold text-base text-foreground">Dűne (Frank Herbert)</p>
          <span className="text-[11px] text-primary font-semibold">65% befejezve</span>
        </div>

        <div className="p-5 rounded-3xl bg-card border border-border space-y-1">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-amber-500" />
            <span>Következő a listán</span>
          </span>
          <p className="font-extrabold text-base text-foreground">Solaris (Stanisław Lem)</p>
          <span className="text-[11px] text-muted-foreground">Mentve 3 napja</span>
        </div>

        <div className="p-5 rounded-3xl bg-card border border-border space-y-1">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-red-500" />
            <span>Örök kedvenc</span>
          </span>
          <p className="font-extrabold text-base text-foreground">Alapítvány (Isaac Asimov)</p>
          <span className="text-[11px] text-amber-500 font-bold">5.0 ★ Értékelve</span>
        </div>
      </div>
    </div>
  );
}
