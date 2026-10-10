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

// Helper to save local JSON
function saveLocalProducts(products: Product[]): boolean {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to save products to local disk:", err);
    return false;
  }
}

// Check if any database (Direct Pooler or Supabase API) is configured
export function isAnyDatabaseConfigured(): boolean {
  return isPostgresConfigured || isSupabaseConfigured;
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

// Create Product: Direct PostgreSQL + Local sync
export async function createServerProduct(product: Product): Promise<boolean> {
  // 1. Direct PostgreSQL Pooler
  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await ensureProductsTable();
        const query = `
          INSERT INTO products (
            id, slug, name, description, long_description, price, currency,
            images, category, collection, sizes, colors, availability,
            is_blurred, featured, is_placeholder
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            long_description = EXCLUDED.long_description,
            price = EXCLUDED.price,
            images = EXCLUDED.images,
            category = EXCLUDED.category,
            collection = EXCLUDED.collection,
            sizes = EXCLUDED.sizes,
            colors = EXCLUDED.colors,
            availability = EXCLUDED.availability,
            is_blurred = EXCLUDED.is_blurred,
            featured = EXCLUDED.featured,
            updated_at = NOW();
        `;
        const values = [
          product.id,
          product.slug,
          product.name,
          product.description,
          product.longDescription || product.description,
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
        ];

        await pool.query(query, values);
      } catch (err) {
        console.error("Direct PostgreSQL insert error:", err);
      }
    }
  }

  // Keep local JSON updated
  const localList = getLocalProducts();
  const updated = [product, ...localList.filter((p) => p.id !== product.id)];
  saveLocalProducts(updated);

  return true;
}

// Update Product: Direct PostgreSQL + Local sync
export async function updateServerProduct(
  id: string,
  updatedFields: Partial<Product>
): Promise<Product | null> {
  const localList = getLocalProducts();
  const index = localList.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const mergedProduct: Product = {
    ...localList[index],
    ...updatedFields,
  };

  // 1. Direct PostgreSQL Pooler
  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await ensureProductsTable();
        const query = `
          UPDATE products SET
            name = COALESCE($1, name),
            slug = COALESCE($2, slug),
            description = COALESCE($3, description),
            long_description = COALESCE($4, long_description),
            price = $5,
            currency = COALESCE($6, currency),
            images = COALESCE($7, images),
            category = COALESCE($8, category),
            collection = COALESCE($9, collection),
            sizes = COALESCE($10, sizes),
            colors = COALESCE($11, colors),
            availability = COALESCE($12, availability),
            is_blurred = COALESCE($13, is_blurred),
            featured = COALESCE($14, featured),
            updated_at = NOW()
          WHERE id = $15;
        `;
        const values = [
          mergedProduct.name,
          mergedProduct.slug,
          mergedProduct.description,
          mergedProduct.longDescription || mergedProduct.description,
          mergedProduct.price ?? null,
          mergedProduct.currency,
          JSON.stringify(mergedProduct.images || []),
          mergedProduct.category,
          mergedProduct.collection,
          JSON.stringify(mergedProduct.sizes || []),
          JSON.stringify(mergedProduct.colors || []),
          mergedProduct.availability,
          mergedProduct.isBlurred,
          mergedProduct.featured,
          id,
        ];

        await pool.query(query, values);
      } catch (err) {
        console.error("Direct PostgreSQL update error:", err);
      }
    }
  }

  localList[index] = mergedProduct;
  saveLocalProducts(localList);

  return mergedProduct;
}

// Delete Product: Direct PostgreSQL + Local sync
export async function deleteServerProduct(id: string): Promise<boolean> {
  // 1. Direct PostgreSQL Pooler
  if (isPostgresConfigured) {
    const pool = getPool();
    if (pool) {
      try {
        await pool.query("DELETE FROM products WHERE id = $1", [id]);
      } catch (err) {
        console.error("Direct PostgreSQL delete error:", err);
      }
    }
  }

  const localList = getLocalProducts();
  const filtered = localList.filter((p) => p.id !== id);
  saveLocalProducts(filtered);

  return true;
}

// Legacy saveServerProducts export
export function saveServerProducts(products: Product[]): boolean {
  return saveLocalProducts(products);
}
