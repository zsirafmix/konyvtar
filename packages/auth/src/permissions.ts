export type Role = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
export type MembershipStatus = "FREE" | "SUPPORTER";
export type DistributionStatus = "PRIVATE" | "PUBLIC_DOMAIN" | "LICENSED" | "CREATOR_AUTHORIZED" | "RESTRICTED";

export interface UserContext {
  id: string;
  role: Role;
  membershipStatus?: MembershipStatus;
  permissions?: Partial<UserPermissions>;
}

export interface UserPermissions {
  canDownload: boolean;
  canDirectDownload: boolean;
  canUploadPrivate: boolean;
  canModerate: boolean;
  canAdmin: boolean;
  canUseChat: boolean;
  canSendChatMessages: boolean;
  canCreateChatRooms: boolean;
  canModerateChat: boolean;
  aiDailyLimit: number;
}

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, UserPermissions> = {
  USER: {
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
  MODERATOR: {
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
  ADMIN: {
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
  SUPER_ADMIN: {
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
};

export const SUPERUSER_DEFAULT_PERMISSIONS: Partial<UserPermissions> = {
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
};

export interface BookEditionContext {
  id: string;
  bookId: string;
  distributionStatus: DistributionStatus;
  libraryReleaseAt: Date | string;
  ownerUserId?: string | null;
}

export interface FileAssetContext {
  id: string;
  editionId: string;
  distributionStatus?: DistributionStatus;
}

export interface DownloadEntitlementResult {
  allowed: boolean;
  reason: string;
  isPrivate: boolean;
  daysRemaining?: number;
  hoursRemaining?: number;
  availableAt?: Date;
}

/**
 * Check if a user has at least the required role in the hierarchy.
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    USER: 1,
    MODERATOR: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

export function canAccessAdmin(user: UserContext): boolean {
  if (user.permissions?.canAdmin !== undefined) {
    return user.permissions.canAdmin;
  }
  return hasMinimumRole(user.role, "ADMIN");
}

export function canModerate(user: UserContext): boolean {
  if (user.permissions?.canModerate !== undefined) {
    return user.permissions.canModerate;
  }
  return hasMinimumRole(user.role, "MODERATOR");
}

export function canManageRights(user: UserContext): boolean {
  return hasMinimumRole(user.role, "ADMIN");
}

export function canUseChat(user: UserContext): boolean {
  if (user.permissions?.canUseChat !== undefined) {
    return user.permissions.canUseChat;
  }
  return true;
}

export function canSendChatMessages(user: UserContext): boolean {
  if (user.permissions?.canSendChatMessages !== undefined) {
    return user.permissions.canSendChatMessages;
  }
  return true;
}

export function canCreateChatRooms(user: UserContext): boolean {
  if (user.permissions?.canCreateChatRooms !== undefined) {
    return user.permissions.canCreateChatRooms;
  }
  return user.membershipStatus === "SUPPORTER" || hasMinimumRole(user.role, "MODERATOR");
}

export function canModerateChat(user: UserContext): boolean {
  if (user.permissions?.canModerateChat !== undefined) {
    return user.permissions.canModerateChat;
  }
  return hasMinimumRole(user.role, "MODERATOR");
}

export function hasPermission(user: UserContext, perm: keyof UserPermissions): boolean {
  if (!user) return false;
  if (user.permissions && typeof user.permissions[perm] === "boolean") {
    return user.permissions[perm] as boolean;
  }
  const defaultPerms = ROLE_DEFAULT_PERMISSIONS[user.role] || ROLE_DEFAULT_PERMISSIONS.USER;
  return !!defaultPerms[perm];
}

export function normalizeRole(role: Role | string, membershipStatus?: string): "admin" | "moderator" | "superuser" | "user" {
  if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "admin") return "admin";
  if (role === "MODERATOR" || role === "moderator") return "moderator";
  if (membershipStatus === "SUPPORTER" || role === "superuser") return "superuser";
  return "user";
}

/**
 * 21-day rule constant in milliseconds (21 days * 24 hours * 60 minutes * 60 seconds * 1000 ms)
 */
export const FREE_MEMBER_DELAY_MS = 21 * 24 * 60 * 60 * 1000;

/**
 * Central legal & entitlement checker for book downloads.
 * 
 * Rules:
 * 1. Private files: ONLY the owner user can download. Other users receive DENIED.
 * 2. Restricted files: DENIED for everyone (unless admin).
 * 3. Public Domain, Licensed, or Creator Authorized:
 *    - Supporter: Instant access starting from libraryReleaseAt.
 *    - Free member: 21-day waiting period from libraryReleaseAt.
 */
export function canUserDownload(
  user: UserContext | null | undefined,
  edition: BookEditionContext,
  fileAsset?: FileAssetContext
): DownloadEntitlementResult {
  if (!user) {
    return {
      allowed: false,
      reason: "A letöltéshez bejelentkezés szükséges.",
      isPrivate: false,
    };
  }

  // Determine effective distribution status (file status overrides or edition status)
  const distStatus = fileAsset?.distributionStatus || edition.distributionStatus;

  // 1. Private file check
  if (distStatus === "PRIVATE") {
    const isOwner = !!edition.ownerUserId && edition.ownerUserId === user.id;
    if (isOwner) {
      return {
        allowed: true,
        reason: "Saját privát könyvfájl letöltése engedélyezve.",
        isPrivate: true,
      };
    }
    return {
      allowed: false,
      reason: "Ez a fájl privát, és kizárólag a feltöltő tulajdonos számára tölthető le.",
      isPrivate: true,
    };
  }

  // 2. Restricted content check
  if (distStatus === "RESTRICTED") {
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      return {
        allowed: true,
        reason: "Adminisztrátori felülbírálat: korlátozott terjesztésű fájl hozzáférés engedélyezve.",
        isPrivate: false,
      };
    }
    return {
      allowed: false,
      reason: "Ez a kiadás terjesztési korlátozás alá esik, nem tölthető le.",
      isPrivate: false,
    };
  }

  // 3. Distributable content (PUBLIC_DOMAIN, LICENSED, CREATOR_AUTHORIZED)
  const isSupporter = user.membershipStatus === "SUPPORTER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (isSupporter) {
    return {
      allowed: true,
      reason: "Támogatói tagságoddal azonnal hozzáférsz az összes terjeszthető könyvhöz.",
      isPrivate: false,
      daysRemaining: 0,
    };
  }

  // Free member logic: 21-day rule
  const releaseDate = new Date(edition.libraryReleaseAt);
  const availableAt = new Date(releaseDate.getTime() + FREE_MEMBER_DELAY_MS);
  const now = new Date();

  if (now.getTime() >= availableAt.getTime()) {
    return {
      allowed: true,
      reason: "A 21 napos várakozási idő letelt, a könyv ingyenesen letölthető.",
      isPrivate: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      availableAt,
    };
  }

  // Still within 21-day window
  const diffMs = availableAt.getTime() - now.getTime();
  const daysRemaining = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  return {
    allowed: false,
    reason: `Ez az új könyv jelenleg a 21 napos támogatói periódusban van. Ingyenes tagoknak elérhető: ${daysRemaining} nap ${hoursRemaining} óra múlva. Támogasd a könyvtárat az azonnali hozzáférésért!`,
    isPrivate: false,
    daysRemaining,
    hoursRemaining,
    availableAt,
  };
}
