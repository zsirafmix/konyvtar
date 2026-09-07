"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Sparkles, BookOpen, Users, ListTree, Compass } from "lucide-react";
import { BookCard } from "@/components/BookCard";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isSemantic, setIsSemantic] = useState<boolean>(false);
  const [results, setResults] = useState<{
    books?: any[];
    authors?: any[];
    series?: any[];
    lists?: any[];
    users?: any[];
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, activeTab, isSemantic);
    }
  }, [initialQuery]);

  const handleSearch = async (q: string, tab = activeTab, semantic = isSemantic) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}&type=${tab}&semantic=${semantic}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Keresési hiba:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query, activeTab, isSemantic);
  };

  const sampleQueries = [
    "80-as évekbeli sci-fi idegen civilizációkról",
    "könyvek mesterséges intelligenciáról kevés matematikával",
    "rövid filozófiai könyv estére",
    "könyvek fenntartható városokról",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Kereső</h1>

        {/* Input Bar with Semantic Toggle */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Keress címre, szerzőre, témára vagy kérdezz természetes nyelven..."
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-card border border-border text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              Keresés
            </button>
          </div>

          {/* Controls: Semantic AI Toggle & Example Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !isSemantic;
                  setIsSemantic(next);
                  if (query) handleSearch(query, activeTab, next);
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isSemantic
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Szemantikus AI Keresés</span>
              </button>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {isSemantic
                  ? "Természetes nyelvű, jelentésalapú vektoros keresés aktív"
                  : "Hagyományos kulcsszó és leírás keresés"}
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-[11px] mr-1">Próbáld ki:</span>
              {sampleQueries.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setQuery(sample);
                    setIsSemantic(true);
                    handleSearch(sample, activeTab, true);
                  }}
                  className="px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-secondary-foreground text-[11px] transition-colors"
                >
                  „{sample}”
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Search Result Tabs (Section 68) */}
        {!isSemantic && (
          <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto hide-scrollbar">
            {[
              { id: "all", label: "Mind" },
              { id: "books", label: "Könyvek" },
              { id: "authors", label: "Szerzők" },
              { id: "series", label: "Sorozatok" },
              { id: "lists", label: "Listák" },
              { id: "users", label: "Felhasználók" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (query) handleSearch(query, tab.id, isSemantic);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="aspect-[2/3] bg-secondary/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8 pt-2">
          {/* Books Result Grid */}
          {results.books && results.books.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>Talált könyvek ({results.books.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.books.map((book) => (
                  <BookCard key={book.id} {...book} />
                ))}
              </div>
            </section>
          )}

          {/* Authors Result List */}
          {results.authors && results.authors.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Szerzők ({results.authors.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {results.authors.map((author) => (
                  <div key={author.id} className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {author.name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">{author.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{author.bio || "Szerző"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {query && !loading && (!results.books || results.books.length === 0) && (!results.authors || results.authors.length === 0) && (
            <div className="p-12 text-center space-y-3 bg-secondary/20 rounded-3xl border border-border">
              <Compass className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-base text-foreground">Nincs találat a(z) „{query}” keresésre</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Próbáld ki a Szemantikus AI keresést, vagy keress egy általánosabb kifejezésre, például „Sci-Fi” vagy „Asimov”.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Kereső betöltése...</div>}>
      <SearchContent />
    </Suspense>
  );
}
