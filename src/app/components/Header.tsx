"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import SearchModal from "./SearchModal";
import CartDrawer from "./CartDrawer";

const NAV_LINKS = [
  { label: "SHOP", href: "/shop" },
  { label: "COLLECTIONS", href: "/collections" },
  { label: "NEW ARRIVALS", href: "/shop?sort=newest" },
  { label: "ABOUT", href: "/about" },
  { label: "CONTACT", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const { totalItems, openDrawer } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Main Site Header */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          {/* Logo Image */}
          <Link href="/" className="header-logo" aria-label="Triple Z — Home">
            <Image
              src="/brand-logo.png"
              alt="Triple Z"
              width={160}
              height={56}
              priority
              unoptimized
              className="header-brand-logo-img"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="header-nav" aria-label="Primary navigation">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions: Search, Admin Studio, Bag */}
          <div className="header-actions">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="icon-btn"
              aria-label="Search catalogue"
              title="Search (Click or press Esc)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            <Link href="/admin" className="icon-btn" aria-label="Admin studio" title="Admin Studio">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>

            <button
              type="button"
              onClick={openDrawer}
              className="icon-btn"
              aria-label={`Shopping bag — ${totalItems} items`}
              title="Shopping Bag"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              <span className="cart-badge" aria-hidden="true">{totalItems}</span>
            </button>

            {/* Mobile hamburger */}
            <button
              className="mobile-menu-btn icon-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <div
        id="mobile-nav"
        className={`mobile-nav${mobileOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}
      >
        <div className="mobile-nav-drawer">
          <button
            className="mobile-nav-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
          <nav className="mobile-nav-links" aria-label="Mobile navigation">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              style={{ color: "var(--clr-accent)", marginTop: "1rem" }}
            >
              Admin Studio
            </Link>
          </nav>
        </div>
      </div>

      {/* Search Overlay Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Slide-out Cart Drawer */}
      <CartDrawer />
    </>
  );
}
