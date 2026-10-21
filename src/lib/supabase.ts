import { createClient } from "@supabase/supabase-js";
import type { Product } from "../types/product";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith("http") && supabaseAnonKey
);

// Client-safe Supabase instance (Anonymous key)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-privileged Supabase instance (Service Role key if available, else Anon)
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper to convert DB snake_case record to TypeScript camelCase Product
export function mapDbRecordToProduct(record: any): Product {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description || "",
    longDescription: record.long_description || record.description || "",
    craftSpecs: Array.isArray(record.craft_specs)
      ? record.craft_specs
      : typeof record.craft_specs === "string"
      ? JSON.parse(record.craft_specs)
      : [],
    fitSilhouette: record.fit_silhouette || "",
    garmentCare: record.garment_care || "",
    price: record.price !== null && record.price !== undefined ? Number(record.price) : undefined,
    currency: record.currency || "USD",
    images: Array.isArray(record.images) ? record.images : [],
    category: record.category,
    collection: record.collection || "core",
    sizes: Array.isArray(record.sizes) ? record.sizes : ["S", "M", "L", "XL"],
    colors: Array.isArray(record.colors) ? record.colors : ["#0a0a0a"],
    availability: record.availability || "in-stock",
    isBlurred: Boolean(record.is_blurred),
    featured: Boolean(record.featured),
    isPlaceholder: Boolean(record.is_placeholder),
    stock: record.stock === null || record.stock === undefined ? null : Number(record.stock),
  };
}

// Helper to convert Product to DB snake_case record
export function mapProductToDbRecord(product: Product): any {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    long_description: product.longDescription,
    craft_specs: product.craftSpecs || [],
    fit_silhouette: product.fitSilhouette || "",
    garment_care: product.garmentCare || "",
    price: product.price !== undefined ? product.price : null,
    currency: product.currency || "USD",
    images: product.images || [],
    category: product.category,
    collection: product.collection || "core",
    sizes: product.sizes || [],
    colors: product.colors || [],
    availability: product.availability || "in-stock",
    is_blurred: Boolean(product.isBlurred),
    featured: Boolean(product.featured),
    is_placeholder: Boolean(product.isPlaceholder),
    stock: product.stock ?? null,
    updated_at: new Date().toISOString(),
  };
}
