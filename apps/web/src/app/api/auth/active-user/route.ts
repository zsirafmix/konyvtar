import { NextRequest, NextResponse } from "next/server";
import { getActiveUser, setActiveUserId, getUserById } from "@/lib/users-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = req.cookies.get("librarian_uid")?.value || req.headers.get("x-user-id");
  const user = getActiveUser(uid);
  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "Ismeretlen felhasználó ID" }, { status: 404 });
    }

    setActiveUserId(userId);

    const response = NextResponse.json({
      success: true,
      message: `Aktív munkamenet átváltva: ${user.name} (${user.role.toUpperCase()})`,
      user,
    });

    response.cookies.set("librarian_uid", userId, {
      path: "/",
      maxAge: 30 * 24 * 3600,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
