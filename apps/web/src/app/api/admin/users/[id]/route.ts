import { NextRequest, NextResponse } from "next/server";
import { updateUser, deleteUser, getUserById } from "@/lib/users-store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserById(params.id);
  if (!user) {
    return NextResponse.json({ error: "A felhasználó nem található" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = updateUser(id, body);
    if (!updated) {
      return NextResponse.json({ error: "A felhasználó nem található" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `A(z) „${updated.name}” felhasználó adatai és jogosultságai frissítve!`,
      user: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Hiba a felhasználó frissítésekor: " + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const ok = deleteUser(id);
    if (!ok) {
      return NextResponse.json(
        { error: "A felhasználó nem törölhető vagy nem található (a főadmin védett)." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Felhasználó sikeresen eltávolítva!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Hiba a törlés során: " + err.message },
      { status: 500 }
    );
  }
}
