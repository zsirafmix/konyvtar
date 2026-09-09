import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

export interface DashboardTileProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  accentColor: "emerald" | "blue" | "purple" | "amber" | "rose" | "teal";
  statLabel?: string;
  statValue?: string;
}

const colorMap = {
  emerald: {
    bg: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    border: "group-hover:border-emerald-500/50",
    iconBg: "bg-emerald-500/20 text-emerald-400",
    badgeBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    glow: "group-hover:shadow-emerald-500/10",
  },
  blue: {
    bg: "from-blue-500/15 via-blue-500/5 to-transparent",
    border: "group-hover:border-blue-500/50",
    iconBg: "bg-blue-500/20 text-blue-400",
    badgeBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    glow: "group-hover:shadow-blue-500/10",
  },
  purple: {
    bg: "from-purple-500/15 via-purple-500/5 to-transparent",
    border: "group-hover:border-purple-500/50",
    iconBg: "bg-purple-500/20 text-purple-400",
    badgeBg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    glow: "group-hover:shadow-purple-500/10",
  },
  amber: {
    bg: "from-amber-500/15 via-amber-500/5 to-transparent",
    border: "group-hover:border-amber-500/50",
    iconBg: "bg-amber-500/20 text-amber-400",
    badgeBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    glow: "group-hover:shadow-amber-500/10",
  },
  rose: {
    bg: "from-rose-500/15 via-rose-500/5 to-transparent",
    border: "group-hover:border-rose-500/50",
    iconBg: "bg-rose-500/20 text-rose-400",
    badgeBg: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    glow: "group-hover:shadow-rose-500/10",
  },
  teal: {
    bg: "from-teal-500/15 via-teal-500/5 to-transparent",
    border: "group-hover:border-teal-500/50",
    iconBg: "bg-teal-500/20 text-teal-400",
    badgeBg: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    glow: "group-hover:shadow-teal-500/10",
  },
};

export const DashboardTile: React.FC<DashboardTileProps> = ({
  title,
  description,
  href,
  icon: Icon,
  badge,
  accentColor,
  statLabel,
  statValue,
}) => {
  const styles = colorMap[accentColor];

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl bg-card border border-border/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.border} ${styles.glow} flex flex-col justify-between`}
    >
      {/* Subtle top gradient glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      <div className="relative z-10 space-y-4">
        {/* Top bar: Icon and Badge */}
        <div className="flex items-center justify-between">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className="w-6 h-6" />
          </div>

          {badge && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${styles.badgeBg}`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
            <span>{title}</span>
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Footer / Stat area */}
      <div className="relative z-10 pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        {statLabel ? (
          <div>
            <span className="text-muted-foreground/80 block text-[10px] uppercase font-bold tracking-wider">
              {statLabel}
            </span>
            <span className="text-foreground font-extrabold text-sm">{statValue}</span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-primary group-hover:underline">
            Megnyitás &rarr;
          </span>
        )}

        <span className="text-primary font-bold text-xs group-hover:translate-x-1 transition-transform">
          Tovább &rarr;
        </span>
      </div>
    </Link>
  );
};
