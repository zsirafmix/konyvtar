import { NextRequest, NextResponse } from "next/server";
import { getActiveUser, promoteToSuperuser } from "@/lib/users-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Returns Revolut provider status and readiness
  return NextResponse.json({
    provider: "revolut",
    status: "CONFIGURED",
    currency: "USD",
    amount: 1.0,
    supportedMethods: ["revolut_pay", "card", "revtag"],
    revtag: process.env.REVOLUT_REVTAG || "@librarian_ai",
    webhookConfigured: Boolean(process.env.REVOLUT_MERCHANT_KEY),
    instructions: "A Revolut Pay integráció előkészítve. Éles Revolut Merchant API kulcs megadása esetén automatikus webhook fogadás lép érvénybe.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, revtag, email } = body;

    const currentUid = req.cookies.get("librarian_uid")?.value;
    const active = getActiveUser(currentUid);
    const targetIdentifier = email || active.email;

    if (action === "simulate" || action === "confirm_transfer") {
      const updatedUser = promoteToSuperuser(targetIdentifier, 1);
      const res = NextResponse.json({
        success: true,
        message: "Revolut 1 dolláros támogatás sikeresen regisztrálva! A fiókod SUPERUSER rangot kapott.",
        user: updatedUser,
      });
      if (updatedUser) {
        res.cookies.set("librarian_uid", updatedUser.id, {
          path: "/",
          maxAge: 30 * 24 * 3600,
          sameSite: "lax",
        });
      }
      return res;
    }

    return NextResponse.json({
      status: "INITIATED",
      orderId: `REV-${Date.now()}`,
      currency: "USD",
      amount: 1.0,
      revtag: revtag || process.env.REVOLUT_REVTAG || "@librarian_ai",
      message: "Revolut Pay rendelés előkészítve.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
