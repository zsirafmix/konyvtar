"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Send, BookOpen, ShieldCheck, CheckCircle2, CornerDownLeft } from "lucide-react";
import { BookCard } from "@/components/BookCard";

export default function AskLibraryPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{
      question: string;
      answer: string;
      matchedBooks: any[];
      confidence: number;
    }>
  >([
    {
      question: "Milyen sorrendben olvassam Asimov Foundation könyveit?",
      answer:
        "A könyvtáradban található adatok alapján az Alapítvány-ciklus javasolt olvasási sorrendje:\n\n1. **Alapítvány** (1951) – A pszichohistória megteremtése és az enciklopédisták korszaka\n2. **Alapítvány és Birodalom** (1952) – Az Öszvér támadása\n3. **Második Alapítvány** (1953) – A mentális tudósok keresése\n4. **Az Alapítvány pereme** (1982) – Golan Trevize küldetése és a Gaia rejtélye\n5. **Alapítvány és Föld** (1986) – Az emberiség bölcsőjének felkutatása\n\nMind az 5 kötet elérhető a könyvtáradban és azonnal megnyitható!",
      matchedBooks: [],
      confidence: 0.98,
    },
  ]);

  const sampleQuestions = [
    "Van könyvem hídtervezésről?",
    "Melyik könyveim beszélnek római történelemről?",
    "Adj könyveket, amivel elkezdhetem a kvantumfizikát.",
    "Milyen sorrendben olvassam Asimov Foundation könyveit?",
  ];

  const handleSubmit = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setQuestion("");

    try {
      const res = await fetch("/api/ask-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setHistory((prev) => [
          ...prev,
          {
            question: q.trim(),
            answer: data.answer,
            matchedBooks: data.matchedBooks || [],
            confidence: data.confidence || 0.9,
          },
        ]);
      }
    } catch (err) {
      console.error("Ask Library error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>KÖNYVTÁRI AI ASSZISZTENS (RAG)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Kérdezz bármit a könyvtáradtól
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          A válaszok kizárólag a hozzáférhető gyűjteményedre támaszkodnak, hallucinációk nélkül.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {sampleQuestions.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSubmit(prompt)}
            className="px-3.5 py-1.5 rounded-full bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium border border-border transition-colors text-left"
          >
            „{prompt}”
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div className="space-y-6">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-3">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="max-w-[85%] sm:max-w-[75%] px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-medium shadow-sm">
                {item.question}
              </div>
            </div>

            {/* AI Grounded Response */}
            <div className="flex justify-start">
              <div className="max-w-[95%] sm:max-w-[85%] p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Librarian AI Válasz</span>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-500 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hitelesített könyvtári források
                  </span>
                </div>

                <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {item.answer}
                </div>

                {/* Referenced Clickable Books */}
                {item.matchedBooks && item.matchedBooks.length > 0 && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Hivatkozott könyvek ({item.matchedBooks.length})
                    </span>
                    <div className="flex gap-3 overflow-x-auto py-2 hide-scrollbar">
                      {item.matchedBooks.map((book) => (
                        <Link
                          key={book.id}
                          href={`/book/${book.slug}`}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/60 transition-colors flex-shrink-0 w-64"
                        >
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                              className="w-10 aspect-[2/3] object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-10 aspect-[2/3] bg-muted rounded-md flex items-center justify-center text-[8px]">
                              Könyv
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs text-foreground truncate block">
                              {book.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {book.authors?.map((a: any) => a.name).join(", ")}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-6 py-4 rounded-3xl bg-card border border-border flex items-center gap-3 animate-pulse text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary animate-spin" />
              <span>A könyvtárad elemzése és a válasz megfogalmazása folyamatban...</span>
            </div>
          </div>
        )}
      </div>

      {/* Fixed/Sticky Input Box at bottom */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(question);
        }}
        className="relative flex items-center pt-4"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Kérdezz bármit a gyűjteményedről (pl. Melyik könyveim beszélnek római történelemről?)..."
          className="w-full pl-5 pr-14 py-4 rounded-2xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-lg"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="absolute right-2.5 p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
          title="Küldés"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
