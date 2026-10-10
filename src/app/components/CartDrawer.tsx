"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

export default function CartDrawer() {
  const { state, isDrawerOpen, closeDrawer, updateQty, removeItem, totalItems, totalPrice } = useCart();
  const { formatPrice } = useCurrency();

  // Free shipping threshold: $150 USD equivalent
  const freeShippingThresholdUSD = 150;
  const progressPercent = Math.min(100, Math.round((totalPrice / freeShippingThresholdUSD) * 100));
  const remainingUSD = Math.max(0, freeShippingThresholdUSD - totalPrice);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <div className="tz-drawer-overlay" onClick={closeDrawer} role="dialog" aria-modal="true" aria-label="Shopping Bag">
      <div className="tz-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tz-drawer-header">
          <div className="tz-drawer-title-wrap">
            <h3 className="tz-drawer-title">SHOPPING BAG</h3>
            <span className="tz-drawer-count">({totalItems})</span>
          </div>
          <button type="button" onClick={closeDrawer} className="tz-drawer-close" aria-label="Close Shopping Bag">
            ✕
          </button>
        </div>

        {/* Free Shipping Bar */}
        <div className="tz-drawer-shipping-bar">
          <div className="tz-drawer-shipping-text">
            {remainingUSD === 0 ? (
              <span className="tz-shipping-unlocked">🎉 You unlocked <strong>FREE SHIPPING</strong>!</span>
            ) : (
              <span>Add <strong>{formatPrice(remainingUSD)}</strong> more for <strong>FREE SHIPPING</strong></span>
            )}
          </div>
          <div className="tz-drawer-progress-track">
            <div className="tz-drawer-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Items */}
        <div className="tz-drawer-body">
          {state.items.length === 0 ? (
            <div className="tz-drawer-empty">
              <div className="tz-drawer-empty-icon">⚽</div>
              <p className="tz-drawer-empty-text">Your bag is empty.</p>
              <Link href="/shop" onClick={closeDrawer} className="btn btn-pill-white-sm">
                EXPLORE COLLECTION →
              </Link>
            </div>
          ) : (
            <div className="tz-drawer-items">
              {state.items.map((item) => {
                const img = item.product.images[0]?.src || "/hero.jpg";
                return (
                  <div key={item.product.id + (item.selectedSize ?? "")} className="tz-drawer-item">
                    <div className="tz-drawer-item-img">
                      <Image
                        src={img}
                        alt={item.product.name}
                        fill
                        sizes="90px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="tz-drawer-item-details">
                      <div className="tz-drawer-item-top">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={closeDrawer}
                          className="tz-drawer-item-name"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id, item.selectedSize)}
                          className="tz-drawer-item-remove"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="tz-drawer-item-meta">
                        {item.selectedSize && <span>Size: <strong>{item.selectedSize}</strong></span>}
                        {item.product.collection && <span className="tz-drawer-tag">{item.product.collection.toUpperCase()}</span>}
                      </div>
                      <div className="tz-drawer-item-bottom">
                        <div className="tz-drawer-qty-selector">
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, item.quantity - 1, item.selectedSize)}
                            className="tz-qty-btn"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="tz-qty-val">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, item.quantity + 1, item.selectedSize)}
                            className="tz-qty-btn"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="tz-drawer-item-price">
                          {formatPrice((item.product.price ?? 0) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="tz-drawer-footer">
            <div className="tz-drawer-subtotal-row">
              <span className="tz-subtotal-label">SUBTOTAL</span>
              <span className="tz-subtotal-val">{formatPrice(totalPrice)}</span>
            </div>
            <p className="tz-drawer-tax-note">Taxes and shipping calculated at checkout.</p>
            <div className="tz-drawer-actions">
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="btn btn-pill-white tz-drawer-checkout-btn"
              >
                PROCEED TO CHECKOUT →
              </Link>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="tz-drawer-viewcart-link"
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
