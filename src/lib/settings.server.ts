import fs from "fs";
import path from "path";
import { cacheTag } from "next/cache";
import { getPool, isPostgresConfigured } from "./db";
import {
  type StoreSettings,
  type SiteMediaSettings,
  type ContactSettings,
  DEFAULT_STORE_SETTINGS,
} from "../types/settings";
import defaultSettingsData from "../data/settings.json";

const DATA_FILE = path.join(process.cwd(), "src", "data", "settings.json");

/** Cache tag for getCachedStoreSettings(); invalidate it after every settings write */
export const STORE_SETTINGS_TAG = "store-settings";

// Media URLs must be site-relative paths, https URLs or inline images from the upload fallback
function isSafeMediaUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return (
    (v.startsWith("/") && !v.startsWith("//")) ||
    v.startsWith("https://") ||
    v.startsWith("data:image/")
  );
}

function pickMediaUrl(value: unknown, fallback: string): string {
  return isSafeMediaUrl(value) ? value.trim() : fallback;
}

function pickMediaList(value: unknown, fallback: string[]): string[] {
  const list = Array.isArray(value) ? value : [];
  return fallback.map((def, i) => pickMediaUrl(list[i], def));
}

function pickText(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function mergeMedia(input: Partial<SiteMediaSettings> | undefined, base: SiteMediaSettings): SiteMediaSettings {
  const m = input || {};
  return {
    logo: pickMediaUrl(m.logo, base.logo),
    favicon: pickMediaUrl(m.favicon, base.favicon),
    shareImage: pickMediaUrl(m.shareImage, base.shareImage),
    heroImage: pickMediaUrl(m.heroImage, base.heroImage),
    heroEyebrow: pickText(m.heroEyebrow, base.heroEyebrow),
    heroSubtitle: pickText(m.heroSubtitle, base.heroSubtitle),
    productsTitle: pickText(m.productsTitle, base.productsTitle),
    productsSubtitle: pickText(m.productsSubtitle, base.productsSubtitle),
    cultureImage: pickMediaUrl(m.cultureImage, base.cultureImage),
    craftImages: pickMediaList(m.craftImages, base.craftImages),
    communityImages: pickMediaList(m.communityImages, base.communityImages),
    aboutImage: pickMediaUrl(m.aboutImage, base.aboutImage),
    lookbookImages: pickMediaList(m.lookbookImages, base.lookbookImages),
  };
}

function mergeContact(input: Partial<ContactSettings> | undefined, base: ContactSettings): ContactSettings {
  const c = input || {};
  return {
    email: pickText(c.email, base.email),
    phone: pickText(c.phone, base.phone),
    whatsapp: typeof c.whatsapp === "string" ? c.whatsapp.replace(/\D/g, "") : base.whatsapp,
    address: pickText(c.address, base.address),
    workingHours: pickText(c.workingHours, base.workingHours),
    responseTime: pickText(c.responseTime, base.responseTime),
    intro: pickText(c.intro, base.intro),
  };
}

function getLocalSettings(): StoreSettings {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          payment: { ...DEFAULT_STORE_SETTINGS.payment, ...(parsed.payment || {}) },
          social: { ...DEFAULT_STORE_SETTINGS.social, ...(parsed.social || {}) },
          media: mergeMedia(parsed.media, DEFAULT_STORE_SETTINGS.media),
          contact: mergeContact(parsed.contact, DEFAULT_STORE_SETTINGS.contact),
        };
      }
    }
  } catch (err) {
    console.warn("Could not read local settings.json:", err);
  }

  const fallback = (defaultSettingsData as Partial<StoreSettings>) || {};
  return {
    payment: { ...DEFAULT_STORE_SETTINGS.payment, ...(fallback.payment || {}) },
    social: { ...DEFAULT_STORE_SETTINGS.social, ...(fallback.social || {}) },
    media: mergeMedia(fallback.media, DEFAULT_STORE_SETTINGS.media),
    contact: mergeContact(fallback.contact, DEFAULT_STORE_SETTINGS.contact),
  };
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
            media: mergeMedia(val.media, DEFAULT_STORE_SETTINGS.media),
            contact: mergeContact(val.contact, DEFAULT_STORE_SETTINGS.contact),
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
 * Cached read for the root layout, metadata and static pages (Cache Components).
 * Route handlers that write settings call revalidateTag(STORE_SETTINGS_TAG, { expire: 0 }).
 */
export async function getCachedStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(STORE_SETTINGS_TAG);
  return getStoreSettings();
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
    media: mergeMedia(newSettings.media, current.media),
    contact: mergeContact(newSettings.contact, current.contact),
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
 * Reset payment & social settings to defaults (homepage media and contact info are kept).
 */
export async function resetStoreSettings(): Promise<StoreSettings> {
  return updateStoreSettings({
    payment: DEFAULT_STORE_SETTINGS.payment,
    social: DEFAULT_STORE_SETTINGS.social,
  });
}
