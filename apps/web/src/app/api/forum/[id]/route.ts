import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@librarian/database";
import { requireAuth, createAuditLog } from "@/lib/auth/guards";
import { sanitizeUserContent } from "@/lib/security/sanitize";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

const CreateReplySchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "A hozzászólás szövege legalább 2 karakter legyen.")
    .max(5000, "A hozzászólás szövege legfeljebb 5 000 karakter lehet."),
});

/**
 * GET /api/forum/[id]: Fetch a single topic and its posts
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Find topic by id or slug
    const topic = await prisma.forumTopic.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        author: {
          include: { profile: true },
        },
        posts: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "A fórum téma nem található." }, { status: 404 });
    }

    // Increment views count asynchronously
    prisma.forumTopic
      .update({
        where: { id: topic.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => {});

    const formatted = {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      content: topic.content,
      isPinned: topic.isPinned,
      isLocked: topic.isLocked,
      viewsCount: topic.viewsCount + 1,
      createdAt: topic.createdAt.toISOString(),
      updatedAt: topic.updatedAt.toISOString(),
      author: {
        id: topic.author.id,
        name: topic.author.profile?.displayName || topic.author.email.split("@")[0],
        avatarUrl: topic.author.profile?.avatarUrl || null,
        role: topic.author.role,
      },
      posts: topic.posts.map((p) => ({
        id: p.id,
        content: p.content,
        isEdited: p.isEdited,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        author: {
          id: p.author.id,
          name: p.author.profile?.displayName || p.author.email.split("@")[0],
          avatarUrl: p.author.profile?.avatarUrl || null,
          role: p.author.role,
        },
      })),
    };

    return NextResponse.json({ topic: formatted });
  } catch (err: any) {
    console.error("Hiba a fórum téma lekérésekor:", err);
    return NextResponse.json({ error: "Nem sikerült betölteni a fórum témát." }, { status: 500 });
  }
}

/**
 * POST /api/forum/[id]: Add reply to a topic
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    const topic = await prisma.forumTopic.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!topic) {
      return NextResponse.json({ error: "A téma nem található." }, { status: 404 });
    }

    if (topic.isLocked && user.role !== "admin" && user.role !== "moderator") {
      return NextResponse.json({ error: "Ez a téma le van zárva, nem lehet új hozzászólást fűzni hozzá." }, { status: 403 });
    }

    // Rate limit
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `forum_reply:${user.id || ip}`,
      windowMs: RATE_LIMIT_CONFIGS.forumPost.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.forumPost.maxRequests,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Túl gyorsan küldesz hozzászólásokat. Várj ${rateLimit.retryAfterSeconds} másodpercet.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = CreateReplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const cleanContent = sanitizeUserContent(parsed.data.content, 5000);

    const newPost = await prisma.forumPost.create({
      data: {
        topicId: topic.id,
        authorId: user.id,
        content: cleanContent,
      },
      include: {
        author: {
          include: { profile: true },
        },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "FORUM_POST_CREATED",
      resource: "ForumPost",
      resourceId: newPost.id,
      details: { topicId: topic.id },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Hozzászólás elküldve!",
      post: {
        id: newPost.id,
        content: newPost.content,
        isEdited: newPost.isEdited,
        createdAt: newPost.createdAt.toISOString(),
        author: {
          id: newPost.author.id,
          name: newPost.author.profile?.displayName || newPost.author.email.split("@")[0],
          avatarUrl: newPost.author.profile?.avatarUrl || null,
          role: newPost.author.role,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

/**
 * DELETE /api/forum/[id]: Delete topic or specific post (?postId=...)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    const isStaff = user.role === "admin" || user.role === "moderator";

    // 1. Delete specific post
    if (postId) {
      const post = await prisma.forumPost.findUnique({ where: { id: postId } });
      if (!post) {
        return NextResponse.json({ error: "A hozzászólás nem található." }, { status: 404 });
      }

      if (post.authorId !== user.id && !isStaff) {
        return NextResponse.json({ error: "Nincs jogosultságod törölni ezt a hozzászólást." }, { status: 403 });
      }

      await prisma.forumPost.delete({ where: { id: postId } });

      await createAuditLog({
        userId: user.id,
        action: isStaff && post.authorId !== user.id ? "FORUM_POST_MODERATED_DELETE" : "FORUM_POST_DELETED",
        resource: "ForumPost",
        resourceId: postId,
        details: { topicId: id },
        req,
      });

      return NextResponse.json({ success: true, message: "Hozzászólás sikeresen törölve." });
    }

    // 2. Delete whole topic
    const topic = await prisma.forumTopic.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!topic) {
      return NextResponse.json({ error: "A téma nem található." }, { status: 404 });
    }

    if (topic.authorId !== user.id && !isStaff) {
      return NextResponse.json({ error: "Nincs jogosultságod törölni ezt a témát." }, { status: 403 });
    }

    await prisma.forumTopic.delete({ where: { id: topic.id } });

    await createAuditLog({
      userId: user.id,
      action: isStaff && topic.authorId !== user.id ? "FORUM_TOPIC_MODERATED_DELETE" : "FORUM_TOPIC_DELETED",
      resource: "ForumTopic",
      resourceId: topic.id,
      details: { title: topic.title },
      req,
    });

    return NextResponse.json({ success: true, message: "Fórum téma sikeresen törölve." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

/**
 * PATCH /api/forum/[id]: Edit post (?postId=...) or toggle topic lock/pin
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { postId, content, isPinned, isLocked } = body;

    const isStaff = user.role === "admin" || user.role === "moderator";

    // Edit a post's content
    if (postId) {
      const post = await prisma.forumPost.findUnique({ where: { id: postId } });
      if (!post) {
        return NextResponse.json({ error: "A hozzászólás nem található." }, { status: 404 });
      }

      if (post.authorId !== user.id && !isStaff) {
        return NextResponse.json({ error: "Csak a saját hozzászólásodat szerkesztheted." }, { status: 403 });
      }

      const clean = sanitizeUserContent(content, 5000);
      const updated = await prisma.forumPost.update({
        where: { id: postId },
        data: {
          content: clean,
          isEdited: true,
        },
      });

      return NextResponse.json({ success: true, post: updated });
    }

    // Toggle pin/lock (Staff only)
    if (isPinned !== undefined || isLocked !== undefined) {
      if (!isStaff) {
        return NextResponse.json({ error: "Csak moderátor vagy admin zárolhat témát." }, { status: 403 });
      }

      const topic = await prisma.forumTopic.findFirst({
        where: { OR: [{ id }, { slug: id }] },
      });
      if (!topic) return NextResponse.json({ error: "A téma nem található." }, { status: 404 });

      const updated = await prisma.forumTopic.update({
        where: { id: topic.id },
        data: {
          isPinned: isPinned !== undefined ? Boolean(isPinned) : topic.isPinned,
          isLocked: isLocked !== undefined ? Boolean(isLocked) : topic.isLocked,
        },
      });

      return NextResponse.json({ success: true, topic: updated });
    }

    return NextResponse.json({ error: "Nincs megadva módosítandó mező." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
