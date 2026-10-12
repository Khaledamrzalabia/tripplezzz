import fs from "fs";
import path from "path";
import { getPool, isPostgresConfigured } from "./db";
import {
  type StoreSettings,
  DEFAULT_STORE_SETTINGS,
} from "../types/settings";
import defaultSettingsData from "../data/settings.json";

const DATA_FILE = path.join(process.cwd(), "src", "data", "settings.json");

function getLocalSettings(): StoreSettings {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          payment: { ...DEFAULT_STORE_SETTINGS.payment, ...(parsed.payment || {}) },
          social: { ...DEFAULT_STORE_SETTINGS.social, ...(parsed.social || {}) },
        };
      }
    }
  } catch (err) {
    console.warn("Could not read local settings.json:", err);
  }

  return (defaultSettingsData as StoreSettings) || DEFAULT_STORE_SETTINGS;
}

function saveLocalSettings(settings: StoreSettings): boolean {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return false;
  }
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2), "utf-8");
    return true;
  } catch (err: any) {
    if (err?.code !== "EROFS") {
      console.warn("Could not write to local settings.json:", err);
    }
    return false;
  }
}

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
 * Fetch active store settings (Payments & Socials).
 * Priority: PostgreSQL DB -> local settings.json -> DEFAULT_STORE_SETTINGS.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await ensureSettingsTable(pool);
        const res = await pool.query(
          "SELECT value FROM store_settings WHERE key = 'store_config'"
        );
        if (res.rows.length > 0 && res.rows[0].value) {
          const val = res.rows[0].value;
          return {
            payment: {
              vodafoneCash: {
                ...DEFAULT_STORE_SETTINGS.payment.vodafoneCash,
                ...(val.payment?.vodafoneCash || {}),
              },
              instapay: {
                ...DEFAULT_STORE_SETTINGS.payment.instapay,
                ...(val.payment?.instapay || {}),
              },
              paypal: {
                ...DEFAULT_STORE_SETTINGS.payment.paypal,
                ...(val.payment?.paypal || {}),
              },
            },
            social: {
              ...DEFAULT_STORE_SETTINGS.social,
              ...(val.social || {}),
            },
          };
        }
      } catch (err) {
        console.warn("Failed to fetch store_config from DB, using fallback:", err);
      }
    }
  }

  return getLocalSettings();
}

/**
 * Update and persist store settings (Admin action).
 */
export async function updateStoreSettings(newSettings: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings();

  const merged: StoreSettings = {
    payment: {
      vodafoneCash: {
        number: String(newSettings.payment?.vodafoneCash?.number ?? current.payment.vodafoneCash.number).trim(),
        accountName: String(newSettings.payment?.vodafoneCash?.accountName ?? current.payment.vodafoneCash.accountName).trim(),
        enabled: Boolean(newSettings.payment?.vodafoneCash?.enabled ?? current.payment.vodafoneCash.enabled),
      },
      instapay: {
        ipa: String(newSettings.payment?.instapay?.ipa ?? current.payment.instapay.ipa).trim(),
        link: String(newSettings.payment?.instapay?.link ?? current.payment.instapay.link).trim(),
        accountName: String(newSettings.payment?.instapay?.accountName ?? current.payment.instapay.accountName).trim(),
        enabled: Boolean(newSettings.payment?.instapay?.enabled ?? current.payment.instapay.enabled),
      },
      paypal: {
        email: String(newSettings.payment?.paypal?.email ?? current.payment.paypal.email).trim(),
        link: String(newSettings.payment?.paypal?.link ?? current.payment.paypal.link).trim(),
        enabled: Boolean(newSettings.payment?.paypal?.enabled ?? current.payment.paypal.enabled),
      },
    },
    social: {
      instagram: String(newSettings.social?.instagram ?? current.social.instagram).trim(),
      instagramDm: String(newSettings.social?.instagramDm ?? current.social.instagramDm).trim(),
      tiktok: String(newSettings.social?.tiktok ?? current.social.tiktok).trim(),
      whatsapp: String(newSettings.social?.whatsapp ?? current.social.whatsapp).trim(),
      facebook: String(newSettings.social?.facebook ?? current.social.facebook).trim(),
      x: String(newSettings.social?.x ?? current.social.x).trim(),
      youtube: String(newSettings.social?.youtube ?? current.social.youtube).trim(),
    },
  };

  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await ensureSettingsTable(pool);
        await pool.query(
          `INSERT INTO store_settings (key, value, updated_at)
           VALUES ('store_config', $1::jsonb, NOW())
           ON CONFLICT (key) DO UPDATE SET
             value = EXCLUDED.value,
             updated_at = NOW()`,
          [JSON.stringify(merged)]
        );
      } catch (err) {
        console.error("Failed to persist store_config in DB:", err);
      }
    }
  }

  saveLocalSettings(merged);
  return merged;
}

/**
 * Reset store settings to defaults.
 */
export async function resetStoreSettings(): Promise<StoreSettings> {
  return updateStoreSettings(DEFAULT_STORE_SETTINGS);
}
