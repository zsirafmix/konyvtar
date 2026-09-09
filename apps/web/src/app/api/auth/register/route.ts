import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@librarian/database";
import { hashPassword, ROLE_DEFAULT_PERMISSIONS } from "@librarian/auth";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";
import { sanitizeDisplayName } from "@/lib/security/sanitize";
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const RegisterSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(2, "A felhasználónévnek legalább 2 karakter hosszúnak kell lennie.")
      .max(50, "A felhasználónév legfeljebb 50 karakter lehet."),
    email: z
      .string()
      .trim()
      .email("Kérjük, érvényes e-mail címet adj meg.")
      .max(100, "Az e-mail cím túl hosszú.")
      .toLowerCase(),
    password: z
      .string()
      .min(8, "A jelszónak legalább 8 karakterből kell állnia.")
      .max(128, "A jelszó legfeljebb 128 karakter lehet.")
      .regex(/[A-Z]/, "A jelszónak tartalmaznia kell legalább egy nagybetűt.")
      .regex(/[0-9]/, "A jelszónak tartalmaznia kell legalább egy számot."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "A megadott jelszavak nem egyeznek.",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `register:${ip}`,
      windowMs: RATE_LIMIT_CONFIGS.register.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.register.maxRequests,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Túl sok regisztrációs kérés erről az IP-címről. Kérjük, próbáld újra ${rateLimit.retryAfterSeconds} másodperc múlva.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Érvénytelen regisztrációs adatok." },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;
    const cleanDisplayName = sanitizeDisplayName(username);

    // Check if email or username already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { profile: { displayName: { equals: cleanDisplayName, mode: "insensitive" } } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ez az e-mail cím vagy felhasználónév már regisztrálva van a rendszerben." },
        { status: 409 }
      );
    }

    // Hash password with bcrypt work factor 12
    const passwordHash = hashPassword(password);

    // Create user, profile, and permissions atomically in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "USER",
          profile: {
            create: {
              displayName: cleanDisplayName,
              bio: "Librarian AI olvasó",
              isSupporterBadgeVisible: false,
              isProfilePublic: true,
              isLibraryPublic: false,
            },
          },
          permissions: {
            create: {
              ...ROLE_DEFAULT_PERMISSIONS.USER,
            },
          },
        },
        include: {
          profile: true,
          permissions: true,
        },
      });

      return user;
    });

    // Create session
    const { token, expiresAt } = await createSession(newUser.id, req);

    await createAuditLog({
      userId: newUser.id,
      action: "USER_REGISTERED",
      resource: "User",
      resourceId: newUser.id,
      details: { email: newUser.email, displayName: cleanDisplayName },
      req,
    });

    const response = NextResponse.json({
      success: true,
      message: "Sikeres regisztráció! Üdvözlünk a Librarian AI közösségben.",
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: cleanDisplayName,
        role: "user",
        membershipStatus: "FREE",
        permissions: newUser.permissions,
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
    console.error("Regisztrációs hiba:", err);
    return NextResponse.json({ error: "Váratlan hiba történt a regisztráció során." }, { status: 500 });
  }
}
