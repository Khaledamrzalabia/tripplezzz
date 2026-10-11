"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "../../context/CartContext";

interface Props {
  onOpenSearch: () => void;
  onOpenMenu: () => void;
}

export default function MobileBottomNav({ onOpenSearch, onOpenMenu }: Props) {
  const pathname = usePathname();
  const { totalItems, openDrawer } = useCart();
  const [badgeBump, setBadgeBump] = useState(false);
  const prevItemsRef = useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevItemsRef.current) {
      setBadgeBump(true);
      const timer = setTimeout(() => setBadgeBump(false), 450);
      return () => clearTimeout(timer);
    }
    prevItemsRef.current = totalItems;
  }, [totalItems]);

  // Hide bottom nav on admin routes, checkout funnel, and single product pages (where sticky buy bar takes over)
  if (pathname?.startsWith("/admin") || pathname === "/checkout" || pathname?.startsWith("/products/")) {
    return null;
  }

  const isHome = pathname === "/";
  const isShop = pathname === "/shop" || pathname?.startsWith("/collections") || pathname?.startsWith("/products");

  return (
    <nav className="tz-mobile-bottom-nav" aria-label="Mobile quick navigation">
      <Link
        href="/"
        className={`tz-bottom-nav-item ${isHome ? "active" : ""}`}
        aria-label="Home"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isHome ? "2.2" : "1.75"}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </Link>

      <Link
        href="/shop"
        className={`tz-bottom-nav-item ${isShop && !isHome ? "active" : ""}`}
        aria-label="Shop"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isShop ? "2.2" : "1.75"}>
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Shop</span>
      </Link>

      <button
        type="button"
        onClick={onOpenSearch}
        className="tz-bottom-nav-item"
        aria-label="Search"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>Search</span>
      </button>

      <button
        type="button"
        onClick={openDrawer}
        className="tz-bottom-nav-item"
        aria-label={`Shopping bag with ${totalItems} items`}
      >
        <div className="tz-bottom-bag-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {totalItems > 0 && (
            <span className={`tz-bottom-nav-badge ${badgeBump ? "badge-bump" : ""}`}>{totalItems}</span>
          )}
        </div>
        <span>Bag</span>
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        className="tz-bottom-nav-item"
        aria-label="Open full menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <line x1="4" y1="7" x2="20" y2="7"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="17" x2="20" y2="17"/>
        </svg>
        <span>Menu</span>
      </button>
    </nav>
  );
}
