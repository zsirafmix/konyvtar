import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { requireAuth, requireRole, createAuditLog } from "@/lib/auth/guards";
import { Role } from "@librarian/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAuth(req);
    requireRole(adminUser, ["admin"]);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        profile: true,
        permissions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "A felhasználó nem található." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAuth(req);
    requireRole(adminUser, ["admin"]);

    const { id } = params;
    const body = await req.json();
    const { name, role, permissions, membershipStatus } = body;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true, permissions: true },
    });

    if (!user) {
      return NextResponse.json({ error: "A felhasználó nem található." }, { status: 404 });
    }

    // Role mapping
    let newDbRole: Role | undefined;
    if (role) {
      if (role === "admin") newDbRole = "ADMIN";
      else if (role === "moderator") newDbRole = "MODERATOR";
      else newDbRole = "USER";
    }

    // Update user in transaction
    await prisma.$transaction(async (tx) => {
      if (newDbRole) {
        await tx.user.update({
          where: { id },
          data: { role: newDbRole },
        });
      }

      if (name) {
        await tx.userProfile.upsert({
          where: { userId: id },
          create: {
            userId: id,
            displayName: name.trim(),
          },
          update: {
            displayName: name.trim(),
          },
        });
      }

      if (permissions) {
        await tx.userPermission.upsert({
          where: { userId: id },
          create: {
            userId: id,
            ...permissions,
          },
          update: {
            ...permissions,
          },
        });
      }

      if (membershipStatus || role === "superuser") {
        const status = (role === "superuser" || membershipStatus === "SUPPORTER") ? "SUPPORTER" : "FREE";
        await tx.membership.upsert({
          where: { id: `mem_${id}` },
          create: {
            id: `mem_${id}`,
            userId: id,
            status,
            startedAt: new Date(),
          },
          update: {
            status,
          },
        });
      }
    });

    await createAuditLog({
      userId: adminUser.id,
      action: "ADMIN_UPDATED_USER",
      resource: "User",
      resourceId: id,
      details: { role, permissions, name },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Felhasználó adatai és jogosultságai sikeresen frissítve!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminUser = await requireAuth(req);
    requireRole(adminUser, ["admin"]);

    const { id } = params;

    if (id === adminUser.id) {
      return NextResponse.json({ error: "Nem törölheted a saját admin fiókodat!" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      userId: adminUser.id,
      action: "ADMIN_DELETED_USER",
      resource: "User",
      resourceId: id,
      req,
    });

    return NextResponse.json({ success: true, message: "Felhasználó sikeresen eltávolítva." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
