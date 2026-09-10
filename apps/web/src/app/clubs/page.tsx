"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessagesSquare, Users, BookOpen, Check, ArrowRight, Sparkles } from "lucide-react";

interface BookClub {
  id: string;
  name: string;
  description: string;
  currentBook: string;
  currentBookSlug: string;
  chatRoomSlug: string;
  activeDiscussion: string;
  baseMemberCount: number;
}

const CLUBS: BookClub[] = [
  {
    id: "c1",
    name: "Sci-Fi és Jövőkutatás Könyvklub",
    description: "Közös olvasások, mélyreható elemzések és viták a sci-fi aranykorától a kortárs remekművekig.",
    currentBook: "Alapítvány (Isaac Asimov)",
    currentBookSlug: "isaac-asimov-alapitvany-269",
    chatRoomSlug: "scifi",
    activeDiscussion: "A Seldon-terv és a pszichohistória lehetőségei a mai világban",
    baseMemberCount: 12,
  },
  {
    id: "c2",
    name: "Klasszikus Magyar Irodalmi Kör",
    description: "A 20. századi magyar próza és lélektani regények közös elemzése és újraolvasása.",
    currentBook: "Utas és holdvilág (Szerb Antal)",
    currentBookSlug: "szerb-antal-utas-es-holdvilag-10335",
    chatRoomSlug: "konyvek",
    activeDiscussion: "Mihály útkeresése Olaszországban és a nosztalgia filozófiája",
    baseMemberCount: 9,
  },
  {
    id: "c3",
    name: "Kalandok és Rejtélyek Műhelye",
    description: "Könnyed, szórakoztató és klasszikus detektívregények, légiós történetek baráti köre.",
    currentBook: "A tizennégy karátos autó (Rejtő Jenő)",
    currentBookSlug: "rejto-jeno-01-a-tizennegy-karatos-autox-10474",
    chatRoomSlug: "altalanos",
    activeDiscussion: "Gorcsev Iván kalandjai és a rejtői humor utánozhatatlan nyelvezete",
    baseMemberCount: 15,
  },
];

export default function BookClubsPage() {
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("librarian_joined_clubs");
      if (saved) {
        setJoinedClubs(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleJoin = (clubId: string) => {
    setJoinedClubs((prev) => {
      const next = prev.includes(clubId) ? prev.filter((id) => id !== clubId) : [...prev, clubId];
      try {
        localStorage.setItem("librarian_joined_clubs", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-20">
      <div className="space-y-1 border-b border-border pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>KÖZÖSSÉGI OLVASÓKÖRÖK</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Könyvklubok</h1>
        <p className="text-sm text-muted-foreground">
          Csatlakozz közös olvasásokhoz, válassz kiemelt köteteket a 11 472 darabos katalógusból és vitasd meg a gondolatokat a csevegőben!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CLUBS.map((c) => {
          const isJoined = joinedClubs.includes(c.id);
          const memberCount = c.baseMemberCount + (isJoined ? 1 : 0);

          return (
            <div
              key={c.id}
              className={`p-6 rounded-3xl bg-card border space-y-4 shadow-sm flex flex-col justify-between transition-all ${
                isJoined ? "border-primary/60 ring-1 ring-primary/20" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isJoined ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30" : "bg-primary/10 text-primary"
                  }`}>
                    {isJoined ? "Tag vagy ✓" : "Nyilvános klub"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {memberCount} tag
                  </span>
                </div>

                <h2 className="font-extrabold text-lg text-foreground">{c.name}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>

                {/* Current Book Box with direct link to catalog book */}
                <div className="p-3.5 rounded-2xl bg-secondary/70 border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Aktuális közös olvasmány
                  </span>
                  <Link
                    href={`/book/${c.currentBookSlug}`}
                    className="text-xs font-bold text-primary hover:underline block truncate"
                  >
                    📖 {c.currentBook}
                  </Link>
                </div>

                {/* Latest discussion */}
                <div className="text-xs space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <MessagesSquare className="w-3.5 h-3.5 text-primary" />
                    Legfrissebb téma:
                  </span>
                  <p className="text-foreground/90 font-medium italic text-xs leading-snug">{c.activeDiscussion}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleToggleJoin(c.id)}
                  className={`w-full py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isJoined
                      ? "bg-secondary hover:bg-destructive/15 text-foreground hover:text-destructive border border-border"
                      : "bg-primary text-primary-foreground hover:opacity-95 shadow-sm"
                  }`}
                >
                  {isJoined ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Tagság lemondása</span>
                    </>
                  ) : (
                    <>
                      <span>Csatlakozás a klubhoz</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {isJoined && (
                  <Link
                    href="/community-chat"
                    className="w-full py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs text-center block transition-colors border border-emerald-500/30"
                  >
                    💬 Csevegés megnyitása a szobában
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
