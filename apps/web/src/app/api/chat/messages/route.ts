import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { normalizeRole } from "@/lib/auth/session";
import { sanitizeUserContent } from "@/lib/security/sanitize";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";
import { getFallbackChatMessages, FallbackChatMessage } from "@/lib/chat-store";

export const dynamic = "force-dynamic";

const SendMessageSchema = z.object({
  roomId: z.string().min(1, "A szoba kiválasztása kötelező."),
  content: z
    .string()
    .trim()
    .min(1, "Az üzenet nem lehet üres.")
    .max(2000, "Az üzenet hossza legfeljebb 2000 karakter lehet."),
});

/**
 * GET /api/chat/messages?roomId=...: Fetch recent messages for a chat room
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requirePermission(user, "canUseChat");

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "A roomId paraméter megadása kötelező." }, { status: 400 });
    }

    if (isDatabaseConfigured) {
      try {
        const messages = await prisma.chatMessage.findMany({
          where: {
            roomId,
            isDeleted: false,
          },
          orderBy: { createdAt: "asc" },
          take: 100,
          include: {
            author: {
              include: {
                profile: true,
                memberships: {
                  where: { status: "SUPPORTER" },
                  take: 1,
                },
              },
            },
          },
        });

        if (messages && messages.length > 0) {
          const formatted = messages.map((msg) => {
            const isSupporter = msg.author.memberships && msg.author.memberships.length > 0;
            const memStatus = isSupporter ? "SUPPORTER" : "FREE";
            const role = normalizeRole(msg.author.role, memStatus);

            return {
              id: msg.id,
              roomId: msg.roomId,
              content: msg.content,
              createdAt: msg.createdAt.toISOString(),
              isDeleted: msg.isDeleted,
              author: {
                id: msg.author.id,
                name: msg.author.profile?.displayName || msg.author.email.split("@")[0],
                avatarUrl: msg.author.profile?.avatarUrl || null,
                role,
                isSupporter,
              },
            };
          });

          return NextResponse.json({ messages: formatted });
        }
      } catch (dbErr) {
        console.warn("Prisma messages query fallback:", dbErr);
      }
    }

    // Match messages by roomId or mapped slug
    const normalizedRoomId = roomId.startsWith("room_") ? roomId : `room_${roomId}`;
    const allMsgs = getFallbackChatMessages();
    const filtered = allMsgs
      .filter((m) => !m.isDeleted && (m.roomId === roomId || m.roomId === normalizedRoomId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({ messages: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

/**
 * POST /api/chat/messages: Send a message to a chat room
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requirePermission(user, "canUseChat");
    requirePermission(user, "canSendChatMessages");

    // Rate limit
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `chat:${user.id || ip}`,
      windowMs: RATE_LIMIT_CONFIGS.chatMessage.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.chatMessage.maxRequests,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Túl gyorsan küldesz üzeneteket! Kérjük, várj ${rateLimit.retryAfterSeconds} másodpercet.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Érvénytelen üzenet formátum." },
        { status: 400 }
      );
    }

    const { roomId, content } = parsed.data;
    const cleanContent = sanitizeUserContent(content, 2000);
    const isSupporter = user.membershipStatus === "SUPPORTER" || user.role === "superuser";
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newChatMessage: FallbackChatMessage = {
      id: msgId,
      roomId,
      content: cleanContent,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      author: {
        id: user.id,
        name: user.displayName || user.email.split("@")[0],
        avatarUrl: user.avatarUrl || null,
        role: user.role,
        isSupporter,
      },
    };

    // Store in global memory
    getFallbackChatMessages().push(newChatMessage);

    // If DB is configured, also persist in DB
    if (isDatabaseConfigured) {
      try {
        await prisma.chatMessage.create({
          data: {
            id: msgId,
            roomId,
            authorId: user.id,
            content: cleanContent,
          },
        });
      } catch (dbErr) {
        console.warn("Prisma chat message persist note:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: newChatMessage,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
