import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
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

export const DEMO_FALLBACK_USERS: Array<AuthenticatedUser & { password: string }> = [
  {
    id: "usr_admin_01",
    email: "admin@librarian.ai",
    password: "AdminPassword123!",
    role: "admin",
    originalRole: "SUPER_ADMIN",
    membershipStatus: "SUPPORTER",
    displayName: "Főkönyvtáros Admin",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
    permissions: {
      canDownload: true,
      canDirectDownload: true,
      canUploadPrivate: true,
      canModerate: true,
      canAdmin: true,
      canUseChat: true,
      canSendChatMessages: true,
      canCreateChatRooms: true,
      canModerateChat: true,
      aiDailyLimit: 9999,
    },
  },
  {
    id: "usr_mod_02",
    email: "moderator@librarian.ai",
    password: "ModPassword123!",
    role: "moderator",
    originalRole: "MODERATOR",
    membershipStatus: "SUPPORTER",
    displayName: "Kovács Anna (Moderátor)",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
    permissions: {
      canDownload: true,
      canDirectDownload: true,
      canUploadPrivate: true,
      canModerate: true,
      canAdmin: false,
      canUseChat: true,
      canSendChatMessages: true,
      canCreateChatRooms: true,
      canModerateChat: true,
      aiDailyLimit: 500,
    },
  },
  {
    id: "usr_supporter_03",
    email: "supporter@librarian.ai",
    password: "UserPassword123!",
    role: "superuser",
    originalRole: "USER",
    membershipStatus: "SUPPORTER",
    displayName: "Nagy Bence (Támogató)",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
    permissions: {
      canDownload: true,
      canDirectDownload: true,
      canUploadPrivate: true,
      canModerate: false,
      canAdmin: false,
      canUseChat: true,
      canSendChatMessages: true,
      canCreateChatRooms: true,
      canModerateChat: false,
      aiDailyLimit: 1000,
    },
  },
  {
    id: "usr_reader_04",
    email: "olvaso@librarian.ai",
    password: "UserPassword123!",
    role: "user",
    originalRole: "USER",
    membershipStatus: "FREE",
    displayName: "Tóth Gábor (Olvasó)",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
    permissions: {
      canDownload: true,
      canDirectDownload: false,
      canUploadPrivate: false,
      canModerate: false,
      canAdmin: false,
      canUseChat: true,
      canSendChatMessages: true,
      canCreateChatRooms: false,
      canModerateChat: false,
      aiDailyLimit: 20,
    },
  },
];

interface FallbackSessionRecord {
  sessionId: string;
  token: string;
  user: AuthenticatedUser;
  expiresAt: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var fallbackSessionsGlobal: Map<string, FallbackSessionRecord> | undefined;
  // eslint-disable-next-line no-var
  var fallbackUsersGlobal: Array<AuthenticatedUser & { password: string }> | undefined;
}

const fallbackSessions: Map<string, FallbackSessionRecord> =
  globalThis.fallbackSessionsGlobal ?? new Map();

globalThis.fallbackSessionsGlobal = fallbackSessions;

const fallbackUsers: Array<AuthenticatedUser & { password: string }> =
  globalThis.fallbackUsersGlobal ?? [...DEMO_FALLBACK_USERS];

globalThis.fallbackUsersGlobal = fallbackUsers;

export function getFallbackUsers(): Array<AuthenticatedUser & { password: string }> {
  return globalThis.fallbackUsersGlobal ?? fallbackUsers;
}

export function promoteUserToSuperuser(userIdOrEmail: string): boolean {
  const users = getFallbackUsers();
  const search = userIdOrEmail.trim().toLowerCase();
  const target = users.find((u) => u.id === search || u.email.toLowerCase() === search);

  if (!target) {
    const newUser: AuthenticatedUser & { password: string } = {
      id: `usr_${Date.now().toString(36)}`,
      email: search.includes("@") ? search : `${search}@librarian.ai`,
      password: "UserPassword123!",
      role: "superuser",
      originalRole: "USER",
      membershipStatus: "SUPPORTER",
      displayName: search.includes("@") ? search.split("@")[0] : "Támogató",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      permissions: {
        canDownload: true,
        canDirectDownload: true,
        canUploadPrivate: true,
        canModerate: false,
        canAdmin: false,
        canUseChat: true,
        canSendChatMessages: true,
        canCreateChatRooms: true,
        canModerateChat: false,
        aiDailyLimit: 1000,
      },
    };
    users.push(newUser);
    return true;
  }

  if (target.role !== "admin") {
    target.role = "superuser";
  }
  target.membershipStatus = "SUPPORTER";
  target.permissions = {
    ...target.permissions,
    canDownload: true,
    canDirectDownload: true,
    canUploadPrivate: true,
    canUseChat: true,
    canSendChatMessages: true,
    canCreateChatRooms: true,
    aiDailyLimit: target.role === "admin" ? 9999 : 1000,
  };

  if (globalThis.fallbackSessionsGlobal) {
    for (const record of globalThis.fallbackSessionsGlobal.values()) {
      if (record.user.id === target.id || record.user.email.toLowerCase() === target.email.toLowerCase()) {
        record.user.role = target.role;
        record.user.membershipStatus = "SUPPORTER";
        record.user.permissions = { ...target.permissions };
      }
    }
  }

  return true;
}

