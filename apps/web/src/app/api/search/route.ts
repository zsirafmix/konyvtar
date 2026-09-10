import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { generateDeterministicEmbedding, cosineSimilarity } from "@librarian/ai";
import { FALLBACK_BOOKS } from "@/lib/fallback-books";
import { searchMegaBooks, toBookCard } from "@/lib/mega-catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, books, authors, series, lists, users
    const isSemantic = searchParams.get("semantic") === "true";

    if (!query.trim()) {
      return NextResponse.json({
        query: "",
        books: [],
        authors: [],
        series: [],
        lists: [],
        users: [],
      });
    }

    const trimmed = query.trim().toLowerCase();

    // In-memory fallback dataset helpers
    const getFallbackResults = () => {
      // 1. Semantic fallback search
      if (isSemantic) {
        const queryVector = generateDeterministicEmbedding(trimmed);
        const scored = FALLBACK_BOOKS.map((b) => {
          const text = `${b.title} ${b.description || ""} ${b.authors.map((a) => a.name).join(" ")} ${b.categories.map((c) => c.name).join(" ")} ${b.tags.map((t) => t.name).join(" ")}`;
          const bookVector = generateDeterministicEmbedding(text);
          const similarity = cosineSimilarity(queryVector, bookVector);
          return {
            ...b,
            similarityScore: parseFloat(similarity.toFixed(4)),
          };
        });

        scored.sort((a, b) => b.similarityScore - a.similarityScore);
        return {
          query: query.trim(),
          isSemantic: true,
          books: scored.slice(0, 15),
          authors: [],
          series: [],
          lists: [],
          users: [],
        };
      }

      // 2. Keyword fallback search across 11,472 Calibre books
      const megaMatched = searchMegaBooks(trimmed, 40).map(toBookCard);
      const matchedBooks = megaMatched.length > 0 ? megaMatched : FALLBACK_BOOKS.filter((b) => {
        const matchTitle = b.title.toLowerCase().includes(trimmed);
        const matchAuthor = b.authors.some((a) => a.name.toLowerCase().includes(trimmed));
        const matchCategory = b.categories.some((c) => c.name.toLowerCase().includes(trimmed));
        const matchTag = b.tags.some((t) => t.name.toLowerCase().includes(trimmed));
        const matchDesc = b.description?.toLowerCase().includes(trimmed) || false;
        const matchSeries = b.seriesName?.toLowerCase().includes(trimmed) || false;
        return matchTitle || matchAuthor || matchCategory || matchTag || matchDesc || matchSeries;
      });

      // Extract authors
      const authorsMap = new Map<string, { id: string; name: string; bio: string }>();
      matchedBooks.forEach((b) => {
        b.authors.forEach((a) => {
          if (!authorsMap.has(a.name) && (type === "all" || type === "authors")) {
            if (a.name.toLowerCase().includes(trimmed) || trimmed.length <= 3) {
              authorsMap.set(a.name, {
                id: `auth_${a.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                name: a.name,
                bio: `A(z) ${b.title} és más neves művek szerzője a Calibre felhőkönyvtárban.`,
              });
            }
          }
        });
      });

      // Extract series
      const seriesMap = new Map<string, { id: string; name: string; description: string }>();
      FALLBACK_BOOKS.forEach((b) => {
        if (b.seriesName && (type === "all" || type === "series")) {
          if (b.seriesName.toLowerCase().includes(trimmed)) {
            seriesMap.set(b.seriesName, {
              id: `ser_${b.seriesName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
              name: b.seriesName,
              description: `A(z) ${b.seriesName} sorozat hivatalos gyűjteménye.`,
            });
          }
        }
      });

      return {
        query: query.trim(),
        isSemantic: false,
        books: type === "all" || type === "books" ? matchedBooks : [],
        authors: Array.from(authorsMap.values()),
        series: Array.from(seriesMap.values()),
        lists:
          type === "all" || type === "lists"
            ? [
                { id: "l1", title: "Alapvető Hard Sci-Fi Mesterművek", likeCount: 28 },
                { id: "l2", title: "A Magyar Irodalom Örök Klasszikusai", likeCount: 35 },
                { id: "l3", title: "Izgalmas Rejtélyek és Krimik", likeCount: 19 },
              ].filter((l) => l.title.toLowerCase().includes(trimmed))
            : [],
        users: [],
      };
    };

    // If database is not configured, directly return high quality fallback
    if (!isDatabaseConfigured) {
      return NextResponse.json(getFallbackResults());
    }

    // If database IS configured, attempt Prisma search
    try {
      if (isSemantic) {
        const queryVector = generateDeterministicEmbedding(trimmed);
        const allBooks = await prisma.book.findMany({
          include: {
            authors: { include: { author: true } },
            categories: { include: { category: true } },
            tags: { include: { tag: true } },
            editions: {
              include: { covers: { where: { isPrimary: true }, take: 1 } },
              take: 1,
            },
          },
        });

        if (!allBooks || allBooks.length === 0) {
          return NextResponse.json(getFallbackResults());
        }

        const scored = allBooks.map((b: any) => {
          const text = `${b.title} ${b.originalTitle || ""} ${b.description || ""} ${b.aiSummary || ""} ${(b.authors || []).map((a: any) => a.author?.name || "").join(" ")} ${(b.categories || []).map((c: any) => c.category?.name || "").join(" ")} ${(b.tags || []).map((t: any) => t.tag?.name || "").join(" ")}`;
          const bookVector = generateDeterministicEmbedding(text);
          const similarity = cosineSimilarity(queryVector, bookVector);

          return {
            id: b.id,
            slug: b.slug,
            title: b.title,
            description: b.description,
            aiSummary: b.aiSummary,
            averageRating: b.averageRating,
            authors: (b.authors || []).map((ba: any) => ({ name: ba.author?.name || "Ismeretlen" })),
            categories: (b.categories || []).map((bc: any) => ({ name: bc.category?.name || "" })),
            coverUrl: b.editions?.[0]?.covers?.[0]?.coverUrl || null,
            distributionStatus: b.editions?.[0]?.distributionStatus || "PRIVATE",
            similarityScore: parseFloat(similarity.toFixed(4)),
          };
        });

        scored.sort((a, b) => b.similarityScore - a.similarityScore);
        return NextResponse.json({
          query: query.trim(),
          isSemantic: true,
          books: scored.slice(0, 15),
          authors: [],
          series: [],
          lists: [],
          users: [],
        });
      }

      // Standard search via DB
      const [books, authors, seriesList, bookLists, users] = await Promise.all([
        type === "all" || type === "books"
          ? prisma.book.findMany({
              where: {
                OR: [
                  { title: { contains: trimmed, mode: "insensitive" } },
                  { originalTitle: { contains: trimmed, mode: "insensitive" } },
                  { description: { contains: trimmed, mode: "insensitive" } },
                  {
                    authors: {
                      some: { author: { name: { contains: trimmed, mode: "insensitive" } } },
                    },
                  },
                  {
                    tags: {
                      some: { tag: { name: { contains: trimmed, mode: "insensitive" } } },
                    },
                  },
                ],
              },
              take: 20,
              include: {
                authors: { include: { author: true } },
                categories: { include: { category: true } },
                editions: {
                  include: { covers: { where: { isPrimary: true }, take: 1 } },
                  take: 1,
                },
              },
            })
          : [],

        type === "all" || type === "authors"
          ? prisma.author.findMany({
              where: { name: { contains: trimmed, mode: "insensitive" } },
              take: 10,
            })
          : [],

        type === "all" || type === "series"
          ? prisma.series.findMany({
              where: { name: { contains: trimmed, mode: "insensitive" } },
              take: 10,
            })
          : [],

        type === "all" || type === "lists"
          ? prisma.bookList.findMany({
              where: {
                title: { contains: trimmed, mode: "insensitive" },
                visibility: "PUBLIC",
              },
              take: 10,
            })
          : [],

        type === "all" || type === "users"
          ? prisma.userProfile.findMany({
              where: {
                displayName: { contains: trimmed, mode: "insensitive" },
                isProfilePublic: true,
              },
              take: 10,
            })
          : [],
      ]);

      if (books.length === 0 && authors.length === 0) {
        return NextResponse.json(getFallbackResults());
      }

      return NextResponse.json({
        query: query.trim(),
        isSemantic: false,
        books: books.map((b: any) => ({
          id: b.id,
          slug: b.slug,
          title: b.title,
          description: b.description,
          aiSummary: b.aiSummary,
          averageRating: b.averageRating,
          authors: (b.authors || []).map((ba: any) => ({ name: ba.author?.name || "Ismeretlen" })),
          categories: (b.categories || []).map((bc: any) => ({ name: bc.category?.name || "" })),
          coverUrl: b.editions?.[0]?.covers?.[0]?.coverUrl || null,
          distributionStatus: b.editions?.[0]?.distributionStatus || "PRIVATE",
        })),
        authors: authors.map((a: any) => ({ id: a.id, name: a.name, bio: a.bio })),
        series: seriesList.map((s: any) => ({ id: s.id, name: s.name, description: s.description })),
        lists: bookLists.map((l: any) => ({ id: l.id, title: l.title, likeCount: l.likeCount })),
        users: users.map((u: any) => ({ id: u.userId, displayName: u.displayName, avatarUrl: u.avatarUrl })),
      });
    } catch (dbErr) {
      console.warn("Prisma search error, falling back to in-memory search:", dbErr);
      return NextResponse.json(getFallbackResults());
    }
  } catch (error: any) {
    console.error("Keresési hiba:", error);
    return NextResponse.json({
      query: "",
      isSemantic: false,
      books: FALLBACK_BOOKS.slice(0, 5),
      authors: [],
      series: [],
      lists: [],
      users: [],
    });
  }
}
