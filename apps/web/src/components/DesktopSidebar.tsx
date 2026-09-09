"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Library,
  Search,
  Users,
  ListTree,
  MessagesSquare,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Heart,
  User,
  Settings,
  ShieldAlert,
  Sparkles,
  Award,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const DesktopSidebar: React.FC<{ userRole?: string; isSupporter?: boolean }> = ({
  userRole = "ADMIN", // default admin in dev
  isSupporter = true,
}) => {
  const pathname = usePathname();

  const primaryNav = [
    { label: "Kezdőlap", href: "/", icon: Home },
    { label: "Katalógus", href: "/library", icon: Library },
    { label: "Fórum", href: "/forum", icon: MessagesSquare },
    { label: "Közösségi Chat", href: "/community-chat", icon: Users },
    { label: "AI Könyvtáros", href: "/chat", icon: Sparkles, isAi: true },
    { label: "Felfedezés", href: "/discover", icon: Compass },
    { label: "Keresés", href: "/search", icon: Search },
    { label: "Könyvklubok", href: "/clubs", icon: ListTree },
  ];

  const libraryShelves = [
    { label: "Jelenleg olvasom", href: "/library?status=READING", icon: BookOpen },
    { label: "El akarom olvasni", href: "/library?status=WANT_TO_READ", icon: Bookmark },
    { label: "Befejezett", href: "/library?status=COMPLETED", icon: CheckCircle2 },
    { label: "Kedvencek", href: "/library?status=FAVORITES", icon: Heart },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-card border-r border-border p-4 select-none z-20">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-3 py-3 mb-4 rounded-xl hover:bg-accent/50 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-primary-foreground font-black text-lg shadow-sm">
          L
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-foreground block">Librarian AI</span>
          <span className="text-[10px] text-muted-foreground block -mt-1 font-medium">Digitális Könyvtár</span>
        </div>
      </Link>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 hide-scrollbar">
        {/* Primary Links */}
        <nav className="space-y-1">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", item.isAi && "text-emerald-500")} />
                  <span>{item.label}</span>
                </div>
                {item.isAi && (
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-primary/20 text-primary">
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="h-px bg-border my-2" />

        {/* Reading Status Shelves */}
        <div>
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 block mb-2">
            Olvasási Napló
          </span>
          <nav className="space-y-1">
            {libraryShelves.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Separator */}
        <div className="h-px bg-border my-2" />

        {/* Bottom Options */}
        <div className="space-y-1">
          <Link
            href="/supporter"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Támogatói tagság</span>
            </div>
            <span className="text-[10px] font-bold">1 €/hét</span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Profil</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Beállítások</span>
          </Link>

          {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Admin</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                Pult
              </span>
            </Link>
          )}

          {/* Quick Logout Button */}
          <button
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {}
              window.location.href = "/login?switch=true";
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4 text-destructive" />
            <span>Kijelentkezés</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
