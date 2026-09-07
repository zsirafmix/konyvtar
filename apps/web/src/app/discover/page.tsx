"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Sparkles, Filter } from "lucide-react";
import { BookCard } from "@/components/BookCard";

export default function DiscoverPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const categories = [
    { slug: "all", name: "Összes műfaj" },
    { slug: "sci-fi", name: "Sci-Fi" },
    { slug: "uropera", name: "Űropera" },
    { slug: "kiberpunk", name: "Kiberpunk" },
    { slug: "filozofia", name: "Filozófia" },
    { slug: "disztopia", name: "Disztópia" },
    { slug: "hard-sci-fi", name: "Hard Sci-Fi" },
    { slug: "mernoki-tudomanyok", name: "Mérnöki tudományok" },
    { slug: "tortenelem", name: "Történelem" },
  ];

  useEffect(() => {
    async function loadBooks() {
      setLoading(true);
      try {
        const url = selectedCategory === "all" ? "/api/books?limit=30" : `/api/books?category=${selectedCategory}&limit=30`;
        const res = await fetch(url);
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
    loadBooks();
  }, [selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-20">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary mb-2">
          <Compass className="w-3.5 h-3.5" />
          <span>FELFEDEZÉS</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Katalógus Böngésző</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Böngéssz műfajok, kategóriák és témakörök szerint a teljes gyűjteményben.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat.slug
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="aspect-[2/3] bg-secondary/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      )}
    </div>
  );
}
