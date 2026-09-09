import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { sanitizeUserContent } from "@/lib/security/sanitize";
import { getFallbackChatRooms, FallbackChatRoom } from "@/lib/chat-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/rooms: List all chat rooms
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requirePermission(user, "canUseChat");

    if (isDatabaseConfigured) {
      try {
        let rooms = await prisma.chatRoom.findMany({
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });

        if (rooms.length === 0) {
          const defaults = getFallbackChatRooms();
          for (const def of defaults) {
            await prisma.chatRoom.create({
              data: {
                id: def.id,
                name: def.name,
                slug: def.slug,
                description: def.description,
                isDefault: def.isDefault,
                isPrivate: false,
              },
            }).catch(() => {});
          }
          rooms = await prisma.chatRoom.findMany({
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          });
        }

        if (rooms && rooms.length > 0) {
          return NextResponse.json({ rooms });
        }
      } catch (dbErr) {
        console.warn("Prisma error in chat rooms, using fallback store:", dbErr);
      }
    }

    return NextResponse.json({ rooms: getFallbackChatRooms() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

/**
 * POST /api/chat/rooms: Create a new chat room
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requirePermission(user, "canCreateChatRooms");

    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "A szoba nevének legalább 2 karakterből kell állnia." }, { status: 400 });
    }

    const cleanName = sanitizeUserContent(name, 50);
    const cleanDesc = sanitizeUserContent(description || "", 150);

    const slug = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const roomId = `room_${Date.now().toString(36)}`;
    const newRoom: FallbackChatRoom = {
      id: roomId,
      name: cleanName,
      slug: `${slug}-${Date.now().toString(36)}`,
      description: cleanDesc,
      isDefault: false,
      createdAt: new Date().toISOString(),
      createdById: user.id,
    };

    getFallbackChatRooms().push(newRoom);

    if (isDatabaseConfigured) {
      try {
        await prisma.chatRoom.create({
          data: {
            id: newRoom.id,
            name: newRoom.name,
            slug: newRoom.slug,
            description: newRoom.description,
            createdById: user.id,
          },
        });
      } catch (dbErr) {
        console.warn("Prisma room creation warning:", dbErr);
      }
    }

    return NextResponse.json({ success: true, room: newRoom });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
