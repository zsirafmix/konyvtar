"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, Search, Sparkles, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileNavbar: React.FC = () => {
  const pathname = usePathname();

  const items = [
    { label: "Kezdőlap", href: "/", icon: Home },
    { label: "AI Könyvtáros", href: "/chat", icon: Sparkles },
    { label: "Könyvtáram", href: "/library", icon: Library },
    { label: "Felfedezés", href: "/discover", icon: Compass },
    { label: "Profil", href: "/profile", icon: User },
    { label: "Kilépés", href: "/logout", icon: LogOut },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-30 flex items-center justify-around py-2 px-1 safe-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
