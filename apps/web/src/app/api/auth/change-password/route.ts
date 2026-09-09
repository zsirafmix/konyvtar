import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@librarian/database";
import { requireAuth, createAuditLog } from "@/lib/auth/guards";
import { verifyPassword, hashPassword } from "@librarian/auth";

export const dynamic = "force-dynamic";

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, "A jelenlegi jelszó megadása kötelező."),
  newPassword: z
    .string()
    .min(8, "Az új jelszónak legalább 8 karakter hosszúnak kell lennie.")
    .max(128, "Az új jelszó legfeljebb 128 karakter lehet."),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { oldPassword, newPassword } = parsed.data;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "Felhasználó nem található." }, { status: 404 });
    }

    const isValid = verifyPassword(oldPassword, dbUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "A jelenlegi jelszó hibás." }, { status: 400 });
    }

    const newHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await createAuditLog({
      userId: user.id,
      action: "PASSWORD_CHANGED",
      resource: "User",
      resourceId: user.id,
      req,
    });

    return NextResponse.json({ success: true, message: "A jelszavad sikeresen megváltozott." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
