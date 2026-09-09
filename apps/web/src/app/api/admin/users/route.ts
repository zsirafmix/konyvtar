import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { requireAuth, requireRole, createAuditLog } from "@/lib/auth/guards";
import { hashPassword, ROLE_DEFAULT_PERMISSIONS, Role } from "@librarian/auth";
import { normalizeRole, ensureUserPermissions, getFallbackUsers, createFallbackUser } from "@/lib/auth/session";
import { sanitizeDisplayName } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const activeUser = await requireAuth(req);
    requireRole(activeUser, ["admin"]);

    if (!isDatabaseConfigured) {
      const fallbackUsers = getFallbackUsers();
      const users = fallbackUsers.map((u) => ({
        id: u.id,
        name: u.displayName || u.email.split("@")[0],
        email: u.email,
        role: u.role,
        originalRole: u.originalRole,
        membershipStatus: u.membershipStatus,
        createdAt: u.createdAt,
        avatarUrl: u.avatarUrl || "/avatars/user.png",
        permissions: u.permissions,
      }));

      return NextResponse.json({
        users,
        activeUser,
        auditLogs: [],
      });
    }

    const [dbUsers, auditLogs] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          profile: true,
          permissions: true,
          memberships: {
            where: { status: "SUPPORTER" },
            take: 1,
          },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: {
            include: { profile: true },
          },
        },
      }),
    ]);

    const users = await Promise.all(
      dbUsers.map(async (u) => {
        let perms = u.permissions;
        if (!perms) {
          perms = (await ensureUserPermissions(u.id, u.role)) as any;
        }

        const isSupporter = u.memberships && u.memberships.length > 0;
        const membershipStatus = isSupporter ? "SUPPORTER" : "FREE";
        const role = normalizeRole(u.role, membershipStatus);

        return {
          id: u.id,
          name: u.profile?.displayName || u.email.split("@")[0],
          email: u.email,
          role,
          originalRole: u.role,
          membershipStatus,
          createdAt: u.createdAt.toISOString(),
          avatarUrl: u.profile?.avatarUrl || "/avatars/user.png",
          permissions: {
            canDownload: perms?.canDownload ?? true,
            canDirectDownload: perms?.canDirectDownload ?? false,
            canUploadPrivate: perms?.canUploadPrivate ?? false,
            canModerate: perms?.canModerate ?? false,
            canAdmin: perms?.canAdmin ?? false,
            canUseChat: perms?.canUseChat ?? true,
            canSendChatMessages: perms?.canSendChatMessages ?? true,
            canCreateChatRooms: perms?.canCreateChatRooms ?? false,
            canModerateChat: perms?.canModerateChat ?? false,
            aiDailyLimit: perms?.aiDailyLimit ?? 20,
          },
        };
      })
    );

    const formattedLogs = auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
      userName: log.user?.profile?.displayName || log.user?.email || "Rendszer",
    }));

    return NextResponse.json({
      users,
      activeUser,
      auditLogs: formattedLogs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Hiba az admin adatok lekérésekor: " + err.message },
      { status: err.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const activeUser = await requireAuth(req);
    requireRole(activeUser, ["admin"]);

    const body = await req.json();
    const { name, email, role = "user", permissions } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Érvényes e-mail cím megadása kötelező!" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitizeDisplayName(name || "Új Felhasználó");

    if (!isDatabaseConfigured) {
      const newUser = createFallbackUser({
        name: cleanName,
        email: cleanEmail,
        role,
        permissions,
      });

      return NextResponse.json({
        success: true,
        message: `A(z) „${cleanName}” felhasználó sikeresen létrehozva (${role})!`,
        user: newUser,
      });
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: "Ez az e-mail cím már használatban van." }, { status: 409 });
    }

    const dbRole: Role =
      role === "admin"
        ? "ADMIN"
        : role === "moderator"
        ? "MODERATOR"
        : "USER";

    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[dbRole] || ROLE_DEFAULT_PERMISSIONS.USER;

    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash: hashPassword("TempPassword123!"),
          role: dbRole,
          profile: {
            create: {
              displayName: cleanName,
            },
          },
          permissions: {
            create: {
              ...defaultPerms,
              ...(permissions || {}),
            },
          },
        },
        include: {
          profile: true,
          permissions: true,
        },
      });

      if (role === "superuser") {
        await tx.membership.create({
          data: {
            userId: u.id,
            status: "SUPPORTER",
            startedAt: new Date(),
          },
        });
      }

      return u;
    });

    await createAuditLog({
      userId: activeUser.id,
      action: "ADMIN_CREATED_USER",
      resource: "User",
      resourceId: newUser.id,
      details: { email: cleanEmail, role },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `A(z) „${cleanName}” felhasználó sikeresen létrehozva (${role})!`,
      user: newUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Hiba a felhasználó létrehozásakor: " + err.message },
      { status: err.statusCode || 500 }
    );
  }
}
