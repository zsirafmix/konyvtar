import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { requireAuth, createAuditLog } from "@/lib/auth/guards";
import { sanitizeUserContent } from "@/lib/security/sanitize";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";
import {
  getFallbackForumTopics,
  getFallbackForumPosts,
  FallbackForumTopic,
  FallbackForumPost,
} from "@/lib/forum-store";

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

    if (isDatabaseConfigured) {
      try {
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

        if (topic) {
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
        }
      } catch (dbErr) {
        console.warn("Prisma topic query fallback:", dbErr);
      }
    }

    // In-memory fallback
    const allTopics = getFallbackForumTopics();
    const topic = allTopics.find((t) => t.id === id || t.slug === id);

    if (!topic) {
      return NextResponse.json({ error: "A fórum téma nem található." }, { status: 404 });
    }

    topic.viewsCount += 1;

    const allPosts = getFallbackForumPosts();
    const relatedPosts = allPosts.filter((p) => p.topicId === topic.id);

    return NextResponse.json({
      topic: {
        ...topic,
        posts: relatedPosts,
      },
    });
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

    const allTopics = getFallbackForumTopics();
    let topic = allTopics.find((t) => t.id === id || t.slug === id);

    if (isDatabaseConfigured) {
      try {
        const dbTopic = await prisma.forumTopic.findFirst({
          where: { OR: [{ id }, { slug: id }] },
        });
        if (dbTopic) {
          topic = {
            id: dbTopic.id,
            title: dbTopic.title,
            slug: dbTopic.slug,
            content: dbTopic.content,
            isPinned: dbTopic.isPinned,
            isLocked: dbTopic.isLocked,
            viewsCount: dbTopic.viewsCount,
            createdAt: dbTopic.createdAt.toISOString(),
            updatedAt: dbTopic.updatedAt.toISOString(),
            postsCount: 0,
            author: { id: dbTopic.authorId, name: "", avatarUrl: null, role: "user" },
          };
        }
      } catch (dbErr) {
        console.warn("Prisma topic lookup note:", dbErr);
      }
    }

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
    const postId = `post_${Date.now().toString(36)}`;

    const newPost: FallbackForumPost = {
      id: postId,
      topicId: topic.id,
      content: cleanContent,
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: user.id,
        name: user.displayName || user.email.split("@")[0],
        avatarUrl: user.avatarUrl || null,
        role: user.role,
      },
    };

    getFallbackForumPosts().push(newPost);
    topic.postsCount = (topic.postsCount || 0) + 1;
    topic.updatedAt = new Date().toISOString();

    if (isDatabaseConfigured) {
      try {
        await prisma.forumPost.create({
          data: {
            id: postId,
            topicId: topic.id,
            authorId: user.id,
            content: cleanContent,
          },
        });
      } catch (dbErr) {
        console.warn("Prisma post create note:", dbErr);
      }
    }

    await createAuditLog({
      userId: user.id,
      action: "FORUM_POST_CREATED",
      resource: "ForumPost",
      resourceId: postId,
      details: { topicId: topic.id },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Hozzászólás elküldve!",
      post: newPost,
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
      const posts = getFallbackForumPosts();
      const pIdx = posts.findIndex((p) => p.id === postId);
      if (pIdx >= 0) {
        if (posts[pIdx].author.id !== user.id && !isStaff) {
          return NextResponse.json({ error: "Nincs jogosultságod törölni ezt a hozzászólást." }, { status: 403 });
        }
        posts.splice(pIdx, 1);
      }

      if (isDatabaseConfigured) {
        try {
          await prisma.forumPost.delete({ where: { id: postId } });
        } catch (dbErr) {
          console.warn("Prisma post delete note:", dbErr);
        }
      }

      return NextResponse.json({ success: true, message: "Hozzászólás sikeresen törölve." });
    }

    // 2. Delete whole topic
    const topics = getFallbackForumTopics();
    const tIdx = topics.findIndex((t) => t.id === id || t.slug === id);
    if (tIdx >= 0) {
      if (topics[tIdx].author.id !== user.id && !isStaff) {
        return NextResponse.json({ error: "Nincs jogosultságod törölni ezt a témát." }, { status: 403 });
      }
      topics.splice(tIdx, 1);
    }

    if (isDatabaseConfigured) {
      try {
        await prisma.forumTopic.delete({ where: { id } });
      } catch (dbErr) {
        console.warn("Prisma topic delete note:", dbErr);
      }
    }

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
      const posts = getFallbackForumPosts();
      const post = posts.find((p) => p.id === postId);
      if (post) {
        if (post.author.id !== user.id && !isStaff) {
          return NextResponse.json({ error: "Csak a saját hozzászólásodat szerkesztheted." }, { status: 403 });
        }
        post.content = sanitizeUserContent(content, 5000);
        post.isEdited = true;
        post.updatedAt = new Date().toISOString();
      }

      if (isDatabaseConfigured) {
        try {
          await prisma.forumPost.update({
            where: { id: postId },
            data: { content: sanitizeUserContent(content, 5000), isEdited: true },
          });
        } catch (dbErr) {
          console.warn("Prisma post edit note:", dbErr);
        }
      }

      return NextResponse.json({ success: true, post });
    }

    // Toggle pin/lock (Staff only)
    if (isPinned !== undefined || isLocked !== undefined) {
      if (!isStaff) {
        return NextResponse.json({ error: "Csak moderátor vagy admin zárolhat témát." }, { status: 403 });
      }

      const topics = getFallbackForumTopics();
      const topic = topics.find((t) => t.id === id || t.slug === id);
      if (topic) {
        if (isPinned !== undefined) topic.isPinned = Boolean(isPinned);
        if (isLocked !== undefined) topic.isLocked = Boolean(isLocked);
      }

      if (isDatabaseConfigured) {
        try {
          await prisma.forumTopic.update({
            where: { id },
            data: {
              isPinned: isPinned !== undefined ? Boolean(isPinned) : undefined,
              isLocked: isLocked !== undefined ? Boolean(isLocked) : undefined,
            },
          });
        } catch (dbErr) {
          console.warn("Prisma topic pin/lock note:", dbErr);
        }
      }

      return NextResponse.json({ success: true, topic });
    }

    return NextResponse.json({ error: "Nincs megadva módosítandó mező." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
