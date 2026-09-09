import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { sanitizeUserContent } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

const DEFAULT_ROOMS = [
  { name: "Általános", slug: "altalanos", description: "Általános olvasói társalgó és kötetlen beszélgetés", isDefault: true },
  { name: "Könyvajánlók", slug: "konyvek", description: "Ajánlj könyveket és kérj tippeket másoktól", isDefault: false },
  { name: "Sci-Fi & Fantasztikum", slug: "scifi", description: "Űrutazás, cyberpunk, fantasy világok és mágia", isDefault: false },
  { name: "Technika & AI", slug: "technika", description: "Digitális könyvtári fejlesztések, technológia és mesterséges intelligencia", isDefault: false },
];

/**
 * GET /api/chat/rooms: List all chat rooms, auto-seeding defaults if empty
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requirePermission(user, "canUseChat");

    let rooms = await prisma.chatRoom.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    if (rooms.length === 0) {
      for (const def of DEFAULT_ROOMS) {
        await prisma.chatRoom.create({
          data: {
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

    return NextResponse.json({ rooms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

/**
 * POST /api/chat/rooms: Create a new chat room (requires canCreateChatRooms permission)
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

    const newRoom = await prisma.chatRoom.create({
      data: {
        name: cleanName,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: cleanDesc,
        createdById: user.id,
      },
    });

    return NextResponse.json({ success: true, room: newRoom });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
