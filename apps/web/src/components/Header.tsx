"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sun, Moon, Cloud, ShieldCheck, User } from "lucide-react";

export const Header: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Default to dark mode for Spotify / Apple Books aesthetic
    document.documentElement.classList.add("dark");
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
          className="p-2 rounded-full hover:bg-accent text-foreground transition-colors"
          title={isDark ? "Váltás világos módra" : "Váltás sötét módra"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Supporting Member Badge */}
        <Link
          href="/supporter"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>TÁMOGATÓ</span>
        </Link>

        {/* User Profile Avatar */}
        <Link
          href="/profile"
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </header>
  );
};
