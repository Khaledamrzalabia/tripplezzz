"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "../../context/CartContext";
import { useSiteMedia } from "../../context/SiteMediaContext";

interface Props {
  onOpenSearch: () => void;
  onOpenMenu: () => void;
}

export default function MobileBottomNav({ onOpenSearch, onOpenMenu }: Props) {
  const { logo } = useSiteMedia();
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
  const isShop = pathname === "/shop" || pathname?.startsWith("/products");

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

      {/* Center Brand Logo button — redirects to Home */}
      <Link
        href="/"
        className="tz-bottom-nav-item tz-bottom-nav-logo-btn"
        aria-label="Triple Z Home"
      >
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(226, 255, 76, 0.15) 0%, rgba(201, 169, 110, 0.25) 100%)",
          border: "1px solid var(--clr-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 12px rgba(226, 255, 76, 0.25)",
          overflow: "hidden"
        }}>
          <Image
            src={logo}
            alt="Triple Z"
            width={30}
            height={30}
            style={{ objectFit: "contain", transform: "scale(1.2)" }}
          />
        </div>
        <span style={{ fontSize: "0.62rem", color: "var(--clr-accent)", fontWeight: 800 }}>Triple Z</span>
      </Link>

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
