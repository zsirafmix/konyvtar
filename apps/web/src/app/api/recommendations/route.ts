import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { generateRecommendations, generateTodaysPick, BookItem, UserHistoryItem } from "@librarian/ai";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    const bookItems: BookItem[] = (books || []).map((b: any) => ({
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

    // Demo user reading history
    const userHistory: UserHistoryItem[] = [
      { bookId: bookItems[0]?.id, status: "COMPLETED", rating: 5, isFavorite: true },
      { bookId: bookItems[5]?.id, status: "COMPLETED", rating: 5, isFavorite: true },
      { bookId: bookItems[9]?.id, status: "READING", rating: 4 },
    ];

    // Today's Pick (Section 9)
    const todaysPick = generateTodaysPick(bookItems, userHistory);

    // 70-20-10 Hybrid Recommendations (Section 29 & 30)
    const hybridRecs = generateRecommendations(bookItems, userHistory, 12);

    // Continue Reading Shelf
    const continueReading = bookItems.filter((b) => b.id === bookItems[9]?.id);

    // New in Library (recent release dates)
    const newInLibrary = [...bookItems]
      .filter((b) => b.distributionStatus !== "PRIVATE")
      .slice(0, 10);

    // Trending in Community
    const trending = [...bookItems]
      .sort((a, b) => b.averageRating * b.ratingsCount - a.averageRating * a.ratingsCount)
      .slice(0, 10);

    // Because You Liked Foundation
    const becauseYouLiked = bookItems
      .filter((b) => b.categories.some((c) => c.name === "Sci-Fi" || c.name === "Űropera"))
      .slice(1, 10);

    // Quick Reads (<250 pages)
    const quickReads = bookItems
      .filter((b) => b.pages && b.pages <= 250)
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
    console.error("Ajánlások lekérési hiba:", error);
    return NextResponse.json({ error: "Nem sikerült generálni a könyvajánlásokat." }, { status: 500 });
  }
}
