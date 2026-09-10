import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, AuthError } from "@/lib/auth/guards";
import { getFullAdminStats } from "@/lib/site-stats";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireRole(user, ["admin"]);

    const stats = await getFullAdminStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("Admin stats lekérési hiba:", err);
    return NextResponse.json({ error: "Hiba történt a statisztikák betöltésekor." }, { status: 500 });
  }
}
