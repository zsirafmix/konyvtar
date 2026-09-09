import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { UserPermissions, ROLE_DEFAULT_PERMISSIONS, Role } from "@librarian/auth";
import { getClientIp } from "../security/rate-limiter";

export const SESSION_COOKIE_NAME = "librarian_session";
export const IMPERSONATE_COOKIE_NAME = "librarian_impersonate";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 3600; // 30 days

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "admin" | "moderator" | "superuser" | "user";
  originalRole: Role;
  membershipStatus: "FREE" | "SUPPORTER";
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  permissions: UserPermissions;
  isImpersonating?: boolean;
  realAdmin?: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface UserSessionData {
  sessionId: string;
  token: string;
  user: AuthenticatedUser;
  expiresAt: Date;
}

/**
 * Maps database Role enum to lowercase UserRole
 */
export function normalizeRole(role: Role, membershipStatus: string): "admin" | "moderator" | "superuser" | "user" {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "admin";
  if (role === "MODERATOR") return "moderator";
  if (membershipStatus === "SUPPORTER") return "superuser";
  return "user";
}

/**
 * Ensures user has a UserPermission record in DB, creating with role defaults if missing.
 */
export async function ensureUserPermissions(userId: string, role: Role): Promise<UserPermissions> {
  const existing = await prisma.userPermission.findUnique({
    where: { userId },
  });

  const defaults = ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.USER;

  if (existing) {
    return {
      canDownload: existing.canDownload,
      canDirectDownload: existing.canDirectDownload,
      canUploadPrivate: existing.canUploadPrivate,
      canModerate: existing.canModerate,
      canAdmin: existing.canAdmin,
      canUseChat: existing.canUseChat,
      canSendChatMessages: existing.canSendChatMessages,
      canCreateChatRooms: existing.canCreateChatRooms,
      canModerateChat: existing.canModerateChat,
      aiDailyLimit: existing.aiDailyLimit,
    };
  }

  const created = await prisma.userPermission.create({
    data: {
      userId,
      ...defaults,
    },
  });

  return {
    canDownload: created.canDownload,
    canDirectDownload: created.canDirectDownload,
    canUploadPrivate: created.canUploadPrivate,
    canModerate: created.canModerate,
    canAdmin: created.canAdmin,
    canUseChat: created.canUseChat,
    canSendChatMessages: created.canSendChatMessages,
    canCreateChatRooms: created.canCreateChatRooms,
    canModerateChat: created.canModerateChat,
    aiDailyLimit: created.aiDailyLimit,
  };
}

/**
 * Creates a new cryptographically secure session for a user.
 */
export async function createSession(userId: string, req?: Request): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const ipAddress = req ? getClientIp(req) : null;
  const userAgent = req?.headers.get("user-agent") || null;

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return { token, expiresAt };
}

/**
 * Validates a session token and returns the authenticated user data.
 * Checks for admin impersonation if the requester is an admin.
 */
