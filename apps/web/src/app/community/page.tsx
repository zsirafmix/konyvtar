"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  MessagesSquare,
  MessageCircle,
  BookOpen,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Award,
  Flame,
  Heart,
  ExternalLink,
} from "lucide-react";

interface ForumTopicSummary {
  id: string;
  title: string;
  slug: string;
  content: string;
  viewsCount: number;
  postsCount: number;
  createdAt: string;
  author: {
    name: string;
    role: string;
  };
}

const CHAT_ROOMS = [
  {
    id: "room_altalanos",
    name: "Általános csevegő",
    description: "Kötetlenebb beszélgetések a könyvekről, olvasási szokásokról és a könyvtárról.",
    icon: "☕",
  },
  {
    id: "room_konyvek",
    name: "Könyvajánlók & Vélemények",
    description: "Mit olvasol most? Oszd meg a legújabb kedvencedet vagy kérj ajánlást!",
    icon: "📖",
  },
  {
    id: "room_scifi",
    name: "Sci-Fi & Fantasy Kör",
    description: "Asimov Alapítványától Frank Herbert Dűnéjén át a modern világokig.",
    icon: "🚀",
  },
  {
    id: "room_technika",
    name: "Technika & AI",
    description: "Beszélgetések az AI Könyvtárosról, az e-könyv olvasó fejlesztéséről és a felhőtárról.",
    icon: "⚡",
  },
];

const READING_CLUBS = [
  {
    id: "scifi-club",
    name: "Sci-Fi & Cyberpunk Olvasókör",
    description: "A jövő klasszikusai, mesterséges intelligencia, űrutazás és disztópiák.",
    currentBook: "Alapítvány – Isaac Asimov",
    bookSlug: "isaac-asimov-alapitvany-269",
    coverUrl: "/api/cover/uBZzGRKT",
  },
  {
    id: "classics-club",
    name: "Klasszikus Magyar Irodalom",
    description: "Szerb Antal, Márai Sándor, Karinthy Frigyes és a XX. századi remekművek közös feldolgozása.",
    currentBook: "Utas és holdvilág – Szerb Antal",
    bookSlug: "szerb-antal-utas-es-holdvilag-10335",
    coverUrl: "/api/cover/yFRRgRbK",
  },
  {
    id: "mystery-club",
    name: "Kalandok és Rejtélyek Köre",
    description: "Rejtő Jenő szellemes kalandjai, Agatha Christie detektívregényei és klasszikus ponyvák.",
    currentBook: "A tizennégy karátos autó – Rejtő Jenő",
    bookSlug: "rejto-jeno-01-a-tizennegy-karatos-autox-10474",
    coverUrl: "/api/cover/fZ4RGQQb",
  },
];

export default function CommunityPage() {
  const [topics, setTopics] = useState<ForumTopicSummary[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [forumRes, statsRes] = await Promise.all([
          fetch("/api/forum/topics"),
          fetch("/api/admin/stats").catch(() => null),
        ]);

        if (forumRes.ok) {
          const fData = await forumRes.json();
          setTopics(fData.topics || []);
        }
        if (statsRes && statsRes.ok) {
          const sData = await statsRes.json();
          setStats(sData);
        }
      } catch (err) {
        console.warn("Error fetching community hub data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10 pb-20">
      {/* Hero / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Közösségi Irányítópult</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Közösség & Olvasói Tér</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fórum viták, élő csevegőszobák, könyvklubok és eszmecsere a 11 472 kötetes könyvtár körül.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/community-chat"
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
          >
            <MessagesSquare className="w-4 h-4" />
            <span>Élő Csevegő megnyitása</span>
          </Link>
          <Link
            href="/forum"
            className="px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs flex items-center gap-1.5 border border-border transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Fórum felkeresése</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Left 2 Cols, Right 1 Col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Forum Threads & Reading Clubs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Forum Topics Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span>Legfrissebb Fórum Témák</span>
              </h2>
              <Link
                href="/forum"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Összes téma</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {topics.length === 0 ? (
                <div className="p-6 rounded-2xl bg-card border border-border text-center text-xs text-muted-foreground">
                  A fórum témái betöltés alatt...
                </div>
              ) : (
                topics.map((t) => (
                  <Link
                    key={t.id}
                    href={`/forum/${t.slug}`}
                    className="block p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm group space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                        {t.title}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium shrink-0">
                        {t.postsCount} hozzászólás
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.content}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <span>Szerző: <strong className="text-foreground font-medium">{t.author.name}</strong></span>
                      <span>{t.viewsCount} megtekintés</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Active Reading Clubs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Aktív Könyvklubok</span>
              </h2>
              <Link
                href="/clubs"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Klubok megtekintése</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {READING_CLUBS.map((club) => (
                <div
                  key={club.id}
                  className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-secondary flex items-center justify-center p-2 relative shadow-inner">
                      {club.coverUrl && (
                        <img
                          src={club.coverUrl}
                          alt={club.currentBook}
                          className="h-full object-contain rounded drop-shadow-md"
                        />
                      )}
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-foreground leading-snug">
                      {club.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {club.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 text-[11px] space-y-2">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Aktuális könyv:</span>
                      <Link
                        href={`/book/${club.bookSlug}`}
                        className="font-semibold text-primary hover:underline line-clamp-1"
                      >
                        {club.currentBook}
                      </Link>
                    </div>

                    <Link
                      href="/clubs"
                      className="block w-full text-center py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-[11px] transition-colors"
                    >
                      Klub Részletei
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Chat Rooms & Library Guidelines */}
        <div className="space-y-6">
          {/* Live Chat Rooms Card */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessagesSquare className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-foreground">Élő Csevegőszobák</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                Élő
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Csatlakozz a valós idejű közösségi beszélgetésekhez kedvenc témáid szerint:
            </p>

            <div className="space-y-2.5 pt-1">
              {CHAT_ROOMS.map((room) => (
                <Link
                  key={room.id}
                  href="/community-chat"
                  className="p-3 rounded-2xl bg-secondary/40 hover:bg-secondary border border-border/60 transition-colors block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span>{room.icon}</span>
                      <span>{room.name}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                    {room.description}
                  </p>
                </Link>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/community-chat"
                className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <span>Belépés a Csevegőbe</span>
              </Link>
            </div>
          </div>

          {/* Real Library Statistics summary */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Platform Átláthatóság</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 text-center">
                <span className="font-black text-xl text-primary block">11 472</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Digitális Kötet</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 text-center">
                <span className="font-black text-xl text-emerald-500 block">103</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Katalógus Műfaj</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 text-center">
                <span className="font-black text-xl text-foreground block">
                  {stats?.totalDownloads !== undefined ? stats.totalDownloads : "0"}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Letöltés</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 text-center">
                <span className="font-black text-xl text-foreground block">
                  {stats?.activeVisitorsCount !== undefined ? stats.activeVisitorsCount : "1"}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Jelenlévő</span>
              </div>
            </div>
          </div>

          {/* Community Guidelines Card */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-3 shadow-sm text-xs">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Közösségi Irányelvek</span>
            </div>
            <ul className="space-y-1.5 text-muted-foreground list-disc pl-4 leading-relaxed">
              <li>Kulturált, kölcsönös tiszteleten alapuló eszmecsere.</li>
              <li>A közkincs és nyílt licences források tiszteletben tartása.</li>
              <li>Könyvélmények és ajánlások megosztása a többi olvasóval.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