export function updateFallbackUser(
  userId: string,
  data: {
    name?: string;
    role?: "admin" | "moderator" | "superuser" | "user";
    permissions?: Partial<UserPermissions>;
    membershipStatus?: string;
  }
): AuthenticatedUser | null {
  const users = getFallbackUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return null;

  if (data.name) target.displayName = data.name;
  if (data.role) {
    target.role = data.role;
    if (data.role === "superuser") target.membershipStatus = "SUPPORTER";
    else if (data.role === "user" && !data.membershipStatus) target.membershipStatus = "FREE";
  }
  if (data.membershipStatus) {
    target.membershipStatus = data.membershipStatus === "SUPPORTER" ? "SUPPORTER" : "FREE";
    if (data.membershipStatus === "SUPPORTER" && target.role === "user") {
      target.role = "superuser";
    }
  }
  if (data.permissions) {
    target.permissions = { ...target.permissions, ...data.permissions };
  }

  if (globalThis.fallbackSessionsGlobal) {
    for (const record of globalThis.fallbackSessionsGlobal.values()) {
      if (record.user.id === target.id) {
        record.user.displayName = target.displayName;
        record.user.role = target.role;
        record.user.membershipStatus = target.membershipStatus;
        record.user.permissions = { ...target.permissions };
      }
    }
  }

  return target;
}

export function createFallbackUser(data: {
  email: string;
  name?: string;
  role?: "admin" | "moderator" | "superuser" | "user";
  permissions?: Partial<UserPermissions>;
}): AuthenticatedUser {
  const users = getFallbackUsers();
  const cleanEmail = data.email.trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return existing;
  }

  const role = data.role || "user";
  const membershipStatus = role === "superuser" ? "SUPPORTER" : "FREE";
  const defaultAiLimit = role === "admin" ? 9999 : role === "superuser" ? 1000 : role === "moderator" ? 500 : 20;

  const newUser: AuthenticatedUser & { password: string } = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    password: "UserPassword123!",
    role,
    originalRole: role === "admin" ? "ADMIN" : role === "moderator" ? "MODERATOR" : "USER",
    membershipStatus,
    displayName: data.name?.trim() || cleanEmail.split("@")[0],
    avatarUrl: "/avatars/user.png",
    createdAt: new Date().toISOString(),
    permissions: {
      canDownload: true,
      canDirectDownload: role === "admin" || role === "superuser",
      canUploadPrivate: role === "admin" || role === "superuser",
      canModerate: role === "admin" || role === "moderator",
      canAdmin: role === "admin",
      canUseChat: true,
      canSendChatMessages: true,
      canCreateChatRooms: role === "admin" || role === "moderator" || role === "superuser",
      canModerateChat: role === "admin" || role === "moderator",
      aiDailyLimit: defaultAiLimit,
      ...(data.permissions || {}),
    },
  };

  users.push(newUser);
  return newUser;
}

export function deleteFallbackUser(userId: string): boolean {
  const users = getFallbackUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    users.splice(idx, 1);
    return true;
  }
  return false;
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
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.USER;

  if (!isDatabaseConfigured) {
    return defaults;
  }

  try {
    const existing = await prisma.userPermission.findUnique({
      where: { userId },
    });

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
  } catch {
    return defaults;
  }
}

const SESSION_SIGN_SECRET = process.env.AUTH_SECRET || "librarian_secure_hmac_secret_2026_salt_99";

