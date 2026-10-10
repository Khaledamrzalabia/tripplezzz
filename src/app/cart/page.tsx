"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

export default function CartPage() {
  const { state, removeItem, updateQty, totalItems, totalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const items = state.items;

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="site-container cart-empty" style={{ textAlign: "center", padding: "6rem 1rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚽</div>
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
                      {item.product.collection && ` • ${item.product.collection.toUpperCase()}`}
                    </p>
                    <div className="cart-item-qty" role="group" aria-label={"Quantity for " + item.product.name}>
                      <button
                        className="cart-item-qty-btn"
                        onClick={() => updateQty(item.product.id, item.quantity - 1, item.selectedSize)}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        className="cart-item-qty-btn"
                        onClick={() => updateQty(item.product.id, item.quantity + 1, item.selectedSize)}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="cart-item-price">{formatPrice((item.product.price ?? 0) * item.quantity)}</p>
                    <button
                      className="cart-remove"
                      onClick={() => removeItem(item.product.id, item.selectedSize)}
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
              <span style={{ color: totalPrice >= 150 ? "#10b981" : "var(--clr-text-muted)" }}>
                {totalPrice >= 150 ? "FREE" : "Calculated at checkout"}
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
              Encrypted 256-bit SSL Checkout &bull; 14-Day Guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}