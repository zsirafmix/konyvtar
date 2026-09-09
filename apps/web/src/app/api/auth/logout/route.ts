import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, IMPERSONATE_COOKIE_NAME, destroySession } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await destroySession(token).catch(() => {});
  }

  await createAuditLog({
    action: "USER_LOGGED_OUT",
    resource: "Auth",
    req,
  });

  const response = NextResponse.json({
    success: true,
    message: "Sikeres kijelentkezés.",
  });

  // Expire cookies
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
  });

  response.cookies.set(IMPERSONATE_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
