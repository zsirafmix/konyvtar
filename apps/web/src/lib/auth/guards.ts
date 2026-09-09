import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { UserPermissions } from "@librarian/auth";
import {
  SESSION_COOKIE_NAME,
  IMPERSONATE_COOKIE_NAME,
  validateSessionToken,
  AuthenticatedUser,
} from "./session";
import { getClientIp } from "../security/rate-limiter";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Extracts and validates the authenticated user from a NextRequest.
 * Throws AuthError(401) if not authenticated.
 */
export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser> {
  const token =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new AuthError("A kéréshez bejelentkezés szükséges.", 401);
  }

  const impersonateId = req.cookies.get(IMPERSONATE_COOKIE_NAME)?.value;
  const sessionData = await validateSessionToken(token, impersonateId);

  if (!sessionData) {
    throw new AuthError("A munkamenet lejárt vagy érvénytelen. Kérjük, jelentkezz be újra.", 401);
  }

  return sessionData.user;
}

/**
 * Ensures the authenticated user has one of the required roles.
 * Throws AuthError(403) if role is insufficient.
 */
export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: Array<"admin" | "moderator" | "superuser" | "user">
): void {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("Nincs megfelelő jogosultságod a művelet végrehajtásához.", 403);
  }
}

/**
 * Ensures the user has a specific granular permission enabled.
 * Throws AuthError(403) if permission is denied.
 */
export function requirePermission(
  user: AuthenticatedUser,
  permissionKey: keyof UserPermissions
): void {
  // Admins always have all permissions
  if (user.role === "admin") {
    return;
  }

  const hasPerm = user.permissions && user.permissions[permissionKey];
  if (!hasPerm) {
    throw new AuthError(`Hiányzó jogosultság: ${String(permissionKey)}`, 403);
  }
}

/**
 * Helper to record an audit log in the persistent PostgreSQL database.
 * Never records passwords, payment secrets, or session tokens.
 */
export async function createAuditLog(options: {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, any>;
  req?: Request;
}): Promise<void> {
  try {
    const ipAddress = options.req ? getClientIp(options.req) : null;
    
    // Filter out any potential sensitive fields in details
    const sanitizedDetails = { ...(options.details || {}) };
    delete sanitizedDetails.password;
    delete sanitizedDetails.passwordHash;
    delete sanitizedDetails.token;
    delete sanitizedDetails.secret;
    delete sanitizedDetails.clientSecret;

    await prisma.auditLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        resource: options.resource,
        resourceId: options.resourceId || null,
        details: sanitizedDetails,
        ipAddress,
      },
    });
  } catch (err: any) {
    console.warn("Nem sikerült menteni az audit logot:", err.message);
  }
}
