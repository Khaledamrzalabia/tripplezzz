import { Pool, PoolConfig } from "pg";
import type { Product } from "../types/product";

// Global pool instance to prevent connection leaks across Next.js reloads
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function getDatabaseConfig(): { config: PoolConfig; isConfigured: boolean } {
  // Option 1: Connection string (DATABASE_URL / POSTGRES_URL)
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

  if (connectionString) {
    const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    return {
      config: {
        connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
      isConfigured: true,
    };
  }

  // Option 2: Individual variables (Host, Port, User, Password, Database)
  const host = process.env.PGHOST || process.env.DB_HOST || "";
  const user = process.env.PGUSER || process.env.DB_USER || "";
  const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || "";
  const database = process.env.PGDATABASE || process.env.DB_NAME || "postgres";
  const port = Number(process.env.PGPORT || process.env.DB_PORT || 5432);
  const ssl = process.env.PGSSL !== "false" && process.env.DB_SSL !== "false";

  if (host && user) {
    return {
      config: {
        host,
        port,
        user,
        password,
        database,
        ssl: ssl ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
      isConfigured: true,
    };
  }

  return {
    config: {},
    isConfigured: false,
  };
}

const { config, isConfigured } = getDatabaseConfig();

export const isPostgresConfigured = isConfigured;

export function getPool(): Pool | null {
  if (!isPostgresConfigured) return null;

  if (!global.__pgPool) {
    global.__pgPool = new Pool(config);
    global.__pgPool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client:", err);
    });
  }

  return global.__pgPool;
}

// Ensure the products table exists in PostgreSQL
let tableInitialized = false;
export async function ensureProductsTable(): Promise<void> {
  if (tableInitialized || !isPostgresConfigured) return;
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        slug VARCHAR(120) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        long_description TEXT,
        price NUMERIC(10, 2),
        currency VARCHAR(10) DEFAULT 'USD',
        images JSONB NOT NULL DEFAULT '[]'::jsonb,
        category VARCHAR(50) NOT NULL,
        collection VARCHAR(50) DEFAULT 'core',
        sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
        colors JSONB DEFAULT '["#0a0a0a"]'::jsonb,
        availability VARCHAR(50) DEFAULT 'in-stock',
        is_blurred BOOLEAN DEFAULT false,
        featured BOOLEAN DEFAULT false,
        is_placeholder BOOLEAN DEFAULT false,
        craft_specs JSONB DEFAULT '[]'::jsonb,
        fit_silhouette TEXT,
        garment_care TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS craft_specs JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS fit_silhouette TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS garment_care TEXT;
    `);
    tableInitialized = true;
  } catch (err) {
    console.error("Failed to ensure products table in PostgreSQL:", err);
  }
}

// Helper to convert row to Product
export function rowToProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    longDescription: row.long_description || row.description || "",
    craftSpecs: Array.isArray(row.craft_specs)
      ? row.craft_specs
      : typeof row.craft_specs === "string"
      ? JSON.parse(row.craft_specs)
      : [],
    fitSilhouette: row.fit_silhouette || "",
    garmentCare: row.garment_care || "",
    price: row.price !== null && row.price !== undefined ? Number(row.price) : undefined,
    currency: row.currency || "USD",
    images: Array.isArray(row.images) ? row.images : (typeof row.images === "string" ? JSON.parse(row.images) : []),
    category: row.category,
    collection: row.collection || "core",
    sizes: Array.isArray(row.sizes) ? row.sizes : (typeof row.sizes === "string" ? JSON.parse(row.sizes) : ["S", "M", "L", "XL"]),
    colors: Array.isArray(row.colors) ? row.colors : (typeof row.colors === "string" ? JSON.parse(row.colors) : ["#0a0a0a"]),
    availability: row.availability || "in-stock",
    isBlurred: Boolean(row.is_blurred),
    featured: Boolean(row.featured),
    isPlaceholder: Boolean(row.is_placeholder),
  };
}
