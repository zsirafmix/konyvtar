import React from "react";
import {
  Library,
  MessagesSquare,
  MessageCircle,
  Sparkles,
  Award,
  User,
} from "lucide-react";
import { DashboardTile, DashboardTileProps } from "./DashboardTile";

export const DashboardGrid: React.FC = () => {
  const tiles: DashboardTileProps[] = [
    {
      title: "Katalógus",
      description: "Böngéssz a 11 472 Calibre felhőkötet között, szűrj 103 kategóriára, vagy keress szerző és cím szerint.",
      href: "/library",
      icon: Library,
      badge: "11 472 kötet",
      accentColor: "blue",
      statLabel: "Kategóriák",
      statValue: "103 Műfaj",
    },
    {
      title: "Fórum",
      description: "Közösségi témák, olvasói élmények megosztása, könyvviták és moderált beszélgetések regisztrált tagoknak.",
      href: "/forum",
      icon: MessagesSquare,
      badge: "Közösség",
      accentColor: "purple",
      statLabel: "Beszélgetések",
      statValue: "Aktív témák",
    },
    {
      title: "Chat",
      description: "Valós idejű közösségi csevegőszobák könyvajánlókhoz, sci-fihez és általános olvasói eszmecserékhez.",
      href: "/community-chat",
      icon: MessageCircle,
      badge: "Élő",
      accentColor: "emerald",
      statLabel: "Csatornák",
      statValue: "#általános, #könyvek...",
    },
    {
      title: "AI Könyvtáros",
      description: "Kérdezz bármit a könyvtár gyűjteményéről, kérj egyedi olvasói ajánlásokat RAG szemantikus keresőnkkel.",
      href: "/chat",
      icon: Sparkles,
      badge: "Intelligens RAG",
      accentColor: "teal",
      statLabel: "AI Modell",
      statValue: "Gemini 1.5 Flash",
    },
    {
      title: "Prémium / Superuser – $1",
      description: "Támogasd a könyvtárat csupán $1 hozzájárulással: azonnali közvetlen letöltés, privát feltöltés és 1000 AI kérés/nap.",
      href: "/supporter",
      icon: Award,
      badge: "1$ Támogató",
      accentColor: "amber",
      statLabel: "Prémium előnyök",
      statValue: "Korlátlan & Gyors",
    },
    {
      title: "Profilom",
      description: "Tekintsd meg fiókadataidat, olvasói szerepkörödet, egyéni jogosultságaidat és napi AI kvótádat.",
      href: "/profile",
      icon: User,
      badge: "Fiók",
      accentColor: "rose",
      statLabel: "Saját fiók",
      statValue: "Jogosultságok & Stat",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Főmenü & Funkciók
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Válassz az alábbi modulok közül az olvasói univerzumod felfedezéséhez
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tiles.map((tile) => (
          <DashboardTile key={tile.title} {...tile} />
        ))}
      </div>
    </div>
  );
};
