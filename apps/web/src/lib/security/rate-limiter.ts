/**
 * In-memory sliding window rate limiter for API endpoints
 */

interface RateLimitEntry {
  count: number;
  firstRequestTime: number;
  lastRequestTime: number;
}

const storage = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of storage.entries()) {
      if (now - entry.lastRequestTime > 3600 * 1000) {
        storage.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  windowMs: number; // Window duration in milliseconds
  maxRequests: number; // Max requests allowed per window
  identifier: string; // Unique key (e.g. action + IP or userId)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds?: number;
}

/**
 * Checks and increments rate limit for a given identifier.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { windowMs, maxRequests, identifier } = options;
  const now = Date.now();
  const entry = storage.get(identifier);

  if (!entry) {
    storage.set(identifier, {
      count: 1,
      firstRequestTime: now,
      lastRequestTime: now,
    });
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTimeMs: now + windowMs,
    };
  }

  // If window expired, reset
  if (now - entry.firstRequestTime > windowMs) {
    entry.count = 1;
    entry.firstRequestTime = now;
    entry.lastRequestTime = now;
    storage.set(identifier, entry);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTimeMs: now + windowMs,
    };
  }

  // Window is active
  entry.lastRequestTime = now;
  if (entry.count >= maxRequests) {
    const resetTimeMs = entry.firstRequestTime + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTimeMs,
      retryAfterSeconds,
    };
  }

  entry.count += 1;
  storage.set(identifier, entry);
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    resetTimeMs: entry.firstRequestTime + windowMs,
  };
}

/**
 * Helper to extract client IP from Next.js request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export const RATE_LIMIT_CONFIGS = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min (brute force protection)
  register: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 registers per hour
  chatMessage: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 messages per min (1 every 2s average)
  forumPost: { windowMs: 5 * 60 * 1000, maxRequests: 5 }, // 5 topics/posts per 5 min
  paymentVerify: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 verifications per hour
  aiQuery: { windowMs: 60 * 1000, maxRequests: 15 }, // 15 bursts per min
  download: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 downloads per min
};
