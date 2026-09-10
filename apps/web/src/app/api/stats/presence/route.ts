import { NextRequest, NextResponse } from "next/server";
import { recordPresence } from "@/lib/site-stats";
import { SESSION_COOKIE_NAME, validateSessionToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    let user: any = null;

    if (token) {
      const session = await validateSessionToken(token);
      if (session) {
        user = session.user;
      }
    }

    if (user) {
      recordPresence({
        id: user.id,
        name: user.displayName || user.email,
        role: user.role,
        isGuest: false,
      });
    } else {
      const forwarded = req.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
      recordPresence({
        id: `guest_${ip.replace(/[^a-z0-9]/gi, "")}`,
        name: "Vendég Olvasó",
        role: "guest",
        isGuest: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
