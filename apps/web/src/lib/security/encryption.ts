import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits auth tag

function getEncryptionKey(): Buffer {
  const envKey = process.env.USER_DATA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("USER_DATA_ENCRYPTION_KEY környezeti változó nincs beállítva production környezetben!");
    }
    // Fallback key only for local dev/testing - 32 bytes hex
    return Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "hex");
  }

  // If 64-char hex string:
  if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }

  // Otherwise SHA-256 hash the key to guarantee 32 bytes
  return createHash("sha256").update(envKey).digest();
}

/**
 * Encrypts a string using AES-256-GCM.
 * Output format: iv:ciphertext:authTag (all hex)
 */
export function encryptData(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/**
 * Decrypts a ciphertext encrypted with AES-256-GCM.
 */
export function decryptData(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) {
      throw new Error("Érvénytelen titkosított formátum");
    }

    const [ivHex, ciphertextHex, authTagHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err: any) {
    console.error("Hiba a titkosított adat visszafejtésekor:", err.message);
    return "";
  }
}

export const encryptUserData = encryptData;
export const decryptUserData = decryptData;
