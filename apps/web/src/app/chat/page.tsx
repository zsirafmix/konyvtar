"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  CornerDownLeft,
  Award,
  AlertCircle,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function AiLibrarianChatPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<{ usedToday: number; dailyLimit: number; remaining: number } | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<
    Array<{
      question: string;
      answer: string;
      matchedBooks: any[];
      confidence: number;
    }>
  >([
    {
      question: "Milyen sorrendben érdemes olvasni az Alapítvány könyveket?",
      answer:
        "### 📚 Alapítvány-Birodalom-Robot ciklus – Ajánlott olvasási sorrend\n\n**Szerző:** Isaac Asimov\n\nA sorozat köteteit a következő logikai és kanonikus sorrendben érdemes olvasni a legteljesebb élményért:\n\n* 1. **Alapítvány** (1951) – A Hari Seldon által indított pszichohistória alapköve\n* 2. **Alapítvány és Birodalom** (1952) – Az Öszvér megjelenése és a Seldon-terv kisiklása\n* 3. **Második Alapítvány** (1953) – A szellemi vezetők és pszichikusok harca\n* 4. **Az Alapítvány pereme** (1982) – Golan Trevize expedíciója a Gaia rejtélyéhez\n* 5. **Alapítvány és Föld** (1986) – Az emberiség eredetének felkutatása\n\n> **Könyvtáros tanácsa:** Kezdőknek kifejezetten az eredeti klasszikus trilógiát javasolt először elolvasni, mert ez nyújtja a legkatartikusabb irodalmi élményt!\n\nMindegyik kötet megtalálható és azonnal olvasható a digitális könyvtáradban!",
      matchedBooks: [],
      confidence: 0.98,
    },
  ]);

  const sampleQuestions = [
    "Milyen sorrendben érdemes olvasni az Alapítvány könyveket?",
    "Milyen sorrendben olvassam a Dűne regényeket?",
    "Ajánlj Rejtő Jenő könyveket a könyvtárból!",
    "Miről szól Stanisław Lem Solaris című műve?",
    "Milyen sorrendben olvassam a Vaják (Witcher) sagát?",
    "Kicsoda Arthur C. Clarke és mik a legfontosabb regényei?",
  ];

  const handleSubmit = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setQuestion("");
    setError("");

    try {
      const res = await fetch("/api/ask-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hiba történt a válaszadás során.");
        return;
      }

      if (data.usage) {
        setUsage(data.usage);
      }

      setHistory((prev) => [
        ...prev,
        {
          question: q.trim(),
          answer: data.answer,
          matchedBooks: data.matchedBooks || [],
          confidence: data.confidence || 0.95,
        },
      ]);
    } catch (err: any) {
      setError("Hálózati hiba történt. Kérjük, próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI KÖNYVTÁROS & SZEMANTIKUS RAG ASSZISZTENS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
          Kérdezz bármit a 11 472 kötetes gyűjteményről
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Kérj személyre szabott könyvajánlókat, cselekmény-összefoglalókat és pontos kötethivatkozásokat közvetlenül a felhőkatalógusodból.
        </p>

        {/* Quota Indicator */}
        {usage && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-secondary/80 border border-border text-xs text-muted-foreground">
            <span>Napi AI kvóta:</span>
            <strong className="text-foreground">{usage.usedToday} / {usage.dailyLimit} kérdés</strong>
            {usage.dailyLimit <= 20 && (
              <Link href="/supporter" className="text-emerald-400 hover:underline font-bold ml-1">
                (Emeld 1000-re $1-ért)
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {sampleQuestions.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSubmit(prompt)}
            className="px-3.5 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary text-secondary-foreground text-xs font-medium border border-border/70 transition-colors text-left cursor-pointer"
          >
            „{prompt}”
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes("kérdéskeretedet") && (
            <Link
              href="/supporter"
              className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold text-[11px] shrink-0 hover:opacity-90"
            >
              $1 Prémium feloldása
            </Link>
          )}
        </div>
      )}

      {/* Conversation Thread */}
      <div className="space-y-6">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-3">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-primary text-primary-foreground p-4 text-sm font-medium shadow-sm leading-relaxed">
                {item.question}
              </div>
            </div>

            {/* AI Answer Card */}
            <div className="flex justify-start">
              <div className="max-w-[95%] rounded-3xl rounded-tl-none bg-card border border-border/80 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">AI Könyvtáros</span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    Megbízhatóság: {Math.round(item.confidence * 100)}%
                  </span>
                </div>

                <div className="text-sm text-foreground/90 leading-relaxed">
                  <MarkdownRenderer content={item.answer} />
                </div>

                {/* Grounded books citations */}
                {item.matchedBooks && item.matchedBooks.length > 0 && (
                  <div className="pt-3 border-t border-border/50 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Hivatkozott kötetek a gyűjteményedből:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {item.matchedBooks.map((b: any, bIdx: number) => (
                        <Link
                          key={bIdx}
                          href={`/book/${b.slug || b.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          <span>{b.title}</span>
                          <span className="text-muted-foreground font-normal">({b.authors?.[0]?.name || b.author})</span>
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
            <div className="rounded-2xl rounded-tl-none bg-card border border-border p-4 flex items-center gap-3 text-xs text-muted-foreground animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>A Könyvtáros kutatja a 11 472 kötetet és megfogalmazza a választ...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(question);
        }}
        className="relative"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(question);
            }
          }}
          placeholder="Kérdezz bármit a könyvtáradról (pl. Ki írta a Cyberiadot?)..."
          rows={3}
          disabled={loading}
          className="w-full p-4 pr-14 rounded-2xl bg-card border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm resize-none"
        />

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="absolute right-3.5 bottom-4 p-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-95 disabled:opacity-40 transition-all shadow cursor-pointer"
          title="Kérdés elküldése (Enter)"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
