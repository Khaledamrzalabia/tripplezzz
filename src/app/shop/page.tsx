"use client";

import { useState, useMemo, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { getAllProducts } from "../../lib/products";
import type { Product, ProductCategory } from "../../types/product";

const ALL_PRODUCTS = getAllProducts();

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

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>(ALL_PRODUCTS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ProductCategory>("all");
  const [sort, setSort] = useState("default");

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
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    if (sort === "price-asc") result = [...result].sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));
    else if (sort === "price-desc") result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === "name-asc") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, query, category, sort]);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <>
      <div className="shop-header" aria-labelledby="shop-heading">
        <div className="site-container">
          <p className="section-eyebrow">Catalogue</p>
          <h1 className="section-title" id="shop-heading" style={{ marginBottom: "0.5rem" }}>
            All Products
          </h1>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem" }}>
            {products.length} pieces
          </p>
        </div>
      </div>

      <div className="site-container" style={{ paddingBlock: "2rem 5rem" }}>
        {/* Controls */}
        <div className="shop-controls" role="search" aria-label="Filter and sort products">
          <label htmlFor="shop-search" className="sr-only">Search products</label>
          <input
            id="shop-search"
            type="search"
            className="shop-search"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
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

        {/* Category chips */}
        <div className="filter-chips" role="group" aria-label="Filter by category" style={{ marginBottom: "2rem" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-chip${category === cat ? " active" : ""}`}
              onClick={() => setCategory(cat as "all" | ProductCategory)}
              aria-pressed={category === cat}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
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
