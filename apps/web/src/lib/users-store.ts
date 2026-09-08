import fs from "fs";
import path from "path";

export type UserRole = "admin" | "moderator" | "superuser" | "user";

export interface UserPermissions {
  canDownload: boolean;
  canDirectDownload: boolean;
  canUploadPrivate: boolean;
  canModerate: boolean;
  canAdmin: boolean;
  aiDailyLimit: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  membershipStatus: "FREE" | "SUPPORTER";
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  permissions: UserPermissions;
  stats: {
    booksRead: number;
    downloadsCount: number;
    contributedUSD: number;
  };
}

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canDownload: true,
    canDirectDownload: true,
    canUploadPrivate: true,
    canModerate: true,
    canAdmin: true,
    aiDailyLimit: 9999,
  },
  moderator: {
    canDownload: true,
    canDirectDownload: true,
    canUploadPrivate: true,
    canModerate: true,
    canAdmin: false,
    aiDailyLimit: 500,
  },
  superuser: {
    canDownload: true,
    canDirectDownload: true,
    canUploadPrivate: true,
    canModerate: false,
    canAdmin: false,
    aiDailyLimit: 1000,
  },
  user: {
    canDownload: true,
    canDirectDownload: false,
    canUploadPrivate: false,
    canModerate: false,
    canAdmin: false,
    aiDailyLimit: 20,
  },
};

const INITIAL_USERS: UserRecord[] = [
  {
    id: "usr_admin_01",
    name: "Főadminisztrátor",
    email: "admin@konyvtar.hu",
    role: "admin",
    membershipStatus: "SUPPORTER",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-09-08T12:00:00.000Z",
    avatarUrl: "/avatars/admin.png",
    permissions: { ...DEFAULT_PERMISSIONS.admin },
    stats: { booksRead: 142, downloadsCount: 380, contributedUSD: 50 },
  },
  {
    id: "usr_mod_01",
    name: "Kovács Péter (Moderátor)",
    email: "moderator@konyvtar.hu",
    role: "moderator",
    membershipStatus: "SUPPORTER",
    createdAt: "2026-02-15T10:00:00.000Z",
    updatedAt: "2026-09-08T12:00:00.000Z",
    avatarUrl: "/avatars/mod.png",
    permissions: { ...DEFAULT_PERMISSIONS.moderator },
    stats: { booksRead: 68, downloadsCount: 94, contributedUSD: 15 },
  },
  {
    id: "usr_super_01",
    name: "Nagy Anna (1$ Támogató)",
    email: "anna.tamogato@gmail.com",
    role: "superuser",
    membershipStatus: "SUPPORTER",
    createdAt: "2026-05-10T14:30:00.000Z",
    updatedAt: "2026-09-08T12:00:00.000Z",
    avatarUrl: "/avatars/super.png",
    permissions: { ...DEFAULT_PERMISSIONS.superuser },
    stats: { booksRead: 54, downloadsCount: 112, contributedUSD: 1 },
  },
  {
    id: "usr_user_01",
    name: "Tóth Bence (Olvasó)",
    email: "bence.olvaso@freemail.hu",
    role: "user",
    membershipStatus: "FREE",
    createdAt: "2026-07-20T09:15:00.000Z",
    updatedAt: "2026-09-08T12:00:00.000Z",
    avatarUrl: "/avatars/user.png",
    permissions: { ...DEFAULT_PERMISSIONS.user },
    stats: { booksRead: 12, downloadsCount: 22, contributedUSD: 0 },
  },
  {
    id: "usr_user_02",
    name: "Szabó Eszter (Látogató)",
    email: "eszter.latogato@citromail.hu",
    role: "user",
    membershipStatus: "FREE",
    createdAt: "2026-08-01T16:45:00.000Z",
    updatedAt: "2026-09-08T12:00:00.000Z",
    avatarUrl: "/avatars/user.png",
    permissions: { ...DEFAULT_PERMISSIONS.user },
    stats: { booksRead: 4, downloadsCount: 6, contributedUSD: 0 },
  },
];

const DB_PATH = path.join("/tmp", "librarian_users_db.json");

let usersCache: UserRecord[] | null = null;
let activeUserId: string = "usr_admin_01";

