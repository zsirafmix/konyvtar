"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Star,
  TrendingUp,
  Clock,
  Flame,
  Compass,
  ArrowRight,
  Download,
  Layers,
  Award,
  ShieldCheck,
  Zap,
  ChevronDown,
  Library,
  Users,
} from "lucide-react";
import { HorizontalShelf } from "@/components/HorizontalShelf";
import { BookCardProps } from "@/components/BookCard";

export default function HomePage() {
  const [data, setData] = useState<{
    todaysPick?: {
      book: any;
      reason: string;
      badge: string;
    };
    shelves?: {
      forYou: BookCardProps[];
      continueReading: BookCardProps[];
      newInLibrary: BookCardProps[];
      trending: BookCardProps[];
      becauseYouLiked: BookCardProps[];
      quickReads: BookCardProps[];
    };
  }>({});
  const [loading, setLoading] = useState(true);
  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/recommendations");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Nem sikerült betölteni az ajánlásokat:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-64 rounded-3xl bg-secondary/50 w-full" />
        <div className="h-8 w-48 bg-secondary/50 rounded-lg" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="w-44 aspect-[2/3] bg-secondary/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const pick = data.todaysPick?.book;

  return (
    <div className="pb-16 space-y-12">
      {/* FULL-PAGE WELCOME HERO SHOWCASE */}
      <section className="relative overflow-hidden pt-6 pb-12 px-4 sm:px-8 border-b border-border/60 bg-gradient-to-b from-primary/10 via-card/50 to-background">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-primary/20 via-emerald-500/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -top-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto text-center space-y-8">
          {/* Welcome Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 shadow-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>KÖSZÖNTÜNK A LIBRARIAN AI DIGITÁLIS KÖNYVTÁRBAN • 11 472+ KÖTET</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight leading-[1.15]">
              A Te intelligens digitális könyvtárad és olvasói univerzumod
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Több mint <span className="text-foreground font-bold">11 000 gondosan katalogizált kötet</span>, 22 tematikus műfaj, közvetlen felhőtár-integráció és interaktív AI könyvtáros – mindezt modern, elegáns köntösben.
            </p>
          </div>

          {/* Live Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-sm text-center space-y-1 hover:border-primary/50 transition-all">
              <span className="text-2xl sm:text-3xl font-black text-primary block">11 472+</span>
              <span className="text-xs font-bold text-foreground block">Könyvtári kötet</span>
              <span className="text-[11px] text-muted-foreground block">Calibre digitális archívum</span>
            </div>

            <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-sm text-center space-y-1 hover:border-primary/50 transition-all">
              <span className="text-2xl sm:text-3xl font-black text-emerald-500 block">22</span>
              <span className="text-xs font-bold text-foreground block">Gazdag műfaj</span>
              <span className="text-[11px] text-muted-foreground block">Sci-Fi, Krimi, Történelmi...</span>
            </div>

            <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-sm text-center space-y-1 hover:border-primary/50 transition-all">
              <span className="text-2xl sm:text-3xl font-black text-amber-500 block">100%</span>
              <span className="text-xs font-bold text-foreground block">Közkincs olvasás</span>
              <span className="text-[11px] text-muted-foreground block">Azonnali ingyenes elérés</span>
            </div>

            <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-emerald-500/30 bg-emerald-500/5 shadow-sm text-center space-y-1 hover:border-emerald-500 transition-all">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">1 $</span>
              <span className="text-xs font-bold text-foreground block">Superuser rang</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">Korlátlan letöltés és AI</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/discover"
              className="px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-extrabold text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 flex items-center gap-2.5 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Böngészés a katalógusban (11 472 könyv)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/ask-library"
              className="px-6 py-3.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent font-bold text-sm transition-all flex items-center gap-2 cursor-pointer border border-border"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Beszélgetés az AI Könyvtárossal</span>
            </Link>

            <Link
              href="/supporter"
              className="px-6 py-3.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-emerald-500" />
              <span>1$ Támogatói Tagság</span>
            </Link>
          </div>

          {/* 4 Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left max-w-6xl mx-auto pt-6">
            <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-sm border border-border space-y-2.5 hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">Szemantikus AI Könyvtáros</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kérdezz bármit a könyvek tartalmáról, filozófiájáról, vagy kérj személyre szabott ajánlást természetes nyelven.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-sm border border-border space-y-2.5 hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">22 Műfaj & Részletes Rendezés</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rendezz szerző szerint (A-Z) vagy cím szerint, keress műfajokra a Sci-Fi-től a klasszikus magyar irodalomig.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-sm border border-border space-y-2.5 hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">Azonnali Letöltés (EPUB, MOBI, PDF)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Közvetlen felhőtár elérés valós idejű streameléssel, e-könyv olvasókra és tabletekre optimalizálva.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-card/60 backdrop-blur-sm border border-border space-y-2.5 hover:border-primary/40 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">Többszintű Látogatói Rendszer</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                User, 1$ Superuser, Moderátor és Admin szintek egyénileg szabályozható jogosultságokkal.
              </p>
            </div>
          </div>

          {/* Scroll Down Cue */}
          <div className="pt-2 flex flex-col items-center gap-1 text-xs text-muted-foreground/70">
            <span>Görgess le a kiemelt napi ajánlathoz és a válogatott polcokhoz</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-primary" />
          </div>
        </div>
      </section>

      {/* Hero: TODAY'S PICK (A Nap Ajánlata - Section 9) */}
      {pick && (
        <section className="px-4 sm:px-6 pt-4 pb-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 via-card to-secondary/30 border border-border p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-lg">
            {/* Background glowing glow */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Book Cover */}
            <Link
              href={`/book/${pick.slug}`}
              className="relative aspect-[2/3] w-40 sm:w-48 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105"
            >
              {pick.coverUrl && !heroImgError ? (
                <img
                  src={pick.coverUrl}
                  alt={pick.title}
                  onError={() => setHeroImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex flex-col items-center justify-center text-center p-4">
                  <span className="font-bold text-sm text-foreground">{pick.title}</span>
                  <span className="text-xs text-muted-foreground mt-1">{pick.authors?.[0]?.name}</span>
                </div>
              )}
            </Link>

            {/* Book Meta & AI Reasoning */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{data.todaysPick?.badge || "A NAP KIEMELT AJÁNLATA"}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {pick.title}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground font-medium">
                {pick.authors?.map((a: any) => a.name).join(", ")}
                {pick.seriesName ? ` • ${pick.seriesName} #${pick.seriesPosition}` : ""}
              </p>

              {/* AI Recommendation Reason Banner */}
              <div className="p-3.5 rounded-xl bg-card/80 border border-border text-xs sm:text-sm text-foreground leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-primary block text-[11px] uppercase tracking-wider mb-0.5">
                    Miért pont ezt választotta az AI?
                  </span>
                  <span>{data.todaysPick?.reason}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <Link
                  href={`/book/${pick.slug}`}
                  className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Könyv megnyitása</span>
                </Link>
                <Link
                  href="/ask-library"
                  className="px-5 py-2.5 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Kérdezz erről a könyvről</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 1. Shelves: NEKED AJÁNLJUK (For You - AI 70/20/10) */}
      <HorizontalShelf
        title="Neked ajánljuk"
        subtitle="Személyre szabott hibrid AI ajánlások az olvasmányaid alapján"
        icon={<Sparkles className="w-5 h-5 text-emerald-500" />}
        books={data.shelves?.forYou || []}
      />

      {/* 2. Shelves: OLVASÁS FOLYTATÁSA (Continue Reading) */}
      {data.shelves?.continueReading && data.shelves.continueReading.length > 0 && (
        <HorizontalShelf
          title="Olvasás folytatása"
          subtitle="Ahol legutóbb abbahagytad"
          icon={<BookOpen className="w-5 h-5 text-blue-500" />}
          books={data.shelves.continueReading}
        />
      )}

      {/* 3. Shelves: ÚJDONSÁGOK A KÖNYVTÁRBAN (New in the Library) */}
      <HorizontalShelf
        title="Újdonságok a könyvtárban"
        subtitle="Nemrég hozzáadott, jogszerűen elérhető könyvek"
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        books={data.shelves?.newInLibrary || []}
      />

      {/* 4. Shelves: NÉPSZERŰ A KÖZÖSSÉGBEN (Trending in the Community) */}
      <HorizontalShelf
        title="Népszerű a közösségben"
        subtitle="A legtöbbet értékelt és legtöbbet vitatott kötetek"
        icon={<Flame className="w-5 h-5 text-orange-500" />}
        books={data.shelves?.trending || []}
      />

      {/* 5. Shelves: MIVEL TETSZETT A SCI-FI (Because You Liked...) */}
      <HorizontalShelf
        title="Mivel tetszett az Alapítvány és a Dűne..."
        subtitle="Hasonló tematikájú űropera és filozófiai tudományos fantasztikum"
        icon={<Compass className="w-5 h-5 text-purple-500" />}
        books={data.shelves?.becauseYouLiked || []}
      />

      {/* 6. Shelves: GYORS OLVASMÁNYOK (Quick Reads) */}
      <HorizontalShelf
        title="Gyors olvasmányok"
        subtitle="Rövidebb könyvek (kevesebb mint 250 oldal) egyetlen délutánra vagy estére"
        icon={<TrendingUp className="w-5 h-5 text-teal-500" />}
        books={data.shelves?.quickReads || []}
      />
    </div>
  );
}
