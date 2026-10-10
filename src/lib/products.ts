// =============================================
// TRIPLE Z — Product Data Service (Universal)
// Client & Server safe (no Node.js fs dependencies)
// =============================================

import type { Product, ProductCategory } from "../types/product";
import defaultProducts from "../data/products.json";

export function getAllProducts(): Product[] {
  return (defaultProducts as unknown) as Product[];
}

export function getProductBySlug(slug: string): Product | undefined {
  const all = getAllProducts();
  return all.find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  const all = getAllProducts();
  return all.filter((p) => p.featured);
}

export function getProductById(id: string): Product | undefined {
  const all = getAllProducts();
  return all.find((p) => p.id === id);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  const all = getAllProducts();
  return all.filter((p) => p.category === category);
}

export function getProductsByCollection(collection: string): Product[] {
  const all = getAllProducts();
  return all.filter((p) => p.collection === collection);
}

export function getAllCategories(): ProductCategory[] {
  const all = getAllProducts();
  const cats = new Set(all.map((p) => p.category));
  return Array.from(cats);
}

export function getAllCollections(): string[] {
  const all = getAllProducts();
  const cols = new Set(all.map((p) => p.collection).filter(Boolean) as string[]);
  return Array.from(cols);
}

export function searchProducts(query: string): Product[] {
  const all = getAllProducts();
  const q = query.toLowerCase().trim();
  if (!q) return all;
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );
}

export function getRelatedProducts(product: Product, limit = 3): Product[] {
  const all = getAllProducts();
  return all
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category === product.category || p.collection === product.collection)
    )
    .slice(0, limit);
}
