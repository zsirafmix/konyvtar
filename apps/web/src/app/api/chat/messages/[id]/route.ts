import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { requireAuth, createAuditLog } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    const message = await prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: "Az üzenet nem található." }, { status: 404 });
    }

    const isAuthor = message.authorId === user.id;
    const canModerate = user.role === "admin" || (user.permissions && user.permissions.canModerateChat);

    if (!isAuthor && !canModerate) {
      return NextResponse.json({ error: "Nincs jogosultságod törölni ezt az üzenetet." }, { status: 403 });
    }

    // Soft-delete to keep chat continuity
    await prisma.chatMessage.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedById: user.id,
      },
    });

    if (!isAuthor && canModerate) {
      await createAuditLog({
        userId: user.id,
        action: "CHAT_MESSAGE_MODERATED_DELETE",
        resource: "ChatMessage",
        resourceId: id,
        details: { authorId: message.authorId, roomId: message.roomId },
        req,
      });
    }

    return NextResponse.json({ success: true, message: "Üzenet sikeresen törölve." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
