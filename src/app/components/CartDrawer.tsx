"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

export default function CartDrawer() {
  const { state, isDrawerOpen, closeDrawer, updateQty, removeItem, totalItems, totalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isDrawerOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender && !isClosing) {
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      }, 280);
      return () => {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
      };
    }
  }, [isDrawerOpen, shouldRender, isClosing]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    closeDrawer();
    closeTimerRef.current = setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, 280);
  };

  const handleRemove = (productId: string, selectedSize?: string, selectedColor?: string) => {
    const key = productId + (selectedSize ?? "") + (selectedColor ?? "");
    setRemovingKey(key);
    setTimeout(() => {
      removeItem(productId, selectedSize, selectedColor);
      setRemovingKey(null);
    }, 220);
  };

  useEffect(() => {
    if (shouldRender && !isClosing) {
      document.body.classList.add("drawer-open");
      document.body.style.overflow = "hidden";
      setTimeout(() => closeBtnRef.current?.focus(), 60);
    } else {
      document.body.classList.remove("drawer-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("drawer-open");
      document.body.style.overflow = "";
    };
  }, [shouldRender, isClosing]);

  // Handle ESC key and focus trap
  useEffect(() => {
    if (!shouldRender || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldRender, isClosing]);

  if (!shouldRender) return null;

  return (
    <div
      className={`tz-drawer-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className={`tz-drawer ${isClosing ? "closing" : ""}`} ref={drawerRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tz-drawer-header">
          <div className="tz-drawer-title-wrap">
            <h3 className="tz-drawer-title">SHOPPING BAG</h3>
            <span className="tz-drawer-count">({totalItems})</span>
          </div>
          <button ref={closeBtnRef} type="button" onClick={handleClose} className="tz-drawer-close" aria-label="Close Shopping Bag">
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="tz-drawer-body">
          {state.items.length === 0 ? (
            <div className="tz-drawer-empty">
              <div
                className="tz-drawer-empty-icon"
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(201, 169, 110, 0.08)",
                  border: "1px solid rgba(201, 169, 110, 0.25)",
                  color: "var(--clr-accent)",
                  marginInline: "auto",
                  marginBottom: "1rem",
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <p className="tz-drawer-empty-text">Your bag is empty.</p>
              <Link href="/shop" onClick={handleClose} className="btn btn-pill-white-sm">
                EXPLORE COLLECTION →
              </Link>
            </div>
          ) : (
            <div className="tz-drawer-items">
              {state.items.map((item, index) => {
                const img = item.product.images[0]?.src || "/hero.jpg";
                const itemKey = item.product.id + (item.selectedSize ?? "");
                const isItemRemoving = removingKey === itemKey;
                return (
                  <div
                    key={itemKey}
                    className={`tz-drawer-item ${isItemRemoving ? "removing" : ""}`}
                    style={{ "--item-index": index } as React.CSSProperties}
                  >
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
                          onClick={handleClose}
                          className="tz-drawer-item-name"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.product.id, item.selectedSize, item.selectedColor)}
                          className="tz-drawer-item-remove"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="tz-drawer-item-meta">
                        {item.selectedSize && <span>Size: <strong>{item.selectedSize}</strong></span>}
                        {item.selectedColor && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: item.selectedColor, display: "inline-block", border: "1px solid rgba(255,255,255,0.3)" }} />
                          </span>
                        )}
                        {item.product.collection && <span className="tz-drawer-tag">{item.product.collection.toUpperCase()}</span>}
                      </div>
                      <div className="tz-drawer-item-bottom">
                        <div className="tz-drawer-qty-selector">
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                            className="tz-qty-btn"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="tz-qty-val">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
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
                onClick={handleClose}
                className="btn btn-pill-white tz-drawer-checkout-btn"
              >
                PROCEED TO CHECKOUT →
              </Link>
              <Link
                href="/cart"
                onClick={handleClose}
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
