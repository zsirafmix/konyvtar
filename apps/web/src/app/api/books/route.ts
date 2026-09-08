import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { getFallbackBookItems } from "@/lib/fallback-books";
import { getAllMegaBooks, toBookCard, getMegaBooksFilteredAndSorted } from "@/lib/mega-catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const shelf = searchParams.get("shelf");
    const sortBy = searchParams.get("sortBy") || searchParams.get("sort");
    const q = searchParams.get("q") || searchParams.get("query") || searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    let books: any[] = [];
    let total = 0;

    if (isDatabaseConfigured) {
      const where: any = {};
      if (category && category !== "all") {
        where.categories = {
          some: {
            category: {
              slug: category,
            },
          },
        };
      }
      if (q && q.trim()) {
        where.OR = [
          { title: { contains: q, mode: "insensitive" } },
          { originalTitle: { contains: q, mode: "insensitive" } },
        ];
      }

      let orderBy: any = { createdAt: "desc" };
      if (sortBy === "title_asc") {
        orderBy = { title: "asc" };
      } else if (sortBy === "title_desc") {
        orderBy = { title: "desc" };
      } else if (sortBy === "author_asc" || sortBy === "author_desc") {
        orderBy = { title: sortBy === "author_asc" ? "asc" : "desc" };
      } else if (sortBy === "rating_desc" || shelf === "top" || shelf === "trending") {
        orderBy = { averageRating: "desc" };
      } else if (sortBy === "newest" || shelf === "new") {
        orderBy = { createdAt: "desc" };
      }

      try {
        const [fetchedBooks, count] = await Promise.all([
          prisma.book.findMany({
            where,
            take: limit,
            skip,
            orderBy,
            include: {
              authors: {
                include: { author: true },
                orderBy: { order: "asc" },
              },
              categories: {
                include: { category: true },
              },
              editions: {
                include: {
                  covers: { where: { isPrimary: true }, take: 1 },
                  files: true,
                },
                take: 1,
              },
            },
          }),
          prisma.book.count({ where }),
        ]);
        books = fetchedBooks;
        total = count;
      } catch (dbErr: any) {
        console.warn("Prisma query warning in books route:", dbErr.message);
      }
    }

    if (books.length === 0) {
      const result = getMegaBooksFilteredAndSorted({
        category,
        searchQuery: q,
        sortBy,
        page,
        limit,
        skip,
      });

      return NextResponse.json(result);
    }

    const formatted = books.map((b: any) => {
      const edition = b.editions?.[0];
      const cover = edition?.covers?.[0];
      return {
        id: b.id,
        slug: b.slug,
        title: b.title,
        originalTitle: b.originalTitle,
        description: b.description,
        aiSummary: b.aiSummary,
        averageRating: b.averageRating,
        ratingsCount: b.ratingsCount,
        authors: (b.authors || []).map((ba: any) => ({ name: ba.author?.name || "Ismeretlen" })),
        categories: (b.categories || []).map((bc: any) => ({ name: bc.category?.name || "", slug: bc.category?.slug || "" })),
        coverUrl: cover?.coverUrl || null,
        distributionStatus: edition?.distributionStatus || "PRIVATE",
        libraryReleaseAt: edition?.libraryReleaseAt || b.createdAt,
        pages: edition?.pages || null,
        publishedYear: edition?.publishedYear || null,
      };
    });

    return NextResponse.json({
      books: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Hiba a könyvek lekérésekor:", error);
    const fallback = getFallbackBookItems();
    return NextResponse.json({
      books: fallback,
      pagination: {
        total: fallback.length,
        page: 1,
        limit: fallback.length,
        totalPages: 1,
      },
    });
  }
}
