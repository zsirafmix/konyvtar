import { createHmac, timingSafeEqual } from "node:crypto";

export interface SessionUser {
  id: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  membershipStatus: "FREE" | "SUPPORTER";
  displayName?: string;
  avatarUrl?: string;
}

export interface TokenPayload extends SessionUser {
  iat: number;
  exp: number;
}

const DEFAULT_SECRET = process.env.AUTH_SECRET || "librarian_default_secret_key_change_in_prod";

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf-8");
}

/**
 * Signs a payload into a secure HMAC-SHA256 JWT string.
 */
export function signToken(user: SessionUser, expiresInSeconds = 7 * 24 * 3600, secret = DEFAULT_SECRET): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    ...user,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const hmac = createHmac("sha256", secret);
  hmac.update(signatureInput);
  const signature = base64UrlEncode(hmac.digest("binary"));

  return `${signatureInput}.${signature}`;
}

/**
 * Verifies a JWT string and returns the decoded payload if valid and not expired.
 */
export function verifyToken(token: string, secret = DEFAULT_SECRET): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const hmac = createHmac("sha256", secret);
    hmac.update(signatureInput);
    const expectedSignature = base64UrlEncode(hmac.digest("binary"));

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
