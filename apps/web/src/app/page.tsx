"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, BookOpen, Star, TrendingUp, Clock, Flame, Compass, ArrowRight } from "lucide-react";
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
    <div className="pb-16">
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
