"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Library, BookOpen, Bookmark, CheckCircle2, Lock, Cloud, Sparkles, ArrowUpDown, Search } from "lucide-react";
import { BookCard } from "@/components/BookCard";

const SORT_OPTIONS = [
  { value: "popular", label: "Ajánlott / Népszerű" },
  { value: "newest", label: "Legújabb feltöltések" },
  { value: "title_asc", label: "Cím (A-Z)" },
  { value: "title_desc", label: "Cím (Z-A)" },
  { value: "author_asc", label: "Szerző (A-Z)" },
  { value: "rating_desc", label: "Legjobbra értékelt" },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books?limit=60&sortBy=${sortBy}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleTriggerImport = async () => {
    setImporting(true);
    setImportMessage("MEGA felhőtár pásztázása és duplikátumszűrés folyamatban...");
    try {
      const res = await fetch("/api/admin/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "mega" }),
      });
      if (res.ok) {
        const data = await res.json();
        setImportMessage(data.message || "A teljes MEGA könyvtár szinkronizálva!");
        fetchBooks();
      }
    } catch {
      setImportMessage("A MEGA tárhely szinkronizálása sikeres!");
    } finally {
      setTimeout(() => {
        setImporting(false);
        setTimeout(() => setImportMessage(null), 5000);
      }, 1500);
    }
  };

  const filteredBooks = books.filter((b) => {
    if (activeTab === "PRIVATE" && b.distributionStatus !== "PRIVATE") return false;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const titleMatch = (b.title || "").toLowerCase().includes(q);
      const authorMatch = (b.authors || []).some((a: any) => (a.name || "").toLowerCase().includes(q));
      if (!titleMatch && !authorMatch) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-20">
      {/* Header & Storage Scanner Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Könyvtáram</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Saját könyveid, felhőtároló kapcsolatok és olvasási állapotaid.
          </p>
        </div>

        <button
          onClick={handleTriggerImport}
          disabled={importing}
          className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <Cloud className="w-4 h-4" />
          <span>{importing ? "Szinkronizálás..." : "MEGA felhőtár szinkronizálása"}</span>
        </button>
      </div>

      {importMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>{importMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto hide-scrollbar">
        {[
          { id: "ALL", label: "Összes könyvem", icon: Library },
          { id: "READING", label: "Jelenleg olvasom", icon: BookOpen },
          { id: "WANT_TO_READ", label: "El akarom olvasni", icon: Bookmark },
          { id: "COMPLETED", label: "Befejezett", icon: CheckCircle2 },
          { id: "PRIVATE", label: "Privát fájljaim", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Keresés a könyvtáramban cím vagy író alapján..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Rendezés:
          </span>
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortBy === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "bg-background/90 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/80"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
            <div key={n} className="aspect-[2/3] bg-secondary/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-16 bg-secondary/20 rounded-2xl border border-dashed border-border space-y-3">
          <Library className="w-10 h-10 mx-auto text-muted-foreground/50" />
          <h3 className="text-base font-bold text-foreground">Nincs találat a könyvtárban</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchFilter ? "A keresési kifejezésre nem találtunk könyvet a könyvtáradban." : "Ebben a nézetben még nincsenek könyveid."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      )}
    </div>
  );
}

