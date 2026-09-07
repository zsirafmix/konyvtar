"use client";

import React from "react";
import Link from "next/link";
import { MessagesSquare, Users, BookOpen, Calendar, ArrowRight } from "lucide-react";

export default function BookClubsPage() {
  const clubs = [
    {
      id: "c1",
      name: "Sci-Fi és Filozófia Könyvklub",
      description: "Havi közös olvasások, mélyreható elemzések és viták a sci-fi aranykorától a kortárs remekművekig.",
      currentBook: "Alapítvány (Isaac Asimov)",
      currentBookSlug: "alapitvany",
      memberCount: 42,
      activeDiscussion: "Valóban elkerülhetetlen a Birodalom bukása? – Vita az 1. fejezetről",
      discussionsCount: 14,
    },
    {
      id: "c2",
      name: "Kiberpunk & Digitális Jövő",
      description: "Technológiai disztópiák, transzhumanizmus és virtuális valóságok olvasóköre.",
      currentBook: "Neurománc (William Gibson)",
      currentBookSlug: "neuromanc",
      memberCount: 28,
      activeDiscussion: "A Mátrix és a modern internet összevetése 40 év távlatából",
      discussionsCount: 9,
    },
    {
      id: "c3",
      name: "Klasszikus Történelmi Regények",
      description: "Róma, a középkor és a reneszánsz nagy ívű krónikái és életrajzai.",
      currentBook: "Róma tündöklése és bukása (Edward Gibbon)",
      currentBookSlug: "roma-tundoklese-es-bukasa",
      memberCount: 19,
      activeDiscussion: "A gazdasági és morális tényezők súlya az ókorban",
      discussionsCount: 6,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Könyvklubok</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Csatlakozz közös olvasásokhoz és mélyreható irodalmi vitákhoz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((c) => (
          <div key={c.id} className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                  Nyilvános klub
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {c.memberCount} tag
                </span>
              </div>

              <h2 className="font-extrabold text-lg text-foreground">{c.name}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>

              {/* Current Book Box */}
              <div className="p-3 rounded-2xl bg-secondary/60 border border-border/60 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Aktuális közös olvasmány
                </span>
                <Link href={`/book/${c.currentBookSlug}`} className="text-xs font-bold text-foreground hover:text-primary transition-colors block truncate">
                  {c.currentBook}
                </Link>
              </div>

              {/* Latest discussion */}
              <div className="text-xs space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <MessagesSquare className="w-3.5 h-3.5 text-primary" />
                  Legfrissebb vitaszál:
                </span>
                <p className="text-foreground/90 font-medium italic truncate">{c.activeDiscussion}</p>
              </div>
            </div>

            <button className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity mt-4 flex items-center justify-center gap-1.5">
              <span>Csatlakozás a klubhoz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
