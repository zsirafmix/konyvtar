"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sun, Moon, Cloud, ShieldCheck, User, Crown, Shield, Sparkles, LogOut } from "lucide-react";

export const Header: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    // Default to dark mode for Spotify / Apple Books aesthetic
    document.documentElement.classList.add("dark");

    async function fetchActiveUser() {
      try {
        const res = await fetch("/api/auth/active-user");
        if (res.ok) {
          const data = await res.json();
          setActiveUser(data.user);
        }
      } catch (err) {
        console.warn("Could not fetch active user:", err);
      }
    }
    fetchActiveUser();
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const role = activeUser?.role || "user";

  return (
    <header className="sticky top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-10 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
      {/* Top Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Keresés könyvek, szerzők, ISBN vagy témák között..."
          className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary/70 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Storage status pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs text-muted-foreground">
          <Cloud className="w-3.5 h-3.5 text-primary" />
          <span>MEGA Szinkron aktív</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-accent text-foreground transition-colors cursor-pointer"
          title={isDark ? "Váltás világos módra" : "Váltás sötét módra"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Role Badge */}
        {role === "admin" && (
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
            title="Kattints az admin pult megnyitásához"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>ADMINISZTRÁTOR</span>
          </Link>
        )}

        {role === "moderator" && (
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>MODERÁTOR</span>
          </Link>
        )}

        {role === "superuser" && (
          <Link
            href="/supporter"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>SUPERUSER (1$)</span>
          </Link>
        )}

        {role === "user" && (
          <Link
            href="/supporter"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary text-muted-foreground border border-border hover:text-foreground transition-colors cursor-pointer"
          >
            <span>OLVASÓ • 1$ SUPERUSER?</span>
          </Link>
        )}

        {/* User Profile Avatar */}
        <Link
          href="/profile"
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-accent transition-colors"
          title={activeUser ? `${activeUser.displayName || activeUser.name} (${role})` : "Profil"}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
            role === "admin"
              ? "bg-amber-500/20 text-amber-500 border border-amber-500/40"
              : role === "superuser"
              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40"
              : role === "moderator"
              ? "bg-blue-500/20 text-blue-500 border border-blue-500/40"
              : "bg-primary/20 text-primary"
          }`}>
            {role === "admin" ? "👑" : role === "superuser" ? "⭐" : role === "moderator" ? "🛡️" : <User className="w-4 h-4" />}
          </div>
        </Link>

        {/* Visible Logout Button */}
        <button
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", { method: "POST" });
            } catch {}
            window.location.href = "/login?switch=true";
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
          title="Kijelentkezés a fiókból"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kijelentkezés</span>
        </button>
      </div>
    </header>
  );
};
