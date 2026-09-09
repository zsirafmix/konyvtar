import bcrypt from "bcryptjs";
import { scryptSync, timingSafeEqual } from "node:crypto";

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with work factor 12.
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify a plain password against a stored hash (bcrypt or legacy scrypt).
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // 1. Bcrypt format ($2a$, $2b$, $2y$)
  if (storedHash.startsWith("$2")) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch {
      return false;
    }
  }

  // 2. Legacy scrypt format (salt:key)
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    return timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

