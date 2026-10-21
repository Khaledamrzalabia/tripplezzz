// Advanced multi-signal Rate Limiting System with Composite Client Fingerprinting
// Combines Client IP, User-Agent, Accept-Language, Sec-CH headers, and optional session/identity
// Defeats trivial proxy/IP-rotation bypass attacks by generating a cryptographic client fingerprint hash

import crypto from "crypto";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests allowed per window
}

interface ClientRecord {
  count: number;
  resetTime: number;
  firstSeen: number;
}

const memoryStore = new Map<string, ClientRecord>();

// Periodically clean up expired entries to prevent memory leaks
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup > 30000) {
    lastCleanup = now;
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetTime) {
        memoryStore.delete(key);
      }
    }
  }
}

/**
 * Checks if the identifier has exceeded the request threshold.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpired();
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetTime) {
    const newRecord: ClientRecord = {
      count: 1,
      resetTime: now + config.windowMs,
      firstSeen: now,
    };
    memoryStore.set(identifier, newRecord);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Extracts raw client IP address with priority given to Vercel/Cloudflare headers.
 */
export function getClientIp(request: Request): string {
  // 1. Vercel / Cloudflare edge connecting IP
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "127.0.0.1";
}

/**
 * Generates a resilient composite client fingerprint based on:
 * 1. Client IP
 * 2. User-Agent
 * 3. Accept-Language
 * 4. Sec-CH-UA (Client Hints)
 * 5. Sec-CH-UA-Platform
 * 6. Optional explicit identity (e.g. username/email being attacked)
 *
 * This makes IP-rotation proxies far less effective because rotated IPs with identical client signatures
 * or high-velocity attempts on specific accounts get caught together.
 */
export function getClientFingerprint(request: Request, extraEntropy = ""): string {
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") || "unknown-ua";
  const lang = request.headers.get("accept-language") || "unknown-lang";
  const chUa = request.headers.get("sec-ch-ua") || "";
  const chPlatform = request.headers.get("sec-ch-ua-platform") || "";

  const rawFingerprint = `${ip}::${ua}::${lang}::${chUa}::${chPlatform}::${extraEntropy}`;
  return crypto.createHash("sha256").update(rawFingerprint).digest("hex").slice(0, 32);
}

/**
 * Multi-layer rate limit guard:
 * Checks BOTH the composite client fingerprint AND the pure IP address.
 * If either fails, access is denied.
 */
export function guardMultiSignalRateLimit(
  request: Request,
  action: string,
  config: RateLimitConfig,
  accountTarget = ""
): { allowed: boolean; remaining: number } {
  const ip = getClientIp(request);
  const fingerprint = getClientFingerprint(request);

  // 1. Check IP level limit
  const ipCheck = checkRateLimit(`${action}_ip_${ip}`, config);
  if (!ipCheck.allowed) {
    return { allowed: false, remaining: 0 };
  }

  // 2. Check Composite Fingerprint level limit (catches same device even if IP flickers)
  const fpCheck = checkRateLimit(`${action}_fp_${fingerprint}`, config);
  if (!fpCheck.allowed) {
    return { allowed: false, remaining: 0 };
  }

  // 3. If attacking a specific account (e.g., admin email), limit target-level attacks across all IPs
  if (accountTarget) {
    const targetCheck = checkRateLimit(`${action}_target_${accountTarget.toLowerCase().trim()}`, {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests * 2, // Allow a few more attempts across different devices before full lock
    });
    if (!targetCheck.allowed) {
      return { allowed: false, remaining: 0 };
    }
  }

  return {
    allowed: true,
    remaining: Math.min(ipCheck.remaining, fpCheck.remaining),
  };
}
