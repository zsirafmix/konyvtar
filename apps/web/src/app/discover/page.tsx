"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Compass, Sparkles, Filter, ArrowUpDown, Search, BookOpen, Loader2 } from "lucide-react";
import { BookCard } from "@/components/BookCard";

const CATEGORIES = [
  { slug: "all", name: "Összes műfaj" },
  { slug: "sci-fi", name: "Sci-Fi" },
  { slug: "fantasy", name: "Fantasy" },
  { slug: "krimi", name: "Krimi & Bűnügyi" },
  { slug: "kaland", name: "Kalandregény" },
  { slug: "magyar-irodalom", name: "Magyar Irodalom" },
  { slug: "horror", name: "Horror & Thriller" },
  { slug: "romantikus", name: "Romantikus" },
  { slug: "tortenelem", name: "Történelmi Regény" },
  { slug: "humor", name: "Humor & Szatíra" },
  { slug: "vilagirodalom", name: "Világirodalom" },
  { slug: "ifjusagi", name: "Ifjúsági & Családi" },
  { slug: "disztopia", name: "Disztópia" },
  { slug: "kiberpunk", name: "Kiberpunk" },
  { slug: "uropera", name: "Űropera" },
  { slug: "misztikum", name: "Misztikum & Ezotéria" },
  { slug: "filozofia", name: "Filozófia" },
  { slug: "novellak", name: "Novellák & Kisregények" },
  { slug: "eletrajz", name: "Életrajz & Memoár" },
  { slug: "pszichologia", name: "Pszichológia & Önismeret" },
  { slug: "versek", name: "Versek & Líra" },
  { slug: "tudomany", name: "Ismeretterjesztő & Tudomány" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Ajánlott / Népszerű" },
  { value: "author_asc", label: "Szerző szerint (A-Z)" },
  { value: "author_desc", label: "Szerző szerint (Z-A)" },
  { value: "title_asc", label: "Cím szerint (A-Z)" },
  { value: "title_desc", label: "Cím szerint (Z-A)" },
  { value: "rating_desc", label: "Legjobbra értékelt" },
  { value: "newest", label: "Legújabbak elöl" },
];

export default function DiscoverPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page when category or sortBy changes
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, sortBy]);

  // Load books
  const fetchBooks = useCallback(async (targetPage: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      if (sortBy && sortBy !== "popular") {
        params.set("sortBy", sortBy);
      }
      if (debouncedQuery) {
        params.set("q", debouncedQuery);
      }
      params.set("limit", "30");
      params.set("page", targetPage.toString());

      const res = await fetch(`/api/books?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newBooks = data.books || [];
        setBooks((prev) => (append ? [...prev, ...newBooks] : newBooks));
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Hiba a katalógus betöltésekor:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, sortBy, debouncedQuery]);

  useEffect(() => {
    fetchBooks(1, false);
  }, [fetchBooks]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBooks(nextPage, true);
    }
  };

  const activeCategoryObj = CATEGORIES.find((c) => c.slug === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary mb-2">
          <Compass className="w-3.5 h-3.5" />
          <span>FELFEDEZÉS ÉS KATALÓGUS</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Katalógus Böngésző</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Böngéssz 20+ gazdag műfaj szerint a több mint 11 000 kötetből álló digitális könyvtárban.
        </p>
      </div>

      {/* Category Pills Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-0.5">
          <span>VÁLASSZ MŰFAJT:</span>
          {totalCount > 0 && (
            <span className="text-primary font-bold">
              {totalCount.toLocaleString("hu-HU")} kötet {activeCategoryObj?.slug !== "all" ? `a(z) „${activeCategoryObj?.name}” kategóriában` : "a könyvtárban"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setSelectedCategory(cat.slug);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat.slug
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : "bg-secondary/70 text-secondary-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Szűrés cím vagy író szerint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground ml-1" />
          <label htmlFor="sort-select" className="text-xs font-medium text-muted-foreground hidden md:inline">
            Rendezés:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-background border border-input text-foreground text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
            <div key={n} className="aspect-[2/3] bg-secondary/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-dashed border-border space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50" />
          <h3 className="text-base font-bold text-foreground">Nem található kötet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            A kiválasztott szűrési feltételekkel nem találtunk könyvet. Próbálj másik műfajt vagy töröld a keresési kifejezést.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
              setSortBy("popular");
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Összes feltétel törlése
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {books.map((book) => (
              <BookCard key={book.id} {...book} />
            ))}
          </div>

          {/* Load more button */}
          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 rounded-full bg-secondary hover:bg-accent border border-border text-foreground text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Könyvek betöltése folyamatban...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>További 30 könyv betöltése ({books.length} / {totalCount.toLocaleString("hu-HU")})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
