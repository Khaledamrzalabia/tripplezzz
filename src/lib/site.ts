// Public base URL of the store, used for absolute links (metadata, sitemap, robots, JSON-LD)
export const SITE_URL = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://triplezzz.vercel.app")
).replace(/\/+$/, "");

/** Turns "/products/x.webp" or an already absolute URL into an absolute URL on the store's domain */
export function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_URL).toString();
}
