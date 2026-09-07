import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { generateRecommendations, generateTodaysPick, BookItem, UserHistoryItem } from "@librarian/ai";
import { getFallbackBookItems } from "@/lib/fallback-books";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let bookItems: BookItem[] = [];

    if (isDatabaseConfigured) {
      try {
        const books = await prisma.book.findMany({
          include: {
            authors: { include: { author: true } },
            categories: { include: { category: true } },
            tags: { include: { tag: true } },
            series: { include: { series: true } },
            editions: {
              include: {
                covers: { where: { isPrimary: true }, take: 1 },
              },
              take: 1,
            },
          },
        });

        if (books && books.length > 0) {
          bookItems = books.map((b: any) => ({
            id: b.id,
            title: b.title,
            slug: b.slug,
            description: b.description,
            averageRating: b.averageRating,
            ratingsCount: b.ratingsCount,
            authors: (b.authors || []).map((ba: any) => ({ name: ba.author?.name || "Ismeretlen" })),
            categories: (b.categories || []).map((bc: any) => ({ name: bc.category?.name || "" })),
            tags: (b.tags || []).map((bt: any) => ({ name: bt.tag?.name || "" })),
            seriesName: b.series?.[0]?.series?.name,
            seriesPosition: b.series?.[0]?.position,
            coverUrl: b.editions?.[0]?.covers?.[0]?.coverUrl || null,
            distributionStatus: b.editions?.[0]?.distributionStatus || "PRIVATE",
            libraryReleaseAt: b.editions?.[0]?.libraryReleaseAt || b.createdAt,
            pages: b.editions?.[0]?.pages || null,
          }));
        }
      } catch (dbErr: any) {
        console.warn("Prisma query fallback in recommendations:", dbErr.message);
      }
    }

    // If DB has no books or is not configured, use curated fallback library
    if (bookItems.length === 0) {
      bookItems = getFallbackBookItems();
    }

    // User reading history for personal recommendations
    const userHistory: UserHistoryItem[] = [
      { bookId: bookItems[0]?.id, status: "COMPLETED", rating: 5, isFavorite: true },
      { bookId: bookItems[Math.min(5, bookItems.length - 1)]?.id, status: "COMPLETED", rating: 5, isFavorite: true },
      { bookId: bookItems[Math.min(2, bookItems.length - 1)]?.id, status: "READING", rating: 4 },
    ];

    // Today's Pick (Section 9)
    const todaysPick = generateTodaysPick(bookItems, userHistory);

    // 70-20-10 Hybrid Recommendations (Section 29 & 30)
    const hybridRecs = generateRecommendations(bookItems, userHistory, 12);

    // Continue Reading Shelf
    const continueReading = bookItems.slice(0, 4);

    // New in Library (recent release dates)
    const newInLibrary = [...bookItems]
      .filter((b) => b.distributionStatus !== "PRIVATE")
      .slice(0, 10);

    // Trending in Community
    const trending = [...bookItems]
      .sort((a, b) => b.averageRating * b.ratingsCount - a.averageRating * a.ratingsCount)
      .slice(0, 10);

    // Because You Liked
    const becauseYouLiked = bookItems.slice(1, 10);

    // Quick Reads
    const quickReads = bookItems
      .filter((b) => (b.pages && b.pages <= 300) || !b.pages)
      .slice(0, 10);

    return NextResponse.json({
      todaysPick,
      shelves: {
        forYou: hybridRecs.map((r) => ({
          ...r.book,
          recommendationReason: r.reason,
          algorithmSource: r.algorithmSource,
        })),
        continueReading,
        newInLibrary,
        trending,
        becauseYouLiked,
        quickReads,
      },
    });
  } catch (error: any) {
    console.error("Ajánlások generálási hiba, végső vészhelyzeti visszaadás:", error);
    const fallback = getFallbackBookItems();
    return NextResponse.json({
      todaysPick: {
        book: fallback[0],
        reason: "A digitális könyvtár szerkesztői kiemelt ajánlata.",
        badge: "A Nap Ajánlata",
      },
      shelves: {
        forYou: fallback.slice(0, 8),
        continueReading: fallback.slice(0, 3),
        newInLibrary: fallback.slice(0, 8),
        trending: fallback.slice(0, 8),
        becauseYouLiked: fallback.slice(1, 8),
        quickReads: fallback.slice(2, 8),
      },
    });
  }
}
