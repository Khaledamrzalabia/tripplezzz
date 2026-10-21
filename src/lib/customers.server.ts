import crypto from "crypto";
import { getPool } from "./db";
import type { Customer, Order } from "../types/order";

// No public default: use CUSTOMER_SESSION_SECRET, or derive one from ADMIN_SESSION_SECRET.
// With neither set, customer sessions are disabled instead of being signed with a known key.
function getSessionSecret(): string | null {
  const own = process.env.CUSTOMER_SESSION_SECRET || "";
  if (own.length >= 32) return own;
  const admin = process.env.ADMIN_SESSION_SECRET || "";
  if (admin.length >= 32) return crypto.createHmac("sha256", admin).update("customer-session").digest("hex");
  return null;
}

const PBKDF2_ITERATIONS = 100000;

// Old accounts were hashed with one shared salt; kept only to verify (and then upgrade) them
function legacyHash(password: string): string {
  const salt = process.env.PASSWORD_SALT || "triplez_prod_salt_2026_super_secure";
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
}

/** PBKDF2-SHA512 with a random salt per customer, stored as "pbkdf2$<salt>$<hash>" */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  return `pbkdf2$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  let candidate: string;
  let expected: string;
  if (stored.startsWith("pbkdf2$")) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    candidate = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
    expected = hash;
  } else {
    candidate = legacyHash(password);
    expected = stored;
  }
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isLegacyPasswordHash(stored: string): boolean {
  return !stored.startsWith("pbkdf2$");
}

export function createCustomerToken(customerId: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const payload = `${customerId}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64");
}

export function verifyCustomerToken(token: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  try {
    const raw = Buffer.from(token, "base64").toString("utf8");
    const [customerId, timestamp, sig] = raw.split(":");
    if (!customerId || !timestamp || !sig) return null;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${customerId}:${timestamp}`)
      .digest("hex");
    
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    // 30 days expiry
    if (Date.now() - Number(timestamp) > 30 * 24 * 60 * 60 * 1000) return null;
    return customerId;
  } catch {
    return null;
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const pool = getPool();
  if (!pool) return null;
  const res = await pool.query(
    "SELECT id, full_name, email, phone, whatsapp, governorate, city, address, created_at FROM customers WHERE id = $1 LIMIT 1",
    [id]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    whatsapp: r.whatsapp,
    governorate: r.governorate,
    city: r.city,
    address: r.address,
    createdAt: r.created_at,
  };
}

export async function getCustomerByEmail(email: string): Promise<{ customer: Customer; passwordHash: string } | null> {
  const pool = getPool();
  if (!pool) return null;
  const res = await pool.query(
    "SELECT id, full_name, email, password_hash, phone, whatsapp, governorate, city, address, created_at FROM customers WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email.trim()]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    customer: {
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      whatsapp: r.whatsapp,
      governorate: r.governorate,
      city: r.city,
      address: r.address,
      createdAt: r.created_at,
    },
    passwordHash: r.password_hash,
  };
}