export async function validateSessionToken(token: string, impersonateUserId?: string | null): Promise<UserSessionData | null> {
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            profile: true,
            permissions: true,
            memberships: {
              where: { status: "SUPPORTER" },
              take: 1,
            },
          },
        },
      },
    });

    if (!session) return null;

    // Check expiration
    if (new Date() > session.expiresAt) {
      // Session expired, remove it
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    const realUser = session.user;
    const isSupporter = realUser.memberships && realUser.memberships.length > 0;
    const realMembershipStatus = isSupporter ? "SUPPORTER" : "FREE";
    const realUserRole = normalizeRole(realUser.role, realMembershipStatus);

    let permissions = realUser.permissions;
    if (!permissions) {
      permissions = (await ensureUserPermissions(realUser.id, realUser.role)) as any;
    }

    // Check if real user is an admin requesting impersonation of another user
    const isAdmin = realUser.role === "ADMIN" || realUser.role === "SUPER_ADMIN";
    if (isAdmin && impersonateUserId && impersonateUserId !== realUser.id) {
      const targetUser = await prisma.user.findUnique({
        where: { id: impersonateUserId },
        include: {
          profile: true,
          permissions: true,
          memberships: {
            where: { status: "SUPPORTER" },
            take: 1,
          },
        },
      });

      if (targetUser) {
        const targetIsSupporter = targetUser.memberships && targetUser.memberships.length > 0;
        const targetMembership = targetIsSupporter ? "SUPPORTER" : "FREE";
        let targetPerms = targetUser.permissions;
        if (!targetPerms) {
          targetPerms = (await ensureUserPermissions(targetUser.id, targetUser.role)) as any;
        }

        const impersonatedAuthUser: AuthenticatedUser = {
          id: targetUser.id,
          email: targetUser.email,
          role: normalizeRole(targetUser.role, targetMembership),
          originalRole: targetUser.role,
          membershipStatus: targetMembership,
          displayName: targetUser.profile?.displayName || targetUser.email.split("@")[0],
          avatarUrl: targetUser.profile?.avatarUrl || undefined,
          createdAt: targetUser.createdAt.toISOString(),
          permissions: {
            canDownload: targetPerms?.canDownload ?? true,
            canDirectDownload: targetPerms?.canDirectDownload ?? false,
            canUploadPrivate: targetPerms?.canUploadPrivate ?? false,
            canModerate: targetPerms?.canModerate ?? false,
            canAdmin: targetPerms?.canAdmin ?? false,
            canUseChat: targetPerms?.canUseChat ?? true,
            canSendChatMessages: targetPerms?.canSendChatMessages ?? true,
            canCreateChatRooms: targetPerms?.canCreateChatRooms ?? false,
            canModerateChat: targetPerms?.canModerateChat ?? false,
            aiDailyLimit: targetPerms?.aiDailyLimit ?? 20,
          },
          isImpersonating: true,
          realAdmin: {
            id: realUser.id,
            email: realUser.email,
            displayName: realUser.profile?.displayName || "Admin",
          },
        };

        return {
          sessionId: session.id,
          token: session.token,
          user: impersonatedAuthUser,
          expiresAt: session.expiresAt,
        };
      }
    }

    const authUser: AuthenticatedUser = {
      id: realUser.id,
      email: realUser.email,
      role: realUserRole,
      originalRole: realUser.role,
      membershipStatus: realMembershipStatus,
      displayName: realUser.profile?.displayName || realUser.email.split("@")[0],
      avatarUrl: realUser.profile?.avatarUrl || undefined,
      createdAt: realUser.createdAt.toISOString(),
      permissions: {
        canDownload: permissions?.canDownload ?? true,
        canDirectDownload: permissions?.canDirectDownload ?? (realUserRole === "admin" || realUserRole === "superuser"),
        canUploadPrivate: permissions?.canUploadPrivate ?? (realUserRole === "admin" || realUserRole === "superuser"),
        canModerate: permissions?.canModerate ?? (realUserRole === "admin" || realUserRole === "moderator"),
        canAdmin: permissions?.canAdmin ?? (realUserRole === "admin"),
        canUseChat: permissions?.canUseChat ?? true,
        canSendChatMessages: permissions?.canSendChatMessages ?? true,
        canCreateChatRooms: permissions?.canCreateChatRooms ?? (realUserRole === "admin" || realUserRole === "moderator"),
        canModerateChat: permissions?.canModerateChat ?? (realUserRole === "admin" || realUserRole === "moderator"),
        aiDailyLimit: permissions?.aiDailyLimit ?? (realUserRole === "admin" ? 9999 : realUserRole === "superuser" ? 1000 : 20),
      },
    };

    return {
      sessionId: session.id,
      token: session.token,
      user: authUser,
      expiresAt: session.expiresAt,
    };
  } catch (err: any) {
    console.error("Hiba a munkamenet érvényesítésekor:", err.message);
    return null;
  }
}

/**
 * Destroys a session by token
 */
export async function destroySession(token: string): Promise<boolean> {
  try {
    await prisma.session.delete({ where: { token } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves the current session user in Server Components and Route Handlers.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) return null;

    const impersonateId = cookieStore.get(IMPERSONATE_COOKIE_NAME)?.value;
    const sessionData = await validateSessionToken(sessionToken, impersonateId);
    return sessionData ? sessionData.user : null;
  } catch {
    return null;
  }
}
