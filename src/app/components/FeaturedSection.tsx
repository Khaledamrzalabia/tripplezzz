import Link from "next/link";
import ProductCard from "./ProductCard";
import type { Product } from "../../types/product";

interface Props {
  products: Product[];
}

export default function FeaturedSection({ products }: Props) {
  return (
    <section className="section mockup-featured-section" aria-labelledby="featured-heading">
      <div className="site-container">
        {/* Header */}
        <div className="mockup-section-header">
          <div>
            <div className="mockup-eyebrow">
              <span className="mockup-gold-dash" />
              <span>FEATURED PIECES</span>
            </div>
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
          {products.slice(0, 5).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