function loadUsers(): UserRecord[] {
  if (usersCache) return usersCache;

  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        usersCache = parsed;
        return usersCache!;
      }
    }
  } catch (err) {
    console.warn("Nem sikerült betölteni a users DB-t a lemezről, inicializálás alapértelmezettekkel:", err);
  }

  usersCache = [...INITIAL_USERS];
  saveUsers(usersCache);
  return usersCache;
}

function saveUsers(users: UserRecord[]): void {
  usersCache = users;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.warn("Nem sikerült menteni a users DB-t:", err);
  }
}

export function getAllUsers(): UserRecord[] {
  return loadUsers();
}

export function getUserById(id: string): UserRecord | undefined {
  const users = loadUsers();
  return users.find((u) => u.id === id);
}

export function getUserByEmail(email: string): UserRecord | undefined {
  const users = loadUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getActiveUser(requestedId?: string | null): UserRecord {
  const users = loadUsers();
  if (requestedId) {
    const found = users.find((u) => u.id === requestedId);
    if (found) return found;
  }
  const current = users.find((u) => u.id === activeUserId);
  return current || users[0];
}

export function setActiveUserId(id: string): UserRecord | null {
  const user = getUserById(id);
  if (user) {
    activeUserId = id;
    return user;
  }
  return null;
}

export function createUser(data: {
  name: string;
  email: string;
  role?: UserRole;
  permissions?: Partial<UserPermissions>;
}): UserRecord {
  const users = loadUsers();
  const role = data.role || "user";
  const defaultPerms = DEFAULT_PERMISSIONS[role];
  const permissions: UserPermissions = {
    ...defaultPerms,
    ...(data.permissions || {}),
  };

  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: data.name.trim() || "Névtelen Felhasználó",
    email: data.email.trim().toLowerCase(),
    role,
    membershipStatus: role === "superuser" || role === "admin" || role === "moderator" ? "SUPPORTER" : "FREE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    permissions,
    stats: {
      booksRead: 0,
      downloadsCount: 0,
      contributedUSD: role === "superuser" ? 1 : 0,
    },
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(id: string, updates: {
  name?: string;
  email?: string;
  role?: UserRole;
  membershipStatus?: "FREE" | "SUPPORTER";
  permissions?: Partial<UserPermissions>;
  stats?: Partial<UserRecord["stats"]>;
}): UserRecord | null {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  const existing = users[idx];
  const newRole = updates.role || existing.role;

  let mergedPermissions = existing.permissions;
  if (updates.role && updates.role !== existing.role && !updates.permissions) {
    mergedPermissions = { ...DEFAULT_PERMISSIONS[updates.role] };
  } else if (updates.permissions) {
    mergedPermissions = { ...existing.permissions, ...updates.permissions };
  }

  const updated: UserRecord = {
    ...existing,
    name: updates.name !== undefined ? updates.name : existing.name,
    email: updates.email !== undefined ? updates.email : existing.email,
    role: newRole,
    membershipStatus: updates.membershipStatus !== undefined
      ? updates.membershipStatus
      : (newRole === "superuser" || newRole === "admin" || newRole === "moderator" ? "SUPPORTER" : existing.membershipStatus),
    permissions: mergedPermissions,
    stats: updates.stats ? { ...existing.stats, ...updates.stats } : existing.stats,
    updatedAt: new Date().toISOString(),
  };

  users[idx] = updated;
  saveUsers(users);
  return updated;
}

export function deleteUser(id: string): boolean {
  if (id === "usr_admin_01") return false;
  const users = loadUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
}

export function promoteToSuperuser(userIdOrEmail: string, contributedAmountUSD: number = 1): UserRecord | null {
  const users = loadUsers();
  const user = users.find(
    (u) => u.id === userIdOrEmail || u.email.toLowerCase() === userIdOrEmail.toLowerCase()
  );

  if (!user) {
    return createUser({
      email: userIdOrEmail,
      name: userIdOrEmail.split("@")[0] || "Támogató Superuser",
      role: "superuser",
      permissions: {
        ...DEFAULT_PERMISSIONS.superuser,
      },
    });
  }

  return updateUser(user.id, {
    role: user.role === "admin" ? "admin" : "superuser",
    membershipStatus: "SUPPORTER",
    permissions: {
      canDownload: true,
      canDirectDownload: true,
      canUploadPrivate: true,
      aiDailyLimit: Math.max(user.permissions.aiDailyLimit, 1000),
    },
    stats: {
      ...user.stats,
      contributedUSD: (user.stats.contributedUSD || 0) + contributedAmountUSD,
    },
  });
}
