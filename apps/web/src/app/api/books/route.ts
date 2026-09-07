import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const shelf = searchParams.get("shelf"); // e.g. trending, new, top
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    let orderBy: any = { createdAt: "desc" };
    if (shelf === "top" || shelf === "trending") {
      orderBy = { averageRating: "desc" };
    } else if (shelf === "new") {
      orderBy = { createdAt: "desc" };
    }

    const [books, total] = await Promise.all([
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

    const formatted = books.map((b: any) => {
      const edition = b.editions[0];
      const cover = edition?.covers[0];
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
    return NextResponse.json({ error: "Nem sikerült lekérni a könyveket." }, { status: 500 });
  }
}
