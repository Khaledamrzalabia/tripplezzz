"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import type { Product } from "../../types/product";
import { isProductComingSoon } from "../../types/product";

interface Props {
  products: Product[];
}

export default function FeaturedSection({ products: initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          const featured = data.filter((p: Product) => Boolean(p.featured));
          setProducts(featured);
        }
      })
      .catch(() => {});
  }, []);

  // Display Coming Soon first, and open / available pieces at the end / bottom
  const displayProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aOpen = !isProductComingSoon(a);
      const bOpen = !isProductComingSoon(b);
      if (aOpen && !bOpen) return 1;
      if (!aOpen && bOpen) return -1;
      return 0;
    });
  }, [products]);

  return (
    <section className="section mockup-featured-section" aria-labelledby="featured-heading">
      <div className="site-container">
        {/* Header */}
        <div className="mockup-section-header">
          <div>
            <h2 className="mockup-section-title" id="featured-heading">
              FEATURED PIECES
            </h2>
            <p className="mockup-section-subtitle">Selected for the new season.</p>
          </div>

          <Link href="/shop" className="mockup-view-all-link">
            <span>VIEW ALL</span>
            <span style={{ fontSize: "1.1rem" }}>→</span>
          </Link>
        </div>

        {/* 5-Column Grid */}
        <div className="mockup-featured-grid">
          {displayProducts.slice(0, 5).map((p) => (
            <ProductCard key={p.id} product={p} headingLevel="h3" />
          ))}
        </div>
      </div>
    </section>
  );
}
