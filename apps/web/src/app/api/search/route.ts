import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { generateDeterministicEmbedding, cosineSimilarity } from "@librarian/ai";

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

    const trimmed = query.trim();

    // 1. SEMANTIC AI SEARCH
    if (isSemantic) {
      const queryVector = generateDeterministicEmbedding(trimmed);

      // Fetch all books for vector similarity comparison
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

      const scored = allBooks.map((b) => {
        const text = `${b.title} ${b.originalTitle || ""} ${b.description || ""} ${b.aiSummary || ""} ${b.authors.map((a) => a.author.name).join(" ")} ${b.categories.map((c) => c.category.name).join(" ")} ${b.tags.map((t) => t.tag.name).join(" ")}`;
        const bookVector = generateDeterministicEmbedding(text);
        const similarity = cosineSimilarity(queryVector, bookVector);

        return {
          id: b.id,
          slug: b.slug,
          title: b.title,
          description: b.description,
          aiSummary: b.aiSummary,
          averageRating: b.averageRating,
          authors: b.authors.map((ba) => ({ name: ba.author.name })),
          categories: b.categories.map((bc) => ({ name: bc.category.name })),
          coverUrl: b.editions[0]?.covers[0]?.coverUrl || null,
          distributionStatus: b.editions[0]?.distributionStatus || "PRIVATE",
          similarityScore: parseFloat(similarity.toFixed(4)),
        };
      });

      scored.sort((a, b) => b.similarityScore - a.similarityScore);
      const topSemanticBooks = scored.slice(0, 15);

      return NextResponse.json({
        query: trimmed,
        isSemantic: true,
        books: topSemanticBooks,
        authors: [],
        series: [],
        lists: [],
        users: [],
      });
    }

    // 2. STANDARD SEARCH + FULL TEXT SEARCH (PostgreSQL)
    const [books, authors, seriesList, bookLists, users] = await Promise.all([
      // Books: search title, description, originalTitle, ISBN, tags, authors
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
                {
                  editions: {
                    some: {
                      OR: [
                        { isbn13: { contains: trimmed } },
                        { isbn10: { contains: trimmed } },
                      ],
                    },
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

      // Authors
      type === "all" || type === "authors"
        ? prisma.author.findMany({
            where: { name: { contains: trimmed, mode: "insensitive" } },
            take: 10,
          })
        : [],

      // Series
      type === "all" || type === "series"
        ? prisma.series.findMany({
            where: { name: { contains: trimmed, mode: "insensitive" } },
            take: 10,
          })
        : [],

      // Lists
      type === "all" || type === "lists"
        ? prisma.bookList.findMany({
            where: {
              title: { contains: trimmed, mode: "insensitive" },
              visibility: "PUBLIC",
            },
            take: 10,
          })
        : [],

      // Users
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

    return NextResponse.json({
      query: trimmed,
      isSemantic: false,
      books: books.map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        description: b.description,
        aiSummary: b.aiSummary,
        averageRating: b.averageRating,
        authors: b.authors.map((ba) => ({ name: ba.author.name })),
        categories: b.categories.map((bc) => ({ name: bc.category.name })),
        coverUrl: b.editions[0]?.covers[0]?.coverUrl || null,
        distributionStatus: b.editions[0]?.distributionStatus || "PRIVATE",
      })),
      authors: authors.map((a) => ({ id: a.id, name: a.name, bio: a.bio })),
      series: seriesList.map((s) => ({ id: s.id, name: s.name, description: s.description })),
      lists: bookLists.map((l) => ({ id: l.id, title: l.title, likeCount: l.likeCount })),
      users: users.map((u) => ({ id: u.userId, displayName: u.displayName, avatarUrl: u.avatarUrl })),
    });
  } catch (error: any) {
    console.error("Keresési hiba:", error);
    return NextResponse.json({ error: "Nem sikerült végrehajtani a keresést." }, { status: 500 });
  }
}
