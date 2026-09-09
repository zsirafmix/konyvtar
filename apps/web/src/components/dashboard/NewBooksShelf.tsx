"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, Calendar, BookMarked } from "lucide-react";

export interface NewBookItem {
  id: string;
  slug: string;
  title: string;
  author: string;
  genre?: string;
  coverUrl?: string;
  publishedYear?: number | string;
  releaseDate?: string;
  isNewlyUploaded?: boolean;
}

export const NewBooksShelf: React.FC = () => {
  const [books, setBooks] = useState<NewBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadNewestBooks() {
      try {
        const res = await fetch("/api/books?sort=newest&limit=16");
        if (res.ok) {
          const data = await res.json();
          const list = (data.books || []).map((b: any) => {
            const author =
              b.authors?.[0]?.name || b.author || "Ismeretlen szerző";
            const genre =
              b.categories?.[0]?.name || b.category || b.genre || "Általános";
            const releaseDate = b.libraryReleaseAt || b.createdAt || "2026-08-01";
            return {
              id: String(b.id),
              slug: b.slug || `book-${b.id}`,
              title: b.title || "Cím nélküli kötet",
              author,
              genre,
              coverUrl: b.coverUrl || b.cover || `/api/cover/${b.id}`,
              publishedYear: b.publishedYear,
              releaseDate,
              isNewlyUploaded: Boolean(b.isNewlyUploaded),
            };
          });
          setBooks(list);
        }
      } catch (err) {
        console.error("Nem sikerült betölteni az új könyveket:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNewestBooks();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Nemrég";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("hu-HU", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "Nemrég";
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span>Újonnan feltöltött könyvek</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-bold">
                Calibre Felhőtár
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A könyvtár legfrissebben katalogizált és feldolgozott kötetei
            </p>
          </div>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-colors cursor-pointer"
            title="Görgetés balra"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-colors cursor-pointer"
            title="Görgetés jobbra"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 hide-scrollbar scroll-smooth"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="w-48 sm:w-56 shrink-0 rounded-2xl bg-secondary/40 border border-border/60 p-3 space-y-3 animate-pulse"
              >
                <div className="aspect-[2/3] rounded-xl bg-secondary/80 w-full" />
                <div className="h-4 bg-secondary/80 rounded w-3/4" />
                <div className="h-3 bg-secondary/80 rounded w-1/2" />
              </div>
            ))
          : books.map((book) => (
              <div
                key={book.id}
                className="group relative w-48 sm:w-56 shrink-0 rounded-2xl bg-card border border-border/80 p-3 hover:border-primary/50 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
              >
                <Link href={`/book/${book.slug}`} className="block space-y-3">
                  {/* Book Cover */}
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-secondary shadow-sm">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary via-muted to-secondary/80 p-3 text-center">
                              <span class="text-2xl mb-1">📖</span>
                              <span class="text-[11px] font-bold text-foreground line-clamp-2">${book.title.replace(/"/g, '&quot;')}</span>
                              <span class="text-[10px] text-muted-foreground mt-1">${book.author.replace(/"/g, '&quot;')}</span>
                            </div>
                          `;
                        }
                      }}
                    />

                    {/* Genre tag overlay */}
                    {book.genre && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-background/90 backdrop-blur-md text-foreground border border-border/50 shadow-sm">
                        {book.genre}
                      </span>
                    )}

                    {/* Newly uploaded badge */}
                    {book.isNewlyUploaded && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500 text-white shadow-md animate-pulse">
                        ÚJ FELTÖLTÉS
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <h3
                      className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors"
                      title={book.title}
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1" title={book.author}>
                      {book.author}
                    </p>
                  </div>
                </Link>

                {/* Footer metadata & actions */}
                <div className="pt-2.5 mt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground/70" />
                    <span>{formatDate(book.releaseDate)}</span>
                  </div>

                  <Link
                    href={`/read/${book.slug}`}
                    className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                    title="Azonnali megnyitás az olvasóban"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Olvasás</span>
                  </Link>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
};
