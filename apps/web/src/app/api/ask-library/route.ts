import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { queryAskMyLibrary, BookItem } from "@librarian/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Kérlek adj meg egy kérdést a könyvtáradhoz." }, { status: 400 });
    }

    // Fetch accessible books from database
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
      publishedYear: b.editions[0]?.publishedYear || null,
    }));

    // Run RAG query grounded in library
    const result = await queryAskMyLibrary(query.trim(), bookItems);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Ask My Library hiba:", error);
    return NextResponse.json({ error: "Nem sikerült feldolgozni a kérdést." }, { status: 500 });
  }
}
