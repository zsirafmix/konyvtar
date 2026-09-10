"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  Filter,
  ArrowUpDown,
  Search,
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
  Layers,
  Check,
  X,
} from "lucide-react";
import { BookCard } from "@/components/BookCard";
import { ALL_103_GENRES, GENRE_GROUPS_DATA, getGenreBySlug } from "@/lib/genres-data";

const SORT_OPTIONS = [
  { value: "popular", label: "Ajánlott / Népszerű" },
  { value: "newest", label: "Legújabb feltöltések" },
  { value: "title_asc", label: "Cím szerint (A-Z)" },
  { value: "title_desc", label: "Cím szerint (Z-A)" },
  { value: "author_asc", label: "Szerző szerint (A-Z)" },
  { value: "rating_desc", label: "Legjobbra értékelt" },
];

export default function DiscoverPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [genreFilterSearch, setGenreFilterSearch] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [isGenresExpanded, setIsGenresExpanded] = useState<boolean>(true);
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
  const fetchBooks = useCallback(
    async (targetPage: number, append: boolean = false) => {
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
    },
    [selectedCategory, sortBy, debouncedQuery]
  );

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

  const activeGenreObj = getGenreBySlug(selectedCategory);

  // Filter genres based on search and selected group
  const filteredGenres = useMemo(() => {
    const q = genreFilterSearch.toLowerCase().trim();
    return ALL_103_GENRES.filter((g) => {
      if (selectedGroup !== "all" && g.group !== selectedGroup) return false;
      if (q && !g.name.toLowerCase().includes(q) && !g.slug.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [genreFilterSearch, selectedGroup]);

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
          Böngéssz 100+ gazdag műfaj szerint a több mint 11 000 kötetből álló digitális könyvtárban.
        </p>
      </div>

      {/* Genres Section - Structured vertically so genres fit under each other cleanly */}
      <div className="rounded-2xl bg-card border border-border/80 p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              MŰFAJOK ({ALL_103_GENRES.length} KATEGÓRIA EGYESÉVEL)
            </h2>
            {selectedCategory !== "all" && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground">
                Kiválasztva: {activeGenreObj?.name || selectedCategory}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                title="Szűrés törlése"
              >
                <X className="w-3.5 h-3.5" />
                <span>Minden műfaj mutatása</span>
              </button>
            )}
            <button
              onClick={() => setIsGenresExpanded(!isGenresExpanded)}
              className="px-3 py-1 rounded-lg bg-secondary/80 text-foreground text-xs font-semibold hover:bg-secondary transition-colors flex items-center gap-1 cursor-pointer ml-auto sm:ml-0"
            >
              <span>{isGenresExpanded ? "Összecsukás" : "Műfajok kibontása"}</span>
              {isGenresExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isGenresExpanded && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Quick search inside 103 genres and thematic group filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Keresés a 103 műfaj között (pl. sci-fi, pszichothriller, népmese)..."
                  value={genreFilterSearch}
                  onChange={(e) => setGenreFilterSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-background border border-input rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Group Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 hide-scrollbar text-xs">
                <button
                  onClick={() => setSelectedGroup("all")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    selectedGroup === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mind ({ALL_103_GENRES.length})
                </button>
                {GENRE_GROUPS_DATA.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.title)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      selectedGroup === group.title
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {group.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Multi-column Grid: Genres fit neatly UNDER each other */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-96 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex items-center justify-between ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/80 hover:bg-secondary text-foreground border-border/80 hover:border-primary/40"
                }`}
              >
                <span>⭐ Összes műfaj</span>
                {selectedCategory === "all" && <Check className="w-3.5 h-3.5" />}
              </button>

              {filteredGenres.map((genre) => {
                const isSelected = selectedCategory === genre.slug;
                return (
                  <button
                    key={genre.slug}
                    onClick={() => setSelectedCategory(genre.slug)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex items-center justify-between truncate ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background/80 hover:bg-secondary text-foreground border-border/80 hover:border-primary/40"
                    }`}
                    title={`${genre.name} (${genre.group})`}
                  >
                    <span className="truncate capitalize">{genre.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-secondary/30 p-3.5 rounded-2xl border border-border">
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

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Rendezés:
          </span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                sortBy === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Results Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
        <span>
          {selectedCategory !== "all" ? (
            <span className="text-foreground">
              Műfaj: <strong className="text-primary capitalize">{activeGenreObj?.name || selectedCategory}</strong>
            </span>
          ) : (
            <span>Minden műfaj</span>
          )}
        </span>
        {totalCount > 0 && (
          <span className="text-primary font-bold">
            {totalCount.toLocaleString("hu-HU")} kötet található
          </span>
        )}
      </div>

      {/* Books Grid */}
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
                    <span>
                      További 30 könyv betöltése ({books.length} / {totalCount.toLocaleString("hu-HU")})
                    </span>
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
