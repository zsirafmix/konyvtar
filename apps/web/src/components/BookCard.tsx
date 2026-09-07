"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, Heart, Bookmark, Check, ShieldCheck, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookCardProps {
  id: string;
  slug: string;
  title: string;
  authors: { name: string }[];
  averageRating: number;
  ratingsCount?: number;
  coverUrl?: string | null;
  distributionStatus?: string;
  libraryReleaseAt?: string | Date;
  aiSummary?: string | null;
  isFavorite?: boolean;
  readingStatus?: string | null;
  onStatusChange?: (status: string) => void;
  onToggleFavorite?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  id,
  slug,
  title,
  authors,
  averageRating,
  ratingsCount,
  coverUrl,
  distributionStatus,
  libraryReleaseAt,
  aiSummary,
  isFavorite: initialFavorite = false,
  readingStatus: initialStatus,
  onStatusChange,
  onToggleFavorite,
}) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [status, setStatus] = useState(initialStatus);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Check 21 day rule for free members
  const releaseDate = libraryReleaseAt ? new Date(libraryReleaseAt) : new Date();
  const availableAt = new Date(releaseDate.getTime() + 21 * 24 * 3600 * 1000);
  const isWithin21Days = distributionStatus === "LICENSED" && Date.now() < availableAt.getTime();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onToggleFavorite?.();
  };

  const handleStatusSelect = (newStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus(newStatus);
    setShowStatusMenu(false);
    onStatusChange?.(newStatus);
  };

  return (
    <div className="group relative flex flex-col w-[170px] sm:w-[190px] flex-shrink-0 transition-transform duration-300 hover:-translate-y-1">
      {/* 2:3 Aspect Ratio Book Cover */}
      <Link href={`/book/${slug}`} className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-muted shadow-md group-hover:shadow-xl transition-all">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-secondary to-muted">
            <span className="font-semibold text-xs line-clamp-3 text-foreground">{title}</span>
            <span className="text-[10px] text-muted-foreground mt-1">{authors[0]?.name}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isWithin21Days && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/90 text-white backdrop-blur-sm shadow-sm">
              <Clock className="w-2.5 h-2.5" />
              21 nap
            </span>
          )}
          {distributionStatus === "PUBLIC_DOMAIN" && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-600/90 text-white backdrop-blur-sm shadow-sm">
              <ShieldCheck className="w-2.5 h-2.5" />
              Közkincs
            </span>
          )}
          {distributionStatus === "PRIVATE" && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-600/90 text-white backdrop-blur-sm shadow-sm">
              Privát
            </span>
          )}
        </div>

        {/* AI Transparency Pill */}
        {aiSummary && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-black/60 text-primary-foreground backdrop-blur-md border border-white/10">
              <Sparkles className="w-2.5 h-2.5 text-primary" />
              AI
            </span>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-start justify-end p-2 gap-1.5">
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "p-2 rounded-full backdrop-blur-md transition-colors shadow-sm",
              isFavorite ? "bg-red-500 text-white" : "bg-black/60 text-white hover:bg-black/80"
            )}
            title={isFavorite ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez"}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowStatusMenu(!showStatusMenu);
              }}
              className={cn(
                "p-2 rounded-full backdrop-blur-md transition-colors shadow-sm",
                status ? "bg-primary text-primary-foreground" : "bg-black/60 text-white hover:bg-black/80"
              )}
              title="Olvasási státusz"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Quick Status Dropdown */}
            {showStatusMenu && (
              <div className="absolute right-0 top-10 w-44 bg-card text-card-foreground border border-border rounded-xl shadow-xl py-1 z-30 text-xs animate-in fade-in zoom-in-95">
                <button
                  onClick={(e) => handleStatusSelect("READING", e)}
                  className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center justify-between"
                >
                  <span>Jelenleg olvasom</span>
                  {status === "READING" && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
                <button
                  onClick={(e) => handleStatusSelect("WANT_TO_READ", e)}
                  className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center justify-between"
                >
                  <span>El akarom olvasni</span>
                  {status === "WANT_TO_READ" && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
                <button
                  onClick={(e) => handleStatusSelect("COMPLETED", e)}
                  className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center justify-between"
                >
                  <span>Befejeztem</span>
                  {status === "COMPLETED" && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Book Info */}
      <div className="mt-2.5 flex flex-col">
        <Link href={`/book/${slug}`} className="font-semibold text-sm line-clamp-1 text-foreground hover:text-primary transition-colors">
          {title}
        </Link>
        <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {authors.map((a) => a.name).join(", ")}
        </span>
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex items-center text-amber-500">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-medium ml-1 text-foreground">{averageRating.toFixed(1)}</span>
          </div>
          {ratingsCount ? (
            <span className="text-[11px] text-muted-foreground">({ratingsCount})</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
