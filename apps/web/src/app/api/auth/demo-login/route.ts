import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  DEMO_FALLBACK_USERS,
} from "@/lib/auth/session";
import { recordLogin } from "@/lib/site-stats";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedRole = (body.role || "reader").toLowerCase();

    let targetUser: any = null;
    let redirectUrl = "/discover";

    if (requestedRole === "admin") {
      targetUser = DEMO_FALLBACK_USERS.find((u) => u.email === "admin@librarian.ai");
      redirectUrl = "/admin";
    } else if (requestedRole === "supporter" || requestedRole === "vip") {
      targetUser = DEMO_FALLBACK_USERS.find((u) => u.email === "vip_teszt@librarian.ai") ||
                   DEMO_FALLBACK_USERS.find((u) => u.email === "supporter@librarian.ai");
      redirectUrl = "/discover";
    } else {
      // Default: Free Reader Tester
      targetUser = DEMO_FALLBACK_USERS.find((u) => u.email === "tesztelo@librarian.ai") ||
                   DEMO_FALLBACK_USERS.find((u) => u.email === "olvaso@librarian.ai");
      redirectUrl = "/discover";
    }

    if (!targetUser) {
      return NextResponse.json({ error: "Nem található a kiválasztott tesztfiók." }, { status: 404 });
    }

    // Create authenticated session
    const { token, expiresAt } = await createSession(targetUser.id, req, targetUser);

    // Record login event in live statistics
    try {
      recordLogin(targetUser, true);
    } catch (e) {
      // Non-fatal
    }

    const response = NextResponse.json({
      success: true,
      message: `Sikeresen beléptél mint ${targetUser.displayName}!`,
      redirectUrl,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        displayName: targetUser.displayName,
        role: targetUser.role,
        membershipStatus: targetUser.membershipStatus,
        permissions: targetUser.permissions,
        isTester: true,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires: expiresAt,
    });

    return response;
  } catch (err: any) {
    console.error("Demo login error:", err);
    return NextResponse.json({ error: "Hiba történt a tesztfiók aktiválásakor." }, { status: 500 });
  }
}
