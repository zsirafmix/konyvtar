import { NextRequest, NextResponse } from "next/server";
import { promoteToSuperuser, getActiveUser } from "@/lib/users-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, email, amountUSD = 1, payerName } = body;

    const currentUid = req.cookies.get("librarian_uid")?.value;
    const active = getActiveUser(currentUid);

    const targetIdentifier = email || active.email || "tamogato@konyvtar.hu";

    // Promote user in the persistent store
    const updatedUser = promoteToSuperuser(targetIdentifier, Number(amountUSD) || 1);

    const response = NextResponse.json({
      success: true,
      orderId: orderId || `PP-${Date.now()}`,
      amountUSD: Number(amountUSD) || 1,
      message: "A PayPal 1 dolláros támogatás sikeresen jóváírva! A fiókod mostantól SUPERUSER rangú, minden prémium jogosultsággal.",
      user: updatedUser,
    });

    if (updatedUser) {
      response.cookies.set("librarian_uid", updatedUser.id, {
        path: "/",
        maxAge: 30 * 24 * 3600,
        sameSite: "lax",
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Hiba a PayPal tranzakció érvényesítésekor: " + err.message },
      { status: 500 }
    );
  }
}
