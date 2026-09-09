import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { requireAuth, requireRole, createAuditLog } from "@/lib/auth/guards";
import { IMPERSONATE_COOKIE_NAME } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST: Admin starts impersonating a target user
 */
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAuth(req);
    requireRole(adminUser, ["admin"]);

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Célfelhasználó azonosító (targetUserId) megadása kötelező." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "A célfelhasználó nem található az adatbázisban." }, { status: 404 });
    }

    // Set impersonation cookie
    const response = NextResponse.json({
      success: true,
      message: `Imperszonáció megkezdve: ${targetUser.profile?.displayName || targetUser.email}`,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        displayName: targetUser.profile?.displayName || targetUser.email,
      },
    });

    response.cookies.set(IMPERSONATE_COOKIE_NAME, targetUser.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour max impersonation window
    });

    await createAuditLog({
      userId: adminUser.id,
      action: "IMPERSONATION_START",
      resource: "User",
      resourceId: targetUser.id,
      details: {
        adminEmail: adminUser.email,
        targetEmail: targetUser.email,
      },
      req,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

/**
 * DELETE: Admin stops impersonation and returns to normal admin view
 */
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await requireAuth(req);

    const response = NextResponse.json({
      success: true,
      message: "Imperszonáció befejezve, sikeresen visszatértél a saját fiókodba.",
    });

    response.cookies.set(IMPERSONATE_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
    });

    await createAuditLog({
      userId: currentUser.id,
      action: "IMPERSONATION_STOP",
      resource: "User",
      details: {
        currentUserId: currentUser.id,
      },
      req,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
