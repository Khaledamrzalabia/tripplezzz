"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

export default function CartPage() {
  const { state, removeItem, updateQty, totalItems, totalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const items = state.items;

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="site-container cart-empty" style={{ textAlign: "center", padding: "6rem 1rem" }}>
          <div
            aria-hidden="true"
            style={{
              width: 76,
              height: 76,
              marginInline: "auto",
              marginBottom: "1.5rem",
              borderRadius: "50%",
              background: "rgba(201, 169, 110, 0.08)",
              border: "1px solid rgba(201, 169, 110, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--clr-accent)",
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h1 className="display-md" style={{ marginBottom: "1rem" }}>YOUR BAG IS EMPTY</h1>
          <p style={{ color: "var(--clr-text-secondary)", marginBottom: "2rem" }}>
            Explore the new drops and add your favorite football streetwear pieces.
          </p>
          <Link href="/shop" className="btn btn-pill-white">SHOP THE COLLECTION →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="site-container">
        <div className="mockup-eyebrow">
          <span className="mockup-gold-dash" />
          <span>ORDER REVIEW</span>
        </div>
        <h1 className="display-md" style={{ marginBottom: "2.5rem" }}>YOUR SHOPPING BAG</h1>

        <div className="cart-grid">
          {/* Items */}
          <div>
            <div className="cart-items" role="list" aria-label="Cart items">
              {items.map((item) => (
                <div key={item.product.id + (item.selectedSize ?? "")} className="cart-item" role="listitem">
                  <div className="cart-item-image">
                    <Image
                      src={item.product.images[0]?.src ?? "/hero.jpg"}
                      alt={item.product.images[0]?.alt ?? item.product.name}
                      width={90}
                      height={90}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />
                  </div>
                  <div>
                    <Link href={`/products/${item.product.slug}`} className="cart-item-name">
                      {item.product.name}
                    </Link>
                    <p className="cart-item-meta">
                      {item.selectedSize && `Size: ${item.selectedSize}`}
                      {item.selectedColor && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginInlineStart: "6px" }}>
                          • Color: <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: item.selectedColor, display: "inline-block", border: "1px solid rgba(255,255,255,0.3)" }} />
                        </span>
                      )}
                      {item.product.collection && ` • ${item.product.collection.toUpperCase()}`}
                    </p>
                    <div className="cart-item-qty" role="group" aria-label={"Quantity for " + item.product.name}>
                      <button
                        className="cart-item-qty-btn"
                        onClick={() => updateQty(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        className="cart-item-qty-btn"
                        onClick={() => updateQty(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="cart-item-price">{formatPrice((item.product.price ?? 0) * item.quantity)}</p>
                    <button
                      className="cart-remove"
                      onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                      aria-label={"Remove " + item.product.name}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem" }}>
              <Link href="/shop" className="btn btn-pill-outline-sm">
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
              Order Summary
            </h2>
            <div className="cart-summary-row">
              <span>Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <span style={{ color: "var(--clr-text-muted)" }}>
                Calculated at checkout (Flat rate per order)
              </span>
            </div>
            <div className="cart-summary-row total">
              <span>Estimated Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <Link
              href="/checkout"
              className="btn btn-pill-white"
              style={{ width: "100%", marginTop: "1.5rem", display: "flex", justifyContent: "center", padding: "1rem" }}
            >
              PROCEED TO CHECKOUT →
            </Link>
            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--clr-text-muted)", marginTop: "1rem" }}>
              Encrypted 256-bit SSL Checkout • 14-Day Guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}