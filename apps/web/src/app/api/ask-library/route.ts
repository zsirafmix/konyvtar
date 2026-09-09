import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { queryAskMyLibrary, BookItem } from "@librarian/ai";
import { getFallbackBookItems } from "@/lib/fallback-books";
import { searchMegaBooks, toBookCard } from "@/lib/mega-catalog";
import { requireAuth, createAuditLog } from "@/lib/auth/guards";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Burst rate limit check
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `ai_query:${user.id || ip}`,
      windowMs: RATE_LIMIT_CONFIGS.aiQuery.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.aiQuery.maxRequests,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Túl gyors egymásutánban kérdezel az AI-tól. Várj ${rateLimit.retryAfterSeconds} másodpercet.` },
        { status: 429 }
      );
    }

    // Daily limit check in database
    const dateKey = new Date().toISOString().split("T")[0];
    const dailyLimit = user.permissions?.aiDailyLimit || 20;

    const currentUsage = await prisma.aiUsage.findUnique({
      where: {
        userId_dateKey: {
          userId: user.id,
          dateKey,
        },
      },
    });

    const requestsToday = currentUsage?.requestCount || 0;
    if (requestsToday >= dailyLimit && user.role !== "admin") {
      return NextResponse.json(
        {
          error: `Elérted a napi AI Könyvtáros kérdéskeretedet (${requestsToday}/${dailyLimit}). Támogasd a könyvtárat 1 dollárral az emelt kvótáért a /supporter oldalon!`,
          dailyLimitReached: true,
          requestsToday,
          dailyLimit,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const query = body.query || body.question;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Kérlek adj meg egy kérdést a könyvtáradhoz." }, { status: 400 });
    }

    let bookItems: BookItem[] = [];

    if (isDatabaseConfigured) {
      try {
        const books = await prisma.book.findMany({
          take: 50,
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
            publishedYear: b.editions?.[0]?.publishedYear || null,
          }));
        }
      } catch (dbErr) {
        console.warn("Prisma error in ask-library, using fallback catalog:", dbErr);
      }
    }

    if (bookItems.length === 0) {
      const megaMatches = searchMegaBooks(query, 30).map((b) => ({
        ...toBookCard(b),
        categories: [{ name: "Könyv" }],
        tags: [{ name: b.author }],
      }));
      bookItems = [...megaMatches, ...getFallbackBookItems()];
    }

    // Run RAG query grounded in library
    const result = await queryAskMyLibrary(query.trim(), bookItems);

    // Increment today's usage in DB
    await prisma.aiUsage.upsert({
      where: {
        userId_dateKey: {
          userId: user.id,
          dateKey,
        },
      },
      create: {
        userId: user.id,
        dateKey,
        requestCount: 1,
        tokensUsed: 150,
      },
      update: {
        requestCount: { increment: 1 },
        tokensUsed: { increment: 150 },
      },
    }).catch(() => {});

    return NextResponse.json({
      ...result,
      usage: {
        usedToday: requestsToday + 1,
        dailyLimit,
        remaining: Math.max(0, dailyLimit - (requestsToday + 1)),
      },
    });
  } catch (error: any) {
    console.error("Ask My Library hiba:", error);
    return NextResponse.json({ error: error.message || "Nem sikerült feldolgozni a kérdést." }, { status: error.statusCode || 500 });
  }
}
