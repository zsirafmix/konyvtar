import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  DEMO_FALLBACK_USERS,
  normalizeRole,
  ensureUserPermissions,
} from "@/lib/auth/session";
import { recordLogin } from "@/lib/site-stats";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedRole = (body.role || "reader").toLowerCase();

    // The user explicitly requested to REMOVE admin from demo tester accounts!
    if (requestedRole === "admin") {
      return NextResponse.json(
        { error: "Biztonsági okokból az adminisztrátori fiók próbafiókként nem érhető el. Kérjük, használj jelszavas bejelentkezést!" },
        { status: 403 }
      );
    }

    const isSupporterRole = requestedRole === "supporter" || requestedRole === "vip";
    const targetEmail = isSupporterRole ? "supporter@librarian.ai" : "olvaso@librarian.ai";
    const redirectUrl = "/discover";

    let authenticatedUserObj: any = null;
    let userId: string = "";

    // 1. Try DB lookup first if database is available
    if (isDatabaseConfigured) {
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: targetEmail },
              { email: isSupporterRole ? "vip_teszt@librarian.ai" : "tesztelo@librarian.ai" },
            ],
          },
          include: {
            profile: true,
            permissions: true,
            memberships: {
              where: { status: "SUPPORTER" },
              take: 1,
            },
          },
        });

        if (dbUser) {
          const membershipStatus = isSupporterRole ? "SUPPORTER" : "FREE";
          const role = isSupporterRole ? "superuser" : "user";
          let perms: any = dbUser.permissions;
          if (!perms) {
            perms = await ensureUserPermissions(dbUser.id, dbUser.role);
          }
          perms = {
            canDownload: true,
            canDirectDownload: isSupporterRole,
            canUploadPrivate: isSupporterRole,
            canModerate: false,
            canAdmin: false,
            canUseChat: true,
            canSendChatMessages: true,
            canCreateChatRooms: isSupporterRole,
            canModerateChat: false,
            aiDailyLimit: isSupporterRole ? 1000 : 50,
          };

          userId = dbUser.id;
          authenticatedUserObj = {
            id: dbUser.id,
            email: dbUser.email,
            displayName: isSupporterRole ? "VIP Támogató (Tesztelő)" : "Próba Olvasó (Tesztelő)",
            role,
            originalRole: dbUser.role,
            membershipStatus,
            permissions: perms,
            isTester: true,
          };
        }
      } catch (err: any) {
        console.warn("DB lookup in demo-login failed, using fallback user:", err.message);
      }
    }

    // 2. Fallback to in-memory DEMO_FALLBACK_USERS if DB didn't find the user
    if (!authenticatedUserObj) {
      const fallbackUser =
        DEMO_FALLBACK_USERS.find((u) => u.email === (isSupporterRole ? "vip_teszt@librarian.ai" : "tesztelo@librarian.ai")) ||
        DEMO_FALLBACK_USERS.find((u) => u.email === targetEmail) ||
        (isSupporterRole
          ? DEMO_FALLBACK_USERS.find((u) => u.role === "superuser")
          : DEMO_FALLBACK_USERS.find((u) => u.role === "user"));

      if (!fallbackUser) {
        return NextResponse.json({ error: "Nem található a kiválasztott tesztfiók." }, { status: 404 });
      }

      userId = fallbackUser.id;
      authenticatedUserObj = {
        id: fallbackUser.id,
        email: fallbackUser.email,
        displayName: fallbackUser.displayName,
        role: fallbackUser.role,
        membershipStatus: fallbackUser.membershipStatus,
        permissions: fallbackUser.permissions,
        isTester: true,
      };
    }

    // Create authenticated session
    const { token, expiresAt } = await createSession(userId, req, authenticatedUserObj);

    // Record login event in live statistics
    try {
      recordLogin(authenticatedUserObj, true);
    } catch {
      // Non-fatal
    }

    const response = NextResponse.json({
      success: true,
      message: `Sikeresen beléptél mint ${authenticatedUserObj.displayName}!`,
      redirectUrl,
      user: authenticatedUserObj,
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
