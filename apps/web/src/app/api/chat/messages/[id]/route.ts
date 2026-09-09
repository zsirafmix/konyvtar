import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { requireAuth, createAuditLog } from "@/lib/auth/guards";
import { getFallbackChatMessages } from "@/lib/chat-store";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    let authorId = "";
    let roomId = "";
    let found = false;

    // Check in-memory store
    const fallbackList = getFallbackChatMessages();
    const inMemMsg = fallbackList.find((m) => m.id === id);
    if (inMemMsg) {
      found = true;
      authorId = inMemMsg.author.id;
      roomId = inMemMsg.roomId;
    }

    if (isDatabaseConfigured && !found) {
      try {
        const dbMessage = await prisma.chatMessage.findUnique({ where: { id } });
        if (dbMessage) {
          found = true;
          authorId = dbMessage.authorId;
          roomId = dbMessage.roomId;
        }
      } catch (dbErr) {
        console.warn("Prisma chat delete check note:", dbErr);
      }
    }

    if (!found) {
      return NextResponse.json({ error: "Az üzenet nem található." }, { status: 404 });
    }

    const isAuthor = authorId === user.id;
    const canModerate = user.role === "admin" || (user.permissions && user.permissions.canModerateChat);

    if (!isAuthor && !canModerate) {
      return NextResponse.json({ error: "Nincs jogosultságod törölni ezt az üzenetet." }, { status: 403 });
    }

    // Soft-delete in memory
    if (inMemMsg) {
      inMemMsg.isDeleted = true;
    }

    // Soft-delete in DB if configured
    if (isDatabaseConfigured) {
      try {
        await prisma.chatMessage.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedById: user.id,
          },
        });
      } catch (dbErr) {
        console.warn("Prisma message delete note:", dbErr);
      }
    }

    if (!isAuthor && canModerate) {
      await createAuditLog({
        userId: user.id,
        action: "CHAT_MESSAGE_MODERATED_DELETE",
        resource: "ChatMessage",
        resourceId: id,
        details: { authorId, roomId },
        req,
      });
    }

    return NextResponse.json({ success: true, message: "Üzenet sikeresen törölve." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
