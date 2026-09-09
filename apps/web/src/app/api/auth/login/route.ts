import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { verifyPassword, hashPassword, ROLE_DEFAULT_PERMISSIONS } from "@librarian/auth";
import { checkRateLimit, resetRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  normalizeRole,
  ensureUserPermissions,
  DEMO_FALLBACK_USERS,
} from "@/lib/auth/session";
import { createAuditLog } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  identifier: z.string().trim().min(1, "E-mail cím vagy felhasználónév megadása kötelező."),
  password: z.string().min(1, "A jelszó megadása kötelező."),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `login:${ip}`,
      windowMs: RATE_LIMIT_CONFIGS.login.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.login.maxRequests,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Túl sok sikertelen próbálkozás. Kérjük, várj ${rateLimit.retryAfterSeconds} másodpercet az újabb bejelentkezés előtt.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Érvénytelen bemeneti adatok." },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const normalizedIdentifier = identifier.toLowerCase().trim();

    let user: any = null;
    if (isDatabaseConfigured) {
      try {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedIdentifier },
              { profile: { displayName: { equals: identifier, mode: "insensitive" } } },
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
      } catch (dbErr: any) {
        console.warn("Prisma user lookup error, falling back to demo users:", dbErr.message);
      }
    }

    // If user not found in DB (or DB offline on Render standalone mode), check DEMO_FALLBACK_USERS
    if (!user) {
      const demoUser = DEMO_FALLBACK_USERS.find(
        (u) =>
          u.email.toLowerCase() === normalizedIdentifier ||
          u.displayName.toLowerCase() === identifier.toLowerCase()
      );

      if (demoUser) {
        const isMatch = password === demoUser.password || verifyPassword(password, demoUser.password);
        if (isMatch) {
          resetRateLimit(`login:${ip}`);
          const { token, expiresAt } = await createSession(demoUser.id, req, demoUser);
          const response = NextResponse.json({
            success: true,
            message: "Sikeres bejelentkezés!",
            user: {
              id: demoUser.id,
              email: demoUser.email,
              displayName: demoUser.displayName,
              role: demoUser.role,
              membershipStatus: demoUser.membershipStatus,
              permissions: demoUser.permissions,
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
        }
      }

      await createAuditLog({
        userId: null,
        action: "LOGIN_FAILED",
        resource: "Auth",
        details: { reason: "Ismeretlen felhasználó", identifier: normalizedIdentifier },
        req,
      });

      return NextResponse.json(
        { error: "Érvénytelen felhasználónév/e-mail cím vagy jelszó." },
        { status: 401 }
      );
    }

    // Verify password with bcrypt / fallback scrypt
    const passwordValid = verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await createAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        resource: "Auth",
        details: { reason: "Hibás jelszó" },
        req,
      });

      return NextResponse.json(
        { error: "Érvénytelen felhasználónév/e-mail cím vagy jelszó." },
        { status: 401 }
      );
    }

    // Upgrade legacy password hash to bcrypt work factor 12 if needed
    if (!user.passwordHash.startsWith("$2")) {
      try {
        const newHash = hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
      } catch (err) {
        console.error("Failed to upgrade password hash to bcrypt:", err);
      }
    }

    // Ensure permissions record exists
    let permissions = user.permissions;
    try {
      permissions = await ensureUserPermissions(user.id, user.role);
    } catch {
      // ignore
    }

    const isSupporter = user.memberships && user.memberships.length > 0;
    const membershipStatus = isSupporter ? "SUPPORTER" : "FREE";
    const role = normalizeRole(user.role, membershipStatus);

    const userObj = {
      id: user.id,
      email: user.email,
      role,
      originalRole: user.role,
      membershipStatus,
      displayName: user.profile?.displayName || user.email.split("@")[0],
      avatarUrl: user.profile?.avatarUrl || undefined,
      permissions: permissions || (ROLE_DEFAULT_PERMISSIONS as any)[user.role] || (ROLE_DEFAULT_PERMISSIONS as any).USER,
    };

    // Create session in DB with fallback
    resetRateLimit(`login:${ip}`);
    const { token, expiresAt } = await createSession(user.id, req, userObj as any);

    await createAuditLog({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      resource: "Auth",
      details: { role, email: user.email },
      req,
    });

    const response = NextResponse.json({
      success: true,
      message: "Sikeres bejelentkezés!",
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName || user.email.split("@")[0],
        role,
        membershipStatus,
        permissions,
      },
    });

    // Set secure HttpOnly cookie
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
    console.error("Login hiba:", err);
    return NextResponse.json({ error: "Váratlan hiba történt a bejelentkezés során." }, { status: 500 });
  }
}
