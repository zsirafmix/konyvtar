"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Star, BookOpen, Heart, UserPlus, Sparkles, MessagesSquare } from "lucide-react";

export default function CommunityPage() {
  const [feed] = useState([
    {
      id: "1",
      user: { name: "Kovács Anna (Moderátor)", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
      action: "5 csillagra értékelte a könyvet:",
      target: "Alapítvány",
      targetSlug: "alapitvany",
      detail: "„Minden idők legfontosabb sci-fi regénye. A pszichohistória gondolata és Hari Seldon zsenialitása máig lenyűgöző.”",
      time: "2 órája",
    },
    {
      id: "2",
      user: { name: "Kiss Péter", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
      action: "új nyilvános listát hozott létre:",
      target: "20 Alapvető Kiberpunk Könyv",
      targetSlug: "lists",
      detail: "Válogatás a Gibson-féle aranykortól a kortárs neurális thrillerekig.",
      time: "4 órája",
    },
    {
      id: "3",
      user: { name: "Nagy Bence (Támogató)", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
      action: "elkezdte olvasni a könyvet:",
      target: "Dűne",
      targetSlug: "dune",
      detail: "Haladás: 65% (Arrakis mélyére érve)",
      time: "1 napja",
    },
    {
      id: "4",
      user: { name: "Varga Zsófia", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80" },
      action: "új témát indított a Sci-Fi Könyvklubban:",
      target: "Valóban elkerülhetetlen a Birodalom bukása?",
      targetSlug: "clubs",
      detail: "3 új hozzászólás érkezett a vitaszálhoz.",
      time: "2 napja",
    },
  ]);

  const [tasteMatches] = useState([
    {
      name: "Kiss Péter",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      tasteScore: 88,
      commonBooks: 14,
      sharedFavorites: 5,
      genres: ["Kiberpunk", "Mesterséges Intelligencia"],
    },
    {
      name: "Kovács Anna",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      tasteScore: 92,
      commonBooks: 22,
      sharedFavorites: 8,
      genres: ["Sci-Fi", "Filozófia"],
    },
    {
      name: "Molnár Dóra",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
      tasteScore: 76,
      commonBooks: 9,
      sharedFavorites: 3,
      genres: ["Disztópia", "Filozófia"],
    },
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Közösség</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Követett olvasók tevékenységei, könyvklubok és ízlés-egyezések.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Közösségi Hírfolyam</span>
          </h2>

          <div className="space-y-4">
            {feed.map((item) => (
              <div key={item.id} className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.user.avatar} alt={item.user.name} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-foreground">{item.user.name}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">{item.action}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{item.time}</span>
                </div>

                <div className="pl-12 space-y-1">
                  <Link
                    href={`/${item.targetSlug.startsWith("list") || item.targetSlug.startsWith("club") ? item.targetSlug : `book/${item.targetSlug}`}`}
                    className="font-bold text-sm text-primary hover:underline block"
                  >
                    {item.target}
                  </Link>
                  {item.detail && <p className="text-xs text-foreground/80 italic leading-relaxed">{item.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Taste Similarity & Follow suggestions */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary font-bold text-base">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>Ízlés-egyezés (Taste Match)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Az algoritmus az elolvasott könyvek, csillagértékelések és kedvencek alapján találja meg a hozzád legközelebb álló olvasókat.
            </p>

            <div className="space-y-3 pt-2">
              {tasteMatches.map((match, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-secondary/50 border border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={match.avatar} alt={match.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <span className="font-bold text-xs text-foreground block">{match.name}</span>
                        <span className="text-[10px] text-muted-foreground">{match.genres.join(", ")}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                        {match.tasteScore}%
                      </span>
                      <span className="text-[9px] text-muted-foreground block">egyezés</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
                    <span>{match.commonBooks} közös olvasmány</span>
                    <span>{match.sharedFavorites} közös kedvenc</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
