"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

export default function CartToast() {
  const { lastAddedItem, clearLastAddedItem, openDrawer } = useCart();
  const { formatPrice } = useCurrency();
  const [activeItem, setActiveItem] = useState(lastAddedItem);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (lastAddedItem) {
      setActiveItem(lastAddedItem);
      setIsDismissing(false);
    } else if (activeItem && !isDismissing) {
      setIsDismissing(true);
      const timer = setTimeout(() => {
        setActiveItem(null);
        setIsDismissing(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem, activeItem, isDismissing]);

  const handleDismiss = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    setTimeout(() => {
      clearLastAddedItem();
      setActiveItem(null);
      setIsDismissing(false);
    }, 240);
  };

  if (!activeItem) return null;

  const { product, quantity, selectedSize } = activeItem;
  const image = product.images?.[0]?.src || "/brand-logo.webp";

  return (
    <aside
      className={`tz-cart-toast ${isDismissing ? "closing" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Item added to shopping bag"
    >
      <div className="tz-toast-inner">
        {/* Product Image Thumbnail */}
        <div className="tz-toast-thumb">
          <Image
            src={image}
            alt={product.name}
            width={48}
            height={56}
            className="tz-toast-img"
          />
        </div>

        {/* Details */}
        <div className="tz-toast-details">
          <div className="tz-toast-headline">
            <span className="tz-toast-check" aria-hidden="true">✓</span>
            <span className="tz-toast-status">ADDED TO BAG</span>
          </div>
          <p className="tz-toast-title" title={product.name}>
            {product.name}
          </p>
          <div className="tz-toast-meta">
            {selectedSize && <span className="tz-toast-size">Size: {selectedSize}</span>}
            {quantity > 1 && <span className="tz-toast-qty">Qty: {quantity}</span>}
            <span className="tz-toast-price">{formatPrice((product.price ?? 0) * quantity)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="tz-toast-actions">
          <button
            type="button"
            className="tz-toast-view-btn"
            onClick={() => {
              clearLastAddedItem();
              setActiveItem(null);
              openDrawer();
            }}
          >
            VIEW BAG
          </button>
          <button
            type="button"
            className="tz-toast-close-btn"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
