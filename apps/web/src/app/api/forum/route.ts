import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { requireAuth, createAuditLog } from "@/lib/auth/guards";
import { sanitizeUserContent } from "@/lib/security/sanitize";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";
import { getFallbackForumTopics, FallbackForumTopic } from "@/lib/forum-store";

export const dynamic = "force-dynamic";

const CreateTopicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "A téma címe legalább 3 karakter legyen.")
    .max(150, "A téma címe legfeljebb 150 karakter lehet."),
  content: z
    .string()
    .trim()
    .min(5, "A bejegyzés szövege legalább 5 karakter legyen.")
    .max(10000, "A bejegyzés szövege legfeljebb 10 000 karakter lehet."),
});

/**
 * GET /api/forum: List all forum topics
 */
export async function GET(req: NextRequest) {
  try {
    if (isDatabaseConfigured) {
      try {
        const topics = await prisma.forumTopic.findMany({
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          take: 50,
          include: {
            author: {
              include: { profile: true },
            },
            _count: {
              select: { posts: true },
            },
          },
        });

        if (topics && topics.length > 0) {
          const formatted = topics.map((t) => ({
            id: t.id,
            title: t.title,
            slug: t.slug,
            content: t.content,
            isPinned: t.isPinned,
            isLocked: t.isLocked,
            viewsCount: t.viewsCount,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
            postsCount: t._count.posts,
            author: {
              id: t.author.id,
              name: t.author.profile?.displayName || t.author.email.split("@")[0],
              avatarUrl: t.author.profile?.avatarUrl || null,
              role: t.author.role,
            },
          }));

          return NextResponse.json({ topics: formatted });
        }
      } catch (dbErr) {
        console.warn("Prisma forum query fallback:", dbErr);
      }
    }

    const topics = getFallbackForumTopics().sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ topics });
  } catch (err: any) {
    console.error("Fórum témák lekérése hiba:", err);
    return NextResponse.json({ topics: getFallbackForumTopics() });
  }
}

/**
 * POST /api/forum: Create a new forum topic
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Rate limiting
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `forum:${user.id || ip}`,
      windowMs: RATE_LIMIT_CONFIGS.forumPost.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.forumPost.maxRequests,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Túl gyakori közzététel! Kérjük, várj ${rateLimit.retryAfterSeconds} másodpercet.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = CreateTopicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Érvénytelen bemeneti adatok." },
        { status: 400 }
      );
    }

    const cleanTitle = sanitizeUserContent(parsed.data.title, 150);
    const cleanContent = sanitizeUserContent(parsed.data.content, 10000);

    const baseSlug = cleanTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);

    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const topicId = `topic_${Date.now().toString(36)}`;

    const newTopic: FallbackForumTopic = {
      id: topicId,
      title: cleanTitle,
      slug,
      content: cleanContent,
      isPinned: false,
      isLocked: false,
      viewsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      postsCount: 0,
      author: {
        id: user.id,
        name: user.displayName || user.email.split("@")[0],
        avatarUrl: user.avatarUrl || null,
        role: user.role,
      },
    };

    getFallbackForumTopics().unshift(newTopic);

    if (isDatabaseConfigured) {
      try {
        await prisma.forumTopic.create({
          data: {
            id: topicId,
            title: cleanTitle,
            slug,
            content: cleanContent,
            authorId: user.id,
          },
        });
      } catch (dbErr) {
        console.warn("Prisma forum topic create note:", dbErr);
      }
    }

    await createAuditLog({
      userId: user.id,
      action: "FORUM_TOPIC_CREATE",
      resource: "ForumTopic",
      resourceId: topicId,
      details: { title: cleanTitle, slug },
      req,
    });

    return NextResponse.json({ success: true, topic: newTopic });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