export function signToken(userId: string, expiresAtMs: number): string {
  const nonce = randomBytes(8).toString("hex");
  const payload = `s_${userId}.${expiresAtMs}.${nonce}`;
  const hmac = createHmac("sha256", SESSION_SIGN_SECRET).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

export function verifySignedToken(token: string): { userId: string; expiresAt: Date } | null {
  if (!token || !token.startsWith("s_")) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [sUserId, expiresAtMsStr, nonce, sig] = parts;
  const userId = sUserId.replace(/^s_/, "");
  const payload = `${sUserId}.${expiresAtMsStr}.${nonce}`;
  const expectedSig = createHmac("sha256", SESSION_SIGN_SECRET).update(payload).digest("hex");

  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expectedSig, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  const expiresAtMs = Number(expiresAtMsStr);
  if (isNaN(expiresAtMs) || Date.now() > expiresAtMs) {
    return null;
  }

  return { userId, expiresAt: new Date(expiresAtMs) };
}

/**
 * Creates a new cryptographically secure session for a user.
 */
export async function createSession(
  userId: string,
  req?: Request,
  fallbackUser?: AuthenticatedUser
): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const token = signToken(userId, expiresAt.getTime());

  const ipAddress = req ? getClientIp(req) : null;
  const userAgent = req?.headers.get("user-agent") || null;

  let dbSaved = false;
  if (isDatabaseConfigured) {
    try {
      await prisma.session.create({
        data: {
          userId,
          token,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });
      dbSaved = true;
    } catch (err: any) {
      console.warn("Prisma session create failed, saving in-memory session:", err.message);
    }
  }

  if (!dbSaved && fallbackUser) {
    fallbackSessions.set(token, {
      sessionId: `sess_${token.slice(0, 8)}`,
      token,
      user: fallbackUser,
      expiresAt,
    });
  }

  return { token, expiresAt };
}

/**
 * Validates a session token and returns the authenticated user data.
 * Checks for admin impersonation if the requester is an admin.
 */
export async function validateSessionToken(token: string, impersonateUserId?: string | null): Promise<UserSessionData | null> {
  if (!token) return null;

  if (isDatabaseConfigured) {
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

      if (session) {
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
      }
    } catch {
      // Continue to fallback
    }
  }

  // Fallback in-memory session lookup (for standalone cloud mode on Render)
  const inMem = fallbackSessions.get(token);
  if (inMem) {
    if (new Date() > inMem.expiresAt) {
      fallbackSessions.delete(token);
      return null;
    }

    if (inMem.user.role === "admin" && impersonateUserId && impersonateUserId !== inMem.user.id) {
      const targetUser = getFallbackUsers().find(
        (u) => u.id === impersonateUserId || u.email === impersonateUserId
      );
      if (targetUser) {
        return {
          sessionId: inMem.sessionId,
          token: inMem.token,
          user: {
            ...targetUser,
            isImpersonating: true,
            realAdmin: {
              id: inMem.user.id,
              email: inMem.user.email,
              displayName: inMem.user.displayName,
            },
          },
          expiresAt: inMem.expiresAt,
        };
      }
    }

    return {
      sessionId: inMem.sessionId,
      token: inMem.token,
      user: inMem.user,
      expiresAt: inMem.expiresAt,
    };
  }

  // If not in memory (e.g. server restarted on Render), verify cryptographic signature
  const verified = verifySignedToken(token);
  if (verified) {
    const targetUser = getFallbackUsers().find(
      (u) => u.id === verified.userId || u.email.toLowerCase() === verified.userId.toLowerCase()
    );
    if (targetUser) {
      const restoredSession: FallbackSessionRecord = {
        sessionId: `sess_${token.slice(0, 8)}`,
        token,
        user: targetUser,
        expiresAt: verified.expiresAt,
      };
      fallbackSessions.set(token, restoredSession);

      if (targetUser.role === "admin" && impersonateUserId && impersonateUserId !== targetUser.id) {
        const impersonated = getFallbackUsers().find(
          (u) => u.id === impersonateUserId || u.email.toLowerCase() === impersonateUserId.toLowerCase()
        );
        if (impersonated) {
          return {
            sessionId: restoredSession.sessionId,
            token: restoredSession.token,
            user: {
              ...impersonated,
              isImpersonating: true,
              realAdmin: {
                id: targetUser.id,
                email: targetUser.email,
                displayName: targetUser.displayName,
              },
            },
            expiresAt: restoredSession.expiresAt,
          };
        }
      }

      return {
        sessionId: restoredSession.sessionId,
        token: restoredSession.token,
        user: targetUser,
        expiresAt: verified.expiresAt,
      };
    }
  }

  return null;
}

/**
 * Destroys a session by token
 */
export async function destroySession(token: string): Promise<boolean> {
  fallbackSessions.delete(token);
  if (isDatabaseConfigured) {
    try {
      await prisma.session.deleteMany({ where: { token } });
      return true;
    } catch {
      return false;
    }
  }
  return true;
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
