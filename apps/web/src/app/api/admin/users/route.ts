import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, getActiveUser, createUser } from "@/lib/users-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const requestedUid = req.cookies.get("librarian_uid")?.value || req.headers.get("x-user-id");
    const users = getAllUsers();
    const activeUser = getActiveUser(requestedUid);

    return NextResponse.json({
      users,
      activeUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Hiba a felhasználók lekérésekor: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, permissions } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Érvényes e-mail cím megadása kötelező!" },
        { status: 400 }
      );
    }

    const newUser = createUser({
      name: name || "Új Olvasó",
      email,
      role: role || "user",
      permissions,
    });

    return NextResponse.json({
      success: true,
      message: `A(z) „${newUser.name}” felhasználó sikeresen létrehozva (${newUser.role})!`,
      user: newUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Hiba a felhasználó létrehozásakor: " + err.message },
      { status: 500 }
    );
  }
}
