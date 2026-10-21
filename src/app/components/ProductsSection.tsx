"use client";

import { useEffect, useState, useMemo } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "../../types/product";
import { isProductComingSoon } from "../../types/product";

interface Props {
  products: Product[];
  title: string;
  subtitle: string;
}

// Homepage catalogue: every product added from the admin appears here, right under the hero
export default function ProductsSection({ products: initialProducts, title, subtitle }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  }, []);

  // Coming Soon first, then featured pieces, then the rest
  const displayProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aOpen = !isProductComingSoon(a);
      const bOpen = !isProductComingSoon(b);
      if (aOpen && !bOpen) return 1;
      if (!aOpen && bOpen) return -1;
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [products]);

  return (
    <section id="products" className="section mockup-featured-section" aria-labelledby="products-heading">
      <div className="site-container">
        <div className="mockup-section-header">
          <div>
            <h2 className="mockup-section-title" id="products-heading">
              {title}
            </h2>
            {subtitle && <p className="mockup-section-subtitle">{subtitle}</p>}
          </div>
        </div>

        {displayProducts.length > 0 ? (
          <div className="products-grid">
            {displayProducts.map((p) => (
              <ProductCard key={p.id} product={p} headingLevel="h3" />
            ))}
          </div>
        ) : (
          <div className="empty-state" role="status">
            <h3>New pieces are on the way</h3>
          </div>
        )}
      </div>
    </section>
  );
}
