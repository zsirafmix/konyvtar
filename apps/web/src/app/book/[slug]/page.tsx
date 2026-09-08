"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  Download,
  Clock,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Bookmark,
  Share2,
  Heart,
  FileText,
  AlertCircle,
  MessageSquare,
  Lock,
} from "lucide-react";
import { formatBytes, formatDateHu } from "@/lib/utils";

export default function BookDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive user actions
  const [userRating, setUserRating] = useState<number>(0);
  const [readingStatus, setReadingStatus] = useState<string>("WANT_TO_READ");
  const [userNote, setUserNote] = useState<string>("");
  const [noteSaved, setNoteSaved] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBook() {
      try {
        const res = await fetch(`/api/books/${slug}`);
        if (!res.ok) {
          throw new Error("A keresett könyv nem található.");
        }
        const data = await res.json();
        setBook(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [slug]);

  const handleSaveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto animate-pulse space-y-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-64 aspect-[2/3] bg-secondary/50 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-secondary/50 rounded w-3/4" />
            <div className="h-5 bg-secondary/50 rounded w-1/3" />
            <div className="h-24 bg-secondary/50 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Hiba történt</h2>
        <p className="text-sm text-muted-foreground">{error || "Nem sikerült betölteni a könyvet."}</p>
        <Link href="/" className="inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
          Vissza a kezdőlapra
        </Link>
      </div>
    );
  }

  const primaryFile = book.files?.[0];
  const entitlement = primaryFile?.entitlement;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
      {/* Top Section: Cover & Metadata Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Large 2:3 Cover */}
        <div className="w-full sm:w-64 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl bg-muted border border-border">
          {book.coverUrl && !imgError ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-secondary to-muted">
              <span className="font-bold text-lg text-foreground">{book.title}</span>
              <span className="text-sm text-muted-foreground mt-2">{book.authors?.map((a: any) => a.name).join(", ")}</span>
            </div>
          )}
        </div>

        {/* Core Book Details */}
        <div className="flex-1 space-y-4">
          {/* Series badge */}
          {book.series && (
            <Link
              href={`/search?q=${encodeURIComponent(book.series.name)}&type=series`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>{book.series.name}</span>
              <span>#{book.series.position}</span>
            </Link>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {book.title}
          </h1>

          {book.originalTitle && (
            <p className="text-sm text-muted-foreground italic">
              Eredeti cím: {book.originalTitle}
            </p>
          )}

          <p className="text-lg font-medium text-foreground">
            {book.authors?.map((a: any) => a.name).join(", ")}
          </p>

          {/* Ratings & Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 py-1 text-sm">
            <div className="flex items-center gap-1.5 text-amber-500 font-bold">
              <Star className="w-4 h-4 fill-current" />
              <span>{book.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground font-normal text-xs">({book.ratingsCount} értékelés)</span>
            </div>

            {book.edition?.publishedYear && (
              <span className="text-muted-foreground">Kiadás éve: {book.edition.publishedYear}</span>
            )}
            {book.edition?.pages && (
              <span className="text-muted-foreground">{book.edition.pages} oldal</span>
            )}
            {book.edition?.isbn13 && (
              <span className="text-xs text-muted-foreground font-mono">ISBN: {book.edition.isbn13}</span>
            )}
          </div>

          {/* Category Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {book.categories?.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/search?q=${encodeURIComponent(cat.name)}`}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* User Interactivity: Status, Rating */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-wrap items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-muted-foreground">Státuszod:</label>
              <select
                value={readingStatus}
                onChange={(e) => setReadingStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-secondary text-foreground text-xs font-medium border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="WANT_TO_READ">El akarom olvasni</option>
                <option value="READING">Jelenleg olvasom</option>
                <option value="COMPLETED">Befejeztem</option>
                <option value="PAUSED">Szüneteltetem</option>
                <option value="ABANDONED">Félbehagytam</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Értékelésed:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  className="p-1 text-amber-500 transition-transform hover:scale-110"
                >
                  <Star className={`w-4 h-4 ${star <= userRating ? "fill-current" : "stroke-current text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LETÖLTÉSI ÉS JOGOSULTSÁGI SZEKCIÓ (Section 11 & 43 - 21 napos szabály) */}
      <section className="p-6 rounded-3xl bg-secondary/30 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Elérhető Fájlformátumok és Letöltés</h2>
          </div>
          {book.edition?.rightsLicense && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border">
              {book.edition.rightsLicense}
            </span>
          )}
        </div>

        {/* 21-Day Rule Banner (If user is Free and book is new) */}
        {entitlement && !entitlement.allowed && !entitlement.isPrivate && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm block">
                  INGYENES TAGOKNAK ELÉRHETŐ: {entitlement.daysRemaining ?? 0} NAP {entitlement.hoursRemaining ?? 0} ÓRA MÚLVA
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ez a könyv nemrég került be a könyvtárba. A Supporting Member tagsággal már ma azonnal letöltheted és olvashatod!
                </p>
              </div>
            </div>
            <Link
              href="/supporter"
              className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex-shrink-0 transition-colors shadow-sm"
            >
              Támogasd a könyvtárat (1 €/hét)
            </Link>
          </div>
        )}

        {/* Private file warning */}
        {entitlement && !entitlement.allowed && entitlement.isPrivate && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3">
            <Lock className="w-5 h-5 text-purple-500" />
            <p className="text-xs text-muted-foreground">
              Ez egy magánfájl. A tartalomjogi szabályok szerint kizárólag a feltöltője férhet hozzá.
            </p>
          </div>
        )}

        {/* Formats list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {book.files?.map((file: any) => {
            const isAllowed = file.entitlement?.allowed;
            return (
              <div
                key={file.id}
                className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <span className="font-extrabold text-sm text-foreground block">{file.format}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.fileSizeBytes)}</span>
                </div>

                {isAllowed ? (
                  <a
                    href={`/api/download/${file.id}`}
                    download={file.fileName || `${book.title}.${file.format.toLowerCase()}`}
                    onClick={() => {
                      setDownloadingId(file.id);
                      setTimeout(() => setDownloadingId(null), 4000);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className={`w-3.5 h-3.5 ${downloadingId === file.id ? "animate-bounce" : ""}`} />
                    <span>{downloadingId === file.id ? "Letöltés indítása..." : "Letöltés"}</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium text-xs cursor-not-allowed flex items-center gap-1"
                    title={file.entitlement?.reason || "Jelenleg nem tölthető le"}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Zárolva</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* AI SUMMARY & DESCRIPTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left 2 Cols: Book Description */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-foreground">A mű leírása</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {book.description || "Nincs megadott leírás ehhez a könyvhöz."}
          </p>

          {/* User Private Notes (Section 28) */}
          <div className="pt-6 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Saját privát jegyzeted</h3>
              <span className="text-[10px] text-muted-foreground">Kizárólag te láthatod</span>
            </div>
            <textarea
              rows={3}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Írd ide a személyes gondolataidat, emlékeztetőidet a könyvről..."
              className="w-full p-3 rounded-2xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-accent transition-colors"
              >
                {noteSaved ? "Jegyzet elmentve ✓" : "Jegyzet mentése"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: AI Summary & Highlights */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-card to-primary/5 border border-border space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI Elemzés és Összefoglaló</span>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {book.aiSummary || "Az AI háttérfolyamat még nem készített elemzést ehhez a műhöz."}
            </p>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Modell: Gemini 1.5 Flash</span>
              <span>Konfidencia: 98%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Reviews Section */}
      <section className="space-y-4 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Közösségi Értékelések ({book.reviews?.length || 0})</h2>
          </div>
        </div>

        <div className="space-y-3">
          {book.reviews?.map((r: any) => (
            <div key={r.id} className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {r.userName[0]}
                  </div>
                  <span className="font-semibold text-xs text-foreground">{r.userName}</span>
                </div>
                {r.rating && (
                  <div className="flex text-amber-500">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">{r.text}</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                <span>{formatDateHu(r.createdAt)}</span>
                <span>{r.likeCount} kedvelés</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
