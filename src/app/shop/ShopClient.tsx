"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "../components/ProductCard";
import type { Product, ProductCategory } from "../../types/product";
import { isProductComingSoon } from "../../types/product";

interface ShopClientProps {
  initialProducts: Product[];
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  tops: "Tops",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  accessories: "Accessories",
  footwear: "Footwear",
};

const SORT_OPTIONS = [
  { value: "default", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
];

export default function ShopClient({ initialProducts }: ShopClientProps) {
  const searchParams = useSearchParams();
  const paramSearch = searchParams.get("search") || searchParams.get("q") || "";
  const paramCategory = (searchParams.get("category") as ProductCategory) || "all";

  // Initialize directly from pre-rendered server products to prevent blur flicker
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [userCategory, setUserCategory] = useState<ProductCategory | "all" | null>(null);
  const [sort, setSort] = useState("default");

  const query = userQuery !== null ? userQuery : paramSearch;
  const category = userCategory !== null ? userCategory : paramCategory;

  // Background refresh to keep in sync without flickering
  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let result = products;
    if (category !== "all") result = result.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.slug && p.slug.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (sort === "price-asc") {
      result = [...result].sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));
    } else if (sort === "price-desc") {
      result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === "name-asc") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Default order: Coming Soon (blurred / teaser) pieces first,
      // and Open (in-stock / available) pieces always at the bottom as requested.
      result = [...result].sort((a, b) => {
        const aOpen = !isProductComingSoon(a);
        const bOpen = !isProductComingSoon(b);
        if (aOpen && !bOpen) return 1;  // 'a' is open, move to bottom
        if (!aOpen && bOpen) return -1; // 'b' is open, move to bottom
        return 0;
      });
    }

    return result;
  }, [products, query, category, sort]);

  return (
    <>
      <div className="shop-header" aria-labelledby="shop-heading">
        <div className="site-container">
          <p className="section-eyebrow">Catalogue</p>
          <h1 className="section-title" id="shop-heading" style={{ marginBottom: "0.5rem" }}>
            {query ? `All ${query.charAt(0).toUpperCase() + query.slice(1)}s` : category !== "all" ? `${CATEGORY_LABELS[category] || category} Collection` : "All Products"}
          </h1>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem" }}>
            {filtered.length} pieces found {query && `matching "${query}"`}
          </p>
        </div>
      </div>

      <div className="site-container" style={{ paddingBlock: "2rem 5rem" }}>
        {/* Sort Controls */}
        <div className="shop-controls" style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2rem" }}>
          <label htmlFor="shop-sort" className="sr-only">Sort by</label>
          <select
            id="shop-sort"
            className="shop-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="products-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty-state" role="status">
            <h3>No products found</h3>
            <p style={{ fontSize: "0.875rem" }}>
              Try adjusting your search or filter.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
