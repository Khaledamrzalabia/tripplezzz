import fs from "fs";
import path from "path";
import { getPool, isPostgresConfigured } from "./db";
import { EGYPT_GOVERNORATES, type GovernorateShipping } from "../types/order";
import defaultShippingRates from "../data/shipping.json";

const DATA_FILE = path.join(process.cwd(), "src", "data", "shipping.json");

// Helper to read local JSON safely
function getLocalShippingRates(): GovernorateShipping[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as GovernorateShipping[];
      }
    }
  } catch (err) {
    console.warn("Could not read local shipping.json, fallback to defaults:", err);
  }
  return (defaultShippingRates as GovernorateShipping[]) || EGYPT_GOVERNORATES;
}

// Helper to save local JSON safely
function saveLocalShippingRates(rates: GovernorateShipping[]): boolean {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return false;
  }
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(rates, null, 2), "utf-8");
    return true;
  } catch (err: any) {
    if (err?.code !== "EROFS") {
      console.warn("Could not write to local shipping.json:", err);
    }
    return false;
  }
}

// Ensure store_settings table exists
let settingsTableEnsured = false;
async function ensureSettingsTable(pool: any): Promise<void> {
  if (settingsTableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    settingsTableEnsured = true;
  } catch (err) {
    console.error("Failed to ensure store_settings table:", err);
  }
}

/**
 * Fetch current shipping rates configured by Admin.
 * Priority: PostgreSQL DB -> local shipping.json -> EGYPT_GOVERNORATES default.
 */
export async function getShippingRates(): Promise<GovernorateShipping[]> {
  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await ensureSettingsTable(pool);
        const res = await pool.query(
          "SELECT value FROM store_settings WHERE key = 'shipping_rates'"
        );
        if (res.rows.length > 0 && Array.isArray(res.rows[0].value)) {
          return res.rows[0].value as GovernorateShipping[];
        }
      } catch (err) {
        console.warn("Failed to fetch shipping_rates from DB, using fallback:", err);
      }
    }
  }

  return getLocalShippingRates();
}

/**
 * Update and persist shipping rates (Admin Action).
 * Saves to PostgreSQL DB and syncs to local JSON.
 */
export async function updateShippingRates(rates: GovernorateShipping[]): Promise<boolean> {
  // Clean and sanitize rates
  const cleaned: GovernorateShipping[] = rates.map((r) => ({
    en: String(r.en).trim(),
    ar: String(r.ar).trim(),
    shipping: Math.max(0, Math.round(Number(r.shipping) || 0)),
  }));

  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      // The database is the source of truth: a failed write must not be reported as saved
      await ensureSettingsTable(pool);
      await pool.query(
        `INSERT INTO store_settings (key, value, updated_at)
         VALUES ('shipping_rates', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET
           value = EXCLUDED.value,
           updated_at = NOW()`,
        [JSON.stringify(cleaned)]
      );
    }
  }

  saveLocalShippingRates(cleaned);
  return true;
}

/**
 * Reset shipping rates to original Egyptian standard defaults.
 */
export async function resetShippingRates(): Promise<GovernorateShipping[]> {
  await updateShippingRates(EGYPT_GOVERNORATES);
  return EGYPT_GOVERNORATES;
}
