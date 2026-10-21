import fs from "fs";
import path from "path";
import type { Product } from "../types/product";
import defaultProducts from "../data/products.json";
import {
  getPool,
  isPostgresConfigured,
  ensureProductsTable,
  rowToProduct,
} from "./db";
import {
  supabaseAdmin,
  isSupabaseConfigured,
  mapDbRecordToProduct,
  mapProductToDbRecord,
} from "./supabase";

const DATA_FILE = path.join(process.cwd(), "src", "data", "products.json");

// Helper to read local JSON
function getLocalProducts(): Product[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw) as Product[];
    }
  } catch (err) {
    console.error("Error reading local products JSON:", err);
  }
  return (defaultProducts as unknown) as Product[];
}

// Helper to save local JSON safely (respects serverless read-only filesystems)
function saveLocalProducts(products: Product[]): boolean {
  // Serverless environments (like Vercel / AWS Lambda) have read-only filesystems (EROFS)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return false;
  }

  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
    return true;
  } catch (err: any) {
    if (err?.code !== "EROFS") {
      console.error("Failed to save products to local disk:", err);
    }
    return false;
  }
}

// Check if any database (Direct Pooler or Supabase API) is configured
export function isAnyDatabaseConfigured(): boolean {
  return isPostgresConfigured || isSupabaseConfigured;
}

// Helper to upsert product in PostgreSQL pool
async function upsertProductInPostgres(pool: any, product: Product): Promise<void> {
  const query = `
    INSERT INTO products (
      id, slug, name, description, long_description, price, currency,
      images, category, collection, sizes, colors, availability,
      is_blurred, featured, is_placeholder,
      craft_specs, fit_silhouette, garment_care
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13,
      $14, $15, $16,
      $17, $18, $19
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      long_description = EXCLUDED.long_description,
      price = EXCLUDED.price,
      currency = EXCLUDED.currency,
      images = EXCLUDED.images,
      category = EXCLUDED.category,
      collection = EXCLUDED.collection,
      sizes = EXCLUDED.sizes,
      colors = EXCLUDED.colors,
      availability = EXCLUDED.availability,
      is_blurred = EXCLUDED.is_blurred,
      featured = EXCLUDED.featured,
      is_placeholder = EXCLUDED.is_placeholder,
      craft_specs = EXCLUDED.craft_specs,
      fit_silhouette = EXCLUDED.fit_silhouette,
      garment_care = EXCLUDED.garment_care,
      updated_at = NOW();
  `;
  const values = [
    product.id,
    product.slug,
    product.name,
    product.description || "",
    product.longDescription || product.description || "",
    product.price ?? null,
    product.currency || "USD",
    JSON.stringify(product.images || []),
    product.category,
    product.collection || "core",
    JSON.stringify(product.sizes || []),
    JSON.stringify(product.colors || []),
    product.availability || "in-stock",
    Boolean(product.isBlurred),
    Boolean(product.featured),
    Boolean(product.isPlaceholder),
    JSON.stringify(product.craftSpecs || []),
    product.fitSilhouette || "",
    product.garmentCare || "",
  ];

  await pool.query(query, values);
}

// Async server getter: Uses Direct PostgreSQL Pooler if configured, else Supabase API, else local JSON
export async function getAsyncServerProducts(): Promise<Product[]> {
  // 1. Direct PostgreSQL Pooler (Host, Port, User, Password / DATABASE_URL)
  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await ensureProductsTable();
        const res = await pool.query(
          "SELECT * FROM products ORDER BY created_at DESC"
        );
        if (res.rows && res.rows.length > 0) {
          return res.rows.map(rowToProduct);
        } else {
          return [];
        }
      } catch (err) {
        console.warn("Direct PostgreSQL query error, trying fallback:", err);
      }
    }
  }

  // 2. Supabase SDK (if URL & Key are provided)
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(mapDbRecordToProduct);
      }
    } catch (err) {
      console.warn("Supabase query error:", err);
    }
  }

  // 3. Fallback to Local JSON store
  return getLocalProducts();
}

// Synchronous getter for SSG/static metadata
export function getServerProducts(): Product[] {
  return getLocalProducts();
}

// Create Product: Direct PostgreSQL + Supabase + Local sync
export async function createServerProduct(product: Product): Promise<boolean> {
  // 1. Direct PostgreSQL Pooler
  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await ensureProductsTable();
        await upsertProductInPostgres(pool, product);
      } catch (err) {
        console.error("Direct PostgreSQL insert error:", err);
      }
    }
  }

  // 2. Supabase SDK
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const dbRecord = mapProductToDbRecord(product);
      await supabaseAdmin.from("products").upsert(dbRecord);
    } catch (err) {
      console.error("Supabase insert error:", err);
    }
  }

  // Keep local JSON updated if writable
  const localList = getLocalProducts();
  const updated = [product, ...localList.filter((p) => p.id !== product.id)];
  saveLocalProducts(updated);

  return true;
}

// Update Product: Direct PostgreSQL + Supabase + Local sync
export async function updateServerProduct(
  id: string,
  updatedFields: Partial<Product>
): Promise<Product | null> {
  const currentList = await getAsyncServerProducts();
  const index = currentList.findIndex((p) => p.id === id || p.slug === id);
  if (index === -1) return null;

  const targetId = currentList[index].id;
  const mergedProduct: Product = {
    ...currentList[index],
    ...updatedFields,
    id: targetId,
  };

  // 1. Direct PostgreSQL Pooler
  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await ensureProductsTable();
        await upsertProductInPostgres(pool, mergedProduct);
      } catch (err) {
        console.error("Direct PostgreSQL update error:", err);
      }
    }
  }

  // 2. Supabase SDK
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const dbRecord = mapProductToDbRecord(mergedProduct);
      await supabaseAdmin.from("products").upsert(dbRecord);
    } catch (err) {
      console.error("Supabase update error:", err);
    }
  }

  // Keep local JSON updated if writable
  const updatedList = currentList.map((p) => (p.id === targetId ? mergedProduct : p));
  saveLocalProducts(updatedList);

  return mergedProduct;
}

// Delete Product: Direct PostgreSQL + Supabase + Local sync
export async function deleteServerProduct(id: string): Promise<boolean> {
  // 1. Direct PostgreSQL Pooler
  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await pool.query("DELETE FROM products WHERE id = $1 OR slug = $1", [id]);
      } catch (err) {
        console.error("Direct PostgreSQL delete error:", err);
      }
    }
  }

  // 2. Supabase SDK
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      await supabaseAdmin.from("products").delete().or(`id.eq.${id},slug.eq.${id}`);
    } catch (err) {
      console.error("Supabase delete error:", err);
    }
  }

  const localList = getLocalProducts();
  const filtered = localList.filter((p) => p.id !== id && p.slug !== id);
  saveLocalProducts(filtered);

  return true;
}

// Legacy saveServerProducts export
export function saveServerProducts(products: Product[]): boolean {
  return saveLocalProducts(products);
}
