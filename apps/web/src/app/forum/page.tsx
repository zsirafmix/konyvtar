"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessagesSquare,
  PlusCircle,
  Pin,
  Lock,
  MessageCircle,
  Eye,
  Calendar,
  User,
  Shield,
  Crown,
  Sparkles,
  Search,
  X,
  Send,
} from "lucide-react";

export default function ForumPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadTopics = async () => {
    try {
      const res = await fetch("/api/forum");
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
      }
    } catch (err) {
      console.error("Fórum betöltési hiba:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setError("A cím és a tartalom megadása is kötelező!");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hiba történt a téma létrehozásakor.");
        return;
      }

      setNewTitle("");
      setNewContent("");
      setShowNewModal(false);
      loadTopics();
    } catch (err: any) {
      setError("Hálózati hiba. Kérjük, próbáld újra.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Nemrég";
    }
  };

  const filteredTopics = topics.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.author?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <MessagesSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Közösségi Fórum
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Beszélgess kedvenc könyveidről, ossz meg olvasási tippeket és vitasd meg a legújabb műveket
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-95 transition-all shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Új téma indítása</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés a témák között..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/60 border border-border/70 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="text-xs text-muted-foreground font-medium self-end sm:self-auto">
          Összesen: <span className="text-foreground font-bold">{topics.length} téma</span>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border/60 animate-pulse space-y-3">
              <div className="h-5 bg-secondary/80 rounded w-1/3" />
              <div className="h-3 bg-secondary/80 rounded w-2/3" />
            </div>
          ))
        ) : filteredTopics.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-card border border-dashed border-border/80 space-y-3">
            <MessagesSquare className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-foreground">Még nincs megjeleníthető téma</h3>
            <p className="text-xs text-muted-foreground">
              Legyél te az első, aki új témát nyit a Librarian AI közösségében!
            </p>
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <Link
              key={topic.id}
              href={`/forum/${topic.slug}`}
              className="group block p-5 rounded-2xl bg-card border border-border/70 hover:border-purple-500/50 hover:shadow-md transition-all duration-200 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {topic.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Pin className="w-3 h-3" />
                        <span>Kiemelt</span>
                      </span>
                    )}
                    {topic.isLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <Lock className="w-3 h-3" />
                        <span>Lezárt</span>
                      </span>
                    )}
                    <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {topic.title}
                    </h2>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {topic.content}
                  </p>
                </div>

                {/* Post Count Pill */}
                <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/70 text-xs font-bold text-foreground">
                  <MessageCircle className="w-3.5 h-3.5 text-primary" />
                  <span>{topic.postsCount}</span>
                </div>
              </div>

              {/* Meta footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                    {topic.author.name[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="font-semibold text-foreground/90">{topic.author.name}</span>
                  <span>•</span>
                  <span>{formatDate(topic.createdAt)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-muted-foreground/70" />
                    <span>{topic.viewsCount} megtekintés</span>
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* New Topic Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MessagesSquare className="w-5 h-5 text-purple-400" />
                <span>Új fórum téma indítása</span>
              </h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Téma címe
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="pl. Kedvenc sci-fi regények és világépítés..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/60 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Kifejtés / Bejegyzés szövege
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Írd le a gondolataidat vagy kérdésedet részletesen..."
                  rows={5}
                  required
                  className="w-full p-4 rounded-xl bg-secondary/60 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Mentés..." : "Téma közzététele"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
