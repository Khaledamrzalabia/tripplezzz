"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "../../../context/CartContext";
import { useCurrency } from "../../../context/CurrencyContext";
import dynamic from "next/dynamic";
import ProductCard from "../../components/ProductCard";
import type { Product } from "../../../types/product";

const SizeGuideModal = dynamic(() => import("../../components/SizeGuideModal"), { ssr: false });

interface ProductDetailClientProps {
  product: Product;
  related: Product[];
}

export default function ProductDetailClient({ product, related }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "fit" | "care" | "shipping">("specs");

  const isComingSoon = product.availability === "coming-soon";
  const isOutOfStock = product.availability === "out-of-stock";

  const handleAdd = () => {
    if (isOutOfStock || isComingSoon) return;
    addItem(product, qty, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const activeImage = product.images[selectedImageIndex] ?? product.images[0] ?? { src: "/hero.jpg", alt: product.name };

  return (
    <div className="product-detail">
      <div className="site-container">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: "2rem", fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>
          <Link href="/shop">Shop</Link>
          <span style={{ margin: "0 0.5rem" }}>/</span>
          <Link href={`/collections/${product.collection || "core"}`} style={{ textTransform: "capitalize" }}>
            {product.collection || "Core"}
          </Link>
          <span style={{ margin: "0 0.5rem" }}>/</span>
          <span style={{ color: "var(--clr-text-primary)" }}>{product.name}</span>
        </nav>

        <div className="product-detail-grid" style={{ minWidth: 0, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
          {/* Gallery */}
          <div className="product-gallery" style={{ minWidth: 0, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <div className="product-gallery-main" style={{ overflow: "hidden", position: "relative" }}>
              <Image
                src={activeImage.src}
                alt={activeImage.alt ?? product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{
                  objectFit: "cover",
                  filter: isComingSoon || product.isBlurred ? "blur(26px) brightness(0.65) saturate(110%)" : "none",
                  transform: isComingSoon || product.isBlurred ? "scale(1.15)" : "none",
                  transition: "all 0.3s ease",
                }}
                priority
              />
              {(isComingSoon || product.isBlurred) && (
                <div className="mockup-card-coming-soon-overlay">
                  <span className="mockup-card-coming-soon-pill" style={{ fontSize: "0.9rem", padding: "0.75rem 2rem", letterSpacing: "0.18em" }}>
                    🔒 COMING SOON DROP
                  </span>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      position: "relative",
                      width: 76,
                      height: 76,
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      border: idx === selectedImageIndex ? "2px solid var(--clr-accent, #c9a96e)" : "1px solid var(--clr-border)",
                      background: "var(--clr-surface-2)",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                    }}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt || product.name}
                      fill
                      sizes="76px"
                      style={{
                        objectFit: "cover",
                        filter: isComingSoon || product.isBlurred ? "blur(14px) brightness(0.7)" : "none",
                        transform: isComingSoon || product.isBlurred ? "scale(1.2)" : "none",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info" style={{ minWidth: 0, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <span className="product-category">{product.collection ? `${product.collection.toUpperCase()} • ` : ""}{product.category.toUpperCase()}</span>
              {product.featured && <span className="mockup-card-badge-new" style={{ position: "static" }}>FEATURED DROP</span>}
            </div>

            <h1 className="product-name" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>{product.name}</h1>

            {isComingSoon ? (
              <p className="product-price product-coming-soon-label" style={{ color: "var(--clr-accent, #c9a96e)", fontSize: "1.25rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Coming Soon
              </p>
            ) : (
              <p className="product-price">{formatPrice(product.price)}</p>
            )}

            {product.availability === "in-stock" && (
              <p className="availability-tag" style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--clr-success)", display: "inline-block", flexShrink: 0 }} />
                <span>In Stock • Ships within 24–48 hours</span>
              </p>
            )}
            {product.availability === "low-stock" && <p className="availability-tag" style={{ color: "#f0a500" }}>⚠️ Limited Stock Available</p>}
            {product.availability === "out-of-stock" && <p className="availability-tag" style={{ color: "var(--clr-error)" }}>Sold Out</p>}

            <div className="product-divider" />

            {/* Size selection & Size Guide Trigger */}
            {product.sizes && product.sizes.length > 0 && (
              <div style={{ marginBottom: "1.75rem", width: "100%", maxWidth: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <p className="option-label" style={{ margin: 0 }}>
                    Size — <span style={{ color: "var(--clr-text-secondary)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{selectedSize}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--clr-accent)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Size & Fit Guide 📏
                  </button>
                </div>
                <div className="size-grid">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      className={"size-btn" + (selectedSize === s ? " active" : "")}
                      onClick={() => setSelectedSize(s)}
                      aria-pressed={selectedSize === s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!isComingSoon && (
              <div style={{ marginBottom: "2rem" }}>
                <p className="option-label">Quantity</p>
                <div className="qty-control" role="group" aria-label="Quantity">
                  <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
                  <span className="qty-value" aria-live="polite">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(qty + 1)} aria-label="Increase">+</button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <button
              className="btn btn-pill-white product-add-btn"
              onClick={handleAdd}
              disabled={isOutOfStock || isComingSoon}
              style={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                padding: "1rem 1.25rem",
                fontSize: "0.9rem",
                whiteSpace: "normal",
                lineHeight: 1.3,
                textAlign: "center",
                wordBreak: "break-word",
                ...(isComingSoon ? { opacity: 0.6, cursor: "not-allowed", background: "var(--clr-surface-2)", color: "var(--clr-text-secondary)", borderColor: "var(--clr-border)" } : {})
              }}
            >
              {isComingSoon ? "Coming Soon — Drop Date TBA" : isOutOfStock ? "Sold Out" : added ? "Added To Bag ✓" : "ADD TO BAG"}
            </button>

            <p className="product-desc" style={{ marginTop: "2rem", wordBreak: "break-word", overflowWrap: "break-word", maxWidth: "100%", boxSizing: "border-box" }}>
              {product.longDescription ?? product.description}
            </p>

            {/* Accordion / Tabbed Specifications (Per Design Spec 10.5 & 11.3) */}
            <div style={{ marginTop: "2.5rem", borderTop: "1px solid var(--clr-border)", width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
              {/* Tab Nav */}
              <div
                className="product-tabs-nav"
                style={{
                  display: "flex",
                  gap: "1rem",
                  borderBottom: "1px solid var(--clr-border)",
                  overflowX: "auto",
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                }}
              >
                {(
                  [
                    { id: "specs", label: "CRAFT & SPECS" },
                    { id: "fit", label: "FIT & SILHOUETTE" },
                    { id: "care", label: "GARMENT CARE" },
                    { id: "shipping", label: "DELIVERY & RETURNS" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: activeTab === tab.id ? "2px solid var(--clr-accent)" : "2px solid transparent",
                      color: activeTab === tab.id ? "var(--clr-text-primary)" : "var(--clr-text-muted)",
                      padding: "0.75rem 0.25rem",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ padding: "1.5rem 0", fontSize: "0.9rem", color: "var(--clr-text-secondary)", lineHeight: 1.7, width: "100%", maxWidth: "100%", boxSizing: "border-box", wordBreak: "break-word", overflowWrap: "break-word" }}>
                {activeTab === "specs" && (
                  <ul style={{ paddingLeft: "1.25rem", paddingRight: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "100%", boxSizing: "border-box" }}>
                    <li style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>500gsm custom-milled loopback cotton fleece.</li>
                    <li style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>Over 45,000 stitches of high-density 3D metallic embroidery.</li>
                    <li style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>Tonal custom drawstrings with heavy engraved aglets.</li>
                    <li style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>Double-layer structured hood engineered to sit upright.</li>
                  </ul>
                )}
                {activeTab === "fit" && (
                  <p style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                    Cut with our signature dropped shoulder and relaxed boxy drape. Model is 185cm (6&apos;1&quot;) wearing size Large. For a closer tailored fit, select one size smaller than your standard size.
                  </p>
                )}
                {activeTab === "care" && (
                  <p style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                    Machine wash cold inside-out with like colours. Use mild detergent. Do not tumble dry. Reshape and air dry flat in shade. Cool iron on reverse; do not iron directly on embroidered crests.
                  </p>
                )}
                {activeTab === "shipping" && (
                  <p style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                    Dispatched in sustainable branded packaging within 24–48 hours. Express regional delivery takes 2–4 business days. Free worldwide shipping on orders over $150 USD. 14-day hassle-free return window.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: "6rem", paddingTop: "4rem", borderTop: "1px solid var(--clr-border)" }}>
            <div className="mockup-section-header">
              <div>
                <h2 className="mockup-section-title">YOU MIGHT ALSO LIKE</h2>
              </div>
              <Link href="/shop" className="mockup-view-all-link">
                VIEW CATALOGUE →
              </Link>
            </div>
            <div className="mockup-featured-grid">
              {related.map((p) => <ProductCard key={p.id} product={p} headingLevel="h3" />)}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Add to Bag Bar */}
      <div className="tz-mobile-sticky-buy-bar">
        <div className="tz-sticky-buy-info">
          <span className="tz-sticky-buy-name">{product.name}</span>
          <span className="tz-sticky-buy-price">
            {isComingSoon ? "Drop Date TBA" : formatPrice(product.price)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock || isComingSoon}
          className={`btn btn-primary tz-sticky-buy-btn ${added ? "added" : ""}`}
        >
          {added ? "ADDED ✓" : isComingSoon ? "COMING SOON" : isOutOfStock ? "SOLD OUT" : "ADD TO BAG"}
        </button>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        category={product.category}
      />
    </div>
  );
}
