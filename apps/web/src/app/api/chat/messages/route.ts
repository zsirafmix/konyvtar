import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@librarian/database";
import { requireAuth, requirePermission, createAuditLog } from "@/lib/auth/guards";
import { normalizeRole } from "@/lib/auth/session";
import { sanitizeUserContent } from "@/lib/security/sanitize";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";

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

    // Verify room exists
    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: "A megadott csevegőszoba nem található." }, { status: 404 });
    }

    // XSS Sanitization
    const cleanContent = sanitizeUserContent(content, 2000);

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        authorId: user.id,
        content: cleanContent,
      },
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

    const isSupporter = user.membershipStatus === "SUPPORTER";

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        roomId: message.roomId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        author: {
          id: user.id,
          name: user.displayName,
          avatarUrl: user.avatarUrl || null,
          role: user.role,
          isSupporter,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
