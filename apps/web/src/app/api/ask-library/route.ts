import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { BookItem } from "@librarian/ai";
import { getFallbackBookItems } from "@/lib/fallback-books";
import { searchMegaBooks, toBookCard } from "@/lib/mega-catalog";
import { requireAuth } from "@/lib/auth/guards";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";
import {
  fetchHungarianWikipedia,
  fetchGoogleBooksDetails,
  fetchMolyLibrarianContext,
  queryExternalLLM,
  synthesizeHungarianLibrarianAnswer,
} from "@/lib/ai-librarian-engine";

export const dynamic = "force-dynamic";

// In-memory daily usage tracking for standalone mode
declare global {
  var fallbackAiUsageGlobal: Map<string, { count: number; dateKey: string }> | undefined;
}
if (!globalThis.fallbackAiUsageGlobal) {
  globalThis.fallbackAiUsageGlobal = new Map();
}

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

    // Daily limit check
    const dateKey = new Date().toISOString().split("T")[0];
    const dailyLimit = user.permissions?.aiDailyLimit || 20;
    let requestsToday = 0;

    if (isDatabaseConfigured) {
      try {
        const currentUsage = await prisma.aiUsage.findUnique({
          where: {
            userId_dateKey: {
              userId: user.id,
              dateKey,
            },
          },
        });
        requestsToday = currentUsage?.requestCount || 0;
      } catch {
        // Fallback to in-memory on DB connection error
        const inMem = globalThis.fallbackAiUsageGlobal!.get(user.id);
        if (inMem && inMem.dateKey === dateKey) requestsToday = inMem.count;
      }
    } else {
      const inMem = globalThis.fallbackAiUsageGlobal!.get(user.id);
      if (inMem && inMem.dateKey === dateKey) {
        requestsToday = inMem.count;
      }
    }

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
    const query = (body.query || body.question || "").trim();

    if (!query) {
      return NextResponse.json({ error: "Kérlek adj meg egy kérdést a könyvtáradhoz." }, { status: 400 });
    }

    // 1. Search relevant books in library catalog (11,472 Calibre MEGA books + fallback)
    const megaMatches = searchMegaBooks(query, 12).map((b) => ({
      ...toBookCard(b),
      categories: [{ name: b.genre || "Könyv" }],
      tags: [{ name: b.author }],
    }));

    let candidateBooks: BookItem[] = [...megaMatches];
    if (candidateBooks.length === 0) {
      const fallbackMatches = getFallbackBookItems().filter(
        (b) =>
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.authors.some((a) => a.name.toLowerCase().includes(query.toLowerCase())) ||
          (b.description && b.description.toLowerCase().includes(query.toLowerCase()))
      );
      candidateBooks = fallbackMatches.length > 0 ? fallbackMatches : getFallbackBookItems().slice(0, 5);
    }

    // 2. Fetch external open knowledge (Moly.hu, Hungarian Wikipedia & Google Books) in parallel
    const [molyContext, wikiContext, googleContext] = await Promise.all([
      fetchMolyLibrarianContext(query),
      fetchHungarianWikipedia(query),
      fetchGoogleBooksDetails(query),
    ]);

    // 3. If external LLM key is configured (Gemini/Groq/OpenRouter), generate with LLM
    let synthesizedText = "";
    const prompt = `Te egy rendkívül művelt, segítőkész, barátságos magyar mesterséges intelligencia könyvtáros vagy a digitális könyvtárban.
Kérdés az olvasótól: "${query}"

Hiteles magyar könyvadatbázis háttérinformációk:
${molyContext?.molyTitle ? `Moly.hu könyv: ${molyContext.molyTitle} (Szerző: ${molyContext.molyAuthor || "Ismeretlen"})${molyContext.molyRating ? `, Értékelés: ${molyContext.molyRating}★` : ""}` : ""}
${molyContext?.molyDescription ? `Moly.hu fülszöveg: ${molyContext.molyDescription}` : ""}
${wikiContext?.wikiExtract ? `Magyar Wikipédia: ${wikiContext.wikiExtract}` : ""}
${googleContext?.googleDescription ? `Google Books ismertető: ${googleContext.googleDescription}` : ""}

A könyvtárunkban elérhető releváns könyvek:
${candidateBooks.slice(0, 5).map((b) => `- ${b.title} (${b.authors.map((a) => a.name).join(", ")}${b.publishedYear ? `, ${b.publishedYear}` : ""}) [műfaj: ${b.categories[0]?.name || "általános"}]`).join("\n")}

Válaszolj igényes, gördülékeny, közvetlen magyar nyelven! Ha a kérdező olvasási sorrendet kér, add meg a pontos sorrendet. Ha szerzőről kérdez, mutasd be az életművét és jelentőségét. Ha könyvről kérdez, mutasd be a cselekményt és a témákat. Hivatkozz a könyvtárunkban elérhető fenti kötetekre közvetlenül linkkel ([Cím](/book/slug)), hogy azonnal tudjon olvasni.`;

    const llmAnswer = await queryExternalLLM(prompt);
    if (llmAnswer) {
      synthesizedText = llmAnswer;
    } else {
      // Free Open Hungarian Literary Reasoning Engine
      synthesizedText = synthesizeHungarianLibrarianAnswer(
        query,
        candidateBooks,
        wikiContext,
        googleContext,
        molyContext
      );
    }

    // 4. Record usage count safely
    if (isDatabaseConfigured) {
      prisma.aiUsage
        .upsert({
          where: { userId_dateKey: { userId: user.id, dateKey } },
          create: { userId: user.id, dateKey, requestCount: 1, tokensUsed: 150 },
          update: { requestCount: { increment: 1 }, tokensUsed: { increment: 150 } },
        })
        .catch(() => {});
    } else {
      globalThis.fallbackAiUsageGlobal!.set(user.id, {
        count: requestsToday + 1,
        dateKey,
      });
    }

    return NextResponse.json({
      answer: synthesizedText,
      matchedBooks: candidateBooks.slice(0, 5),
      confidence: 0.96,
      sourcesUsedCount: candidateBooks.length,
      usage: {
        usedToday: requestsToday + 1,
        dailyLimit,
        remaining: Math.max(0, dailyLimit - (requestsToday + 1)),
      },
    });
  } catch (error: any) {
    console.error("Ask My Library hiba:", error);
    return NextResponse.json(
      { error: error.message || "Nem sikerült feldolgozni a kérdést." },
      { status: error.statusCode || 500 }
    );
  }
}
