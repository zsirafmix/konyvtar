"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Library, BookOpen, Bookmark, CheckCircle2, Heart, Lock, Cloud, Sparkles } from "lucide-react";
import { BookCard } from "@/components/BookCard";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await fetch("/api/books?limit=50");
        if (res.ok) {
          const data = await res.json();
          setBooks(data.books || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

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
        setImportMessage(data.message || "Importálási folyamat elindítva!");
      }
    } catch {
      setImportMessage("Importálási folyamat aktív a háttérben.");
    } finally {
      setTimeout(() => {
        setImporting(false);
        setTimeout(() => setImportMessage(null), 4000);
      }, 1500);
    }
  };

  const filteredBooks = books.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PRIVATE") return b.distributionStatus === "PRIVATE";
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-20">
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
          className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
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

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="aspect-[2/3] bg-secondary/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      )}
    </div>
  );
}
