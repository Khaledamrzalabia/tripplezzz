import crypto from "crypto";
import { getPool } from "./db";
import type { Customer, Order } from "../types/order";

const CUSTOMER_SESSION_SECRET = process.env.CUSTOMER_SESSION_SECRET || "triplez-customer-secret-key-2026";

export function hashPassword(password: string): string {
  // PBKDF2 with 100,000 iterations and 64 bytes output
  const salt = process.env.PASSWORD_SALT || "triplez_prod_salt_2026_super_secure";
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export function createCustomerToken(customerId: string): string {
  const payload = `${customerId}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", CUSTOMER_SESSION_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64");
}

export function verifyCustomerToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf8");
    const [customerId, timestamp, sig] = raw.split(":");
    if (!customerId || !timestamp || !sig) return null;
    const expectedSig = crypto
      .createHmac("sha256", CUSTOMER_SESSION_SECRET)
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
