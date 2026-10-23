// Admin authentication: password hashing, signed session tokens and request verification.
// Every admin-only route handler must call `isAdminRequest()` instead of checking the cookie by hand.

import crypto from "crypto";
import { cookies } from "next/headers";
import { getPool } from "./db";

export const ADMIN_SESSION_COOKIE = "tz_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const ADMIN_MIN_PASSWORD_LENGTH = 12;

const SCRYPT_KEYLEN = 64;

// Derives a secure 256-bit signing key from ADMIN_SESSION_SECRET or CUSTOMER_SESSION_SECRET.
function getSessionSecret(): string | null {
  const secret = (process.env.ADMIN_SESSION_SECRET || "").trim();
  if (secret.length >= 32) return secret;
  if (secret.length > 0) {
    return crypto.createHash("sha256").update(secret).digest("hex");
  }

  // Fallback to customer session secret if configured
  const customer = (process.env.CUSTOMER_SESSION_SECRET || "").trim();
  if (customer.length >= 32) {
    return crypto.createHmac("sha256", customer).update("admin-session-fallback").digest("hex");
  }
  if (customer.length > 0) {
    return crypto.createHash("sha256").update(customer).digest("hex");
  }

  return null;
}

export function getBootstrapAdmin(): { email: string; password: string } | null {
  const email = (process.env.ADMIN_USERNAME || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < ADMIN_MIN_PASSWORD_LENGTH) return null;
  return { email, password };
}

export function isAdminAuthConfigured(): boolean {
  return getSessionSecret() !== null;
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}

// ---------- Password hashing (scrypt with per-user random salt) ----------

export function hashAdminPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

// Supports the new scrypt format and the legacy unsalted SHA-256 hex format.
export function verifyAdminPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith("scrypt$")) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
    return safeEqual(candidate, hash);
  }
  const legacy = crypto.createHash("sha256").update(password).digest("hex");
  return safeEqual(legacy, stored);
}

export function isLegacyAdminHash(stored: string): boolean {
  return !stored.startsWith("scrypt$");
}

// ---------- Admin user lookup ----------

export async function getStoredAdminHash(email: string): Promise<string | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const { rows } = await pool.query(
      "SELECT password_hash FROM public.admin_users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email]
    );
    return rows.length > 0 ? String(rows[0].password_hash) : null;
  } catch (err) {
    // Table may not exist yet before the first password change
    console.warn("admin_users lookup failed:", err);
    return null;
  }
}

/**
 * Credential "version" for an admin. It is embedded in the session token so that
 * changing the password invalidates every existing session.
 * Once an admin row exists in the database, the env bootstrap password no longer applies.
 */
async function getCredentialVersion(email: string): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const storedHash = await getStoredAdminHash(email);
  let material: string | null = storedHash ? `db:${storedHash}` : null;

  if (!material) {
    const bootstrap = getBootstrapAdmin();
    if (bootstrap && bootstrap.email === email.toLowerCase()) {
      material = `env:${bootstrap.password}`;
    }
  }
  if (!material) return null;

  return crypto.createHmac("sha256", secret).update(material).digest("hex").slice(0, 32);
}

// ---------- Session tokens ----------

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function createAdminSessionToken(email: string): Promise<string | null> {
  const secret = getSessionSecret();
  const version = await getCredentialVersion(email);
  if (!secret || !version) return null;

  const payload = [
    Buffer.from(email.toLowerCase()).toString("base64url"),
    Date.now().toString(),
    crypto.randomBytes(16).toString("hex"),
    version,
  ].join(".");
  return `${payload}.${sign(payload, secret)}`;
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const [emailB64, issuedAt, , version, sig] = parts;
  const payload = parts.slice(0, 4).join(".");

  if (!safeEqual(sig, sign(payload, secret))) return null;

  const issued = Number(issuedAt);
  if (!Number.isFinite(issued) || Date.now() - issued > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) {
    return null;
  }

  const email = Buffer.from(emailB64, "base64url").toString("utf8");
  const currentVersion = await getCredentialVersion(email);
  if (!currentVersion || !safeEqual(version, currentVersion)) return null;

  return email;
}

/** Returns the authenticated admin email, or null. Use in every admin-only route handler. */
export async function getAdminFromRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function isAdminRequest(): Promise<boolean> {
  return (await getAdminFromRequest()) !== null;
}

export function adminSessionCookieOptions(value: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}
