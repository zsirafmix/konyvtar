"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessagesSquare,
  Send,
  Trash2,
  Edit2,
  Lock,
  Pin,
  Calendar,
  AlertCircle,
  Shield,
  Crown,
} from "lucide-react";

export default function ForumTopicPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [topic, setTopic] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const loadTopic = async () => {
    try {
      const [topicRes, userRes] = await Promise.all([
        fetch(`/api/forum/${slug}`),
        fetch(`/api/auth/me`),
      ]);

      if (topicRes.ok) {
        const tData = await topicRes.json();
        setTopic(tData.topic);
      } else {
        setError("A téma nem található.");
      }

      if (userRes.ok) {
        const uData = await userRes.json();
        setCurrentUser(uData.user);
      }
    } catch (err) {
      console.error("Hiba a téma betöltésekor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadTopic();
    }
  }, [slug]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/forum/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nem sikerült elküldeni a hozzászólást.");
        return;
      }

      setReplyText("");
      setError("");
      loadTopic();
    } catch (err: any) {
      setError("Hálózati hiba történt a hozzászólás elküldésekor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a hozzászólást?")) return;

    try {
      const res = await fetch(`/api/forum/${slug}?postId=${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadTopic();
      }
    } catch (err) {
      console.error("Törlési hiba:", err);
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm("Biztosan törölni szeretnéd a teljes témát az összes hozzászólással együtt?")) return;

    try {
      const res = await fetch(`/api/forum/${slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/forum");
      }
    } catch (err) {
      console.error("Téma törlési hiba:", err);
    }
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editText.trim()) return;

    try {
      const res = await fetch(`/api/forum/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: editText }),
      });

      if (res.ok) {
        setEditingPostId(null);
        setEditText("");
        loadTopic();
      }
    } catch (err) {
      console.error("Szerkesztési hiba:", err);
    }
  };

  const handleToggleLock = async () => {
    try {
      const res = await fetch(`/api/forum/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !topic.isLocked }),
      });
      if (res.ok) {
        loadTopic();
      }
    } catch (err) {
      console.error("Zárolási hiba:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("hu-HU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-secondary/80 rounded" />
        <div className="h-10 bg-secondary/80 rounded w-2/3" />
        <div className="h-40 bg-secondary/80 rounded-2xl" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">A téma nem található</h2>
        <Link href="/forum" className="text-primary font-bold hover:underline block text-sm">
          &larr; Vissza a Fórumhoz
        </Link>
      </div>
    );
  }

  const isStaff = currentUser?.role === "admin" || currentUser?.role === "moderator";
  const isTopicOwner = currentUser?.id === topic.author.id;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Vissza a témákhoz</span>
        </Link>

        {/* Staff moderation tools */}
        {isStaff && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLock}
              className="px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/70 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{topic.isLocked ? "Feloldás" : "Zárolás"}</span>
            </button>

            <button
              onClick={handleDeleteTopic}
              className="px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Téma törlése</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Topic Header & Content */}
      <article className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {topic.isPinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Pin className="w-3 h-3" />
                <span>Kiemelt</span>
              </span>
            )}
            {topic.isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <Lock className="w-3 h-3" />
                <span>Lezárt téma</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
            {topic.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              {topic.author.name[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <span className="font-bold text-foreground">{topic.author.name}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(topic.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="text-sm sm:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed border-t border-border/50 pt-5">
          {topic.content}
        </div>
      </article>

      {/* Replies Thread */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          Hozzászólások ({topic.posts.length})
        </h2>

        {topic.posts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-card/60 border border-border/60 text-xs text-muted-foreground">
            Még nem érkezett hozzászólás. Legyél te az első!
          </div>
        ) : (
          <div className="space-y-3">
            {topic.posts.map((post: any, idx: number) => {
              const isPostAuthor = currentUser?.id === post.author.id;
              const canDelete = isPostAuthor || isStaff;
              const canEdit = isPostAuthor;

              return (
                <div
                  key={post.id}
                  className="p-5 rounded-2xl bg-card border border-border/60 space-y-3 transition-colors hover:border-border"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-[10px]">
                        {post.author.name[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="font-bold text-foreground">{post.author.name}</span>
                      <span className="text-muted-foreground">• {formatDate(post.createdAt)}</span>
                      {post.isEdited && (
                        <span className="text-[10px] text-muted-foreground/70 italic">
                          (szerkesztve)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && editingPostId !== post.id && (
                        <button
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditText(post.content);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Szerkesztés"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                          title="Törlés"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {editingPostId === post.id ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-3 rounded-xl bg-secondary/60 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold hover:bg-secondary text-muted-foreground"
                        >
                          Mégse
                        </button>
                        <button
                          onClick={() => handleSaveEdit(post.id)}
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                        >
                          Mentés
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reply Input Form */}
      {topic.isLocked ? (
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-rose-400" />
          <span>Ez a téma le van zárva, nem lehet új hozzászólást fűzni hozzá.</span>
        </div>
      ) : !currentUser ? (
        <div className="p-6 rounded-2xl bg-secondary/50 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Szeretnél hozzászólni ehhez a témához?</h4>
            <p className="text-xs text-muted-foreground">
              A fórumon való részvételhez és a beszélgetéshez kérjük, jelentkezz be a fiókodba!
            </p>
          </div>
          <Link
            href={`/login?from=${encodeURIComponent(`/forum/${slug}`)}&switch=true`}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shrink-0 shadow-md hover:opacity-90 transition-opacity"
          >
            Bejelentkezés &rarr;
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-border/70">
          <h3 className="text-sm font-bold text-foreground">Hozzászólás hozzáadása</h3>
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between gap-2">
              <span>{error}</span>
              {error.includes("bejelentkez") && (
                <Link
                  href={`/login?from=${encodeURIComponent(`/forum/${slug}`)}&switch=true`}
                  className="font-bold underline text-[11px] shrink-0"
                >
                  Belépés
                </Link>
              )}
            </div>
          )}
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Oszd meg a véleményedet..."
            rows={4}
            required
            className="w-full p-4 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Küldés..." : "Hozzászólás küldése"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
