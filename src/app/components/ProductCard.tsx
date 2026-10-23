"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { Product } from "../../types/product";
import { isProductComingSoon } from "../../types/product";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

interface Props {
  product: Product;
  headingLevel?: "h2" | "h3";
}

export default function ProductCard({ product, headingLevel = "h2" }: Props) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const [likeBump, setLikeBump] = useState(false);

  // Sync wishlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tz_wishlist");
      if (saved) {
        const list: string[] = JSON.parse(saved);
        if (Array.isArray(list) && list.includes(product.id)) {
          setLiked(true);
        }
      }
    } catch {}
  }, [product.id]);

  const HeadingTag = headingLevel;

  const primaryImage = product.images[0];
  const isComingSoon = isProductComingSoon(product);
  const safeIdentifier = product.slug?.trim() || product.id || "shop";
  const productHref = `/products/${encodeURIComponent(safeIdentifier)}`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComingSoon || product.availability === "out-of-stock") return;
    addItem(product, 1, product.sizes?.[0], product.colors?.[0]);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    setLikeBump(true);
    setTimeout(() => setLikeBump(false), 420);

    try {
      const saved = localStorage.getItem("tz_wishlist");
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (next) {
        if (!list.includes(product.id)) list.push(product.id);
      } else {
        list = list.filter((id) => id !== product.id);
      }
      localStorage.setItem("tz_wishlist", JSON.stringify(list));
    } catch {}
  };

  return (
    <div className={`mockup-product-card ${isComingSoon ? "is-coming-soon" : ""}`}>
      {/* Image Container */}
      <div className="mockup-card-image-wrap">
        {/* Heart top-right */}
        <button
          type="button"
          onClick={handleToggleLike}
          className={`mockup-card-heart ${liked ? "active" : ""} ${likeBump ? "heart-pop" : ""}`}
          aria-label="Save to wishlist"
        >
          {liked ? "♥" : "♡"}
        </button>

        {/* Coming Soon Center Badge Overlay */}
        {isComingSoon && (
          <div className="mockup-card-coming-soon-overlay">
            <span className="mockup-card-coming-soon-pill">COMING SOON</span>
          </div>
        )}

        {/* Product Image Link */}
        <Link
          href={productHref}
          className="mockup-product-link"
          aria-label={isComingSoon ? "Coming Soon Teaser" : product.name}
        >
          {primaryImage ? (
            <Image
              src={primaryImage.src}
              alt={product.isBlurred ? "Coming Soon Piece" : (primaryImage.alt || product.name)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
              className={`mockup-card-img ${product.isBlurred ? "mockup-card-img-blurred" : ""}`}
            />
          ) : (
            <div className="mockup-card-no-img">No Image</div>
          )}
        </Link>
      </div>

      {/* Card Body */}
      {isComingSoon ? (
        /* Teaser Mode: Name and Coming Soon status with suspense color dots */
        <div className="mockup-card-body mockup-card-teaser-body">
          <Link href={productHref} className="mockup-product-title-link">
            <HeadingTag className="mockup-card-title">{product.name}</HeadingTag>
          </Link>
          <div className="mockup-card-footer mockup-teaser-footer">
            <span className="mockup-teaser-status">COMING SOON</span>
            {product.colors && product.colors.length > 0 && (
              <div className="mockup-card-colors">
                {product.colors.slice(0, 3).map((c, i) => (
                  <span
                    key={i}
                    className="mockup-color-dot teaser-dot"
                    style={{ backgroundColor: c }}
                    title={`Color ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Regular Product Card */
        <div className="mockup-card-body">
          <Link href={productHref} className="mockup-product-title-link">
            <HeadingTag className="mockup-card-title">{product.name}</HeadingTag>
          </Link>

          {/* Price & Action Row */}
          <div className="mockup-card-footer">
            <div>
              <span className="mockup-card-price">{formatPrice(product.price)}</span>

              {/* Color dots */}
              {product.colors && product.colors.length > 0 && (
                <div className="mockup-card-colors">
                  {product.colors.map((c, i) => (
                    <span
                      key={i}
                      className="mockup-color-dot"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Cart Icon Button */}
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={product.availability === "out-of-stock"}
              className={`mockup-card-cart-btn ${added ? "added" : ""}`}
              aria-label="Add to cart"
              title="Add to Cart"
            >
              {added ? (
                <span style={{ fontSize: "11px", fontWeight: 700 }}>✓</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
