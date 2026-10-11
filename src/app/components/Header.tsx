"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "../../context/CartContext";
import { useCurrency, CURRENCIES, type CurrencyCode } from "../../context/CurrencyContext";
import dynamic from "next/dynamic";
import MobileBottomNav from "./MobileBottomNav";
import CartToast from "./CartToast";

const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });
const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

const NAV_LINKS = [
  { label: "SHOP", href: "/shop" },
  { label: "COLLECTIONS", href: "/collections" },
  { label: "NEW ARRIVALS", href: "/shop?sort=newest" },
  { label: "ABOUT", href: "/about" },
  { label: "CONTACT", href: "/contact" },
];

const QUICK_COLLECTIONS = [
  { label: "Argentina", href: "/collections/argentina" },
  { label: "Portugal", href: "/collections/portugal" },
  { label: "Hoodies", href: "/shop?search=hoodie" },
  { label: "Jackets", href: "/shop?search=jacket" },
  { label: "Tees", href: "/shop?search=tee" },
];

export default function Header() {
  const pathname = usePathname();
  const { totalItems, openDrawer, closeDrawer, isDrawerOpen } = useCart();
  const { currency, setCurrency } = useCurrency();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Prevent multiple open drawers and manage body lock
  const handleOpenMobile = () => {
    closeDrawer();
    setMobileOpen(true);
  };

  const handleOpenCart = () => {
    setMobileOpen(false);
    openDrawer();
  };

  useEffect(() => {
    const isAnyOpen = mobileOpen || isDrawerOpen;
    if (isAnyOpen) {
      document.body.classList.add("drawer-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("drawer-open");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("drawer-open");
      document.body.style.overflow = "";
    };
  }, [mobileOpen, isDrawerOpen]);

  return (
    <>
      {/* Main Site Header */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          {/* Logo Image */}
          <Link href="/" className="header-logo" aria-label="Triple Z — Home">
            <Image
              src="/brand-logo.webp"
              alt="Triple Z"
              width={160}
              height={56}
              priority
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

          {/* Actions: Search, Admin Studio (Desktop), Bag, Mobile Hamburger */}
          <div className="header-actions">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="icon-btn header-search-btn"
              aria-label="Search catalogue"
              title="Search (Click or press Esc)"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            <Link href="/account" className="icon-btn header-account-btn" aria-label="Customer account" title="حسابي / My Account">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>

            <button
              type="button"
              onClick={handleOpenCart}
              className="icon-btn header-cart-btn"
              aria-label={`Shopping bag — ${totalItems} items`}
              title="Shopping Bag"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {totalItems > 0 && (
                <span className={`cart-badge ${badgeBump ? "badge-bump" : ""}`} aria-hidden="true">{totalItems}</span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="mobile-menu-btn icon-btn"
              onClick={handleOpenMobile}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Modern High-End Mobile Nav Drawer */}
      <div
        id="mobile-nav"
        className={`mobile-nav${mobileOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}
      >
        <div className="mobile-nav-drawer">
          {/* Drawer Top Header */}
          <div className="mobile-nav-header">
            <Link href="/" onClick={() => setMobileOpen(false)} className="mobile-drawer-logo">
              <Image
                src="/brand-logo.webp"
                alt="Triple Z"
                width={120}
                height={42}
                style={{ height: "36px", width: "auto", objectFit: "contain" }}
              />
            </Link>
            <button
              className="mobile-nav-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
            >
              ✕
            </button>
          </div>

          {/* Quick Search Action */}
          <button
            type="button"
            className="mobile-nav-search-trigger"
            aria-label="Search products, collections"
            onClick={() => {
              setMobileOpen(false);
              setSearchOpen(true);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>Search products, collections...</span>
          </button>

          {/* Primary Navigation Links */}
          <nav className="mobile-nav-links" aria-label="Mobile navigation">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                aria-current={pathname === l.href ? "page" : undefined}
                className="mobile-nav-link-row"
              >
                <span>{l.label}</span>
                <span className="mobile-nav-arrow">→</span>
              </Link>
            ))}
          </nav>

          {/* Quick Collections Pills */}
          <div className="mobile-nav-quick-group">
            <span className="mobile-nav-group-title">QUICK COLLECTIONS</span>
            <div className="mobile-nav-pills">
              {QUICK_COLLECTIONS.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={() => setMobileOpen(false)}
                  className="mobile-nav-pill"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Drawer Bottom Controls: Currency & Admin & Bag */}
          <div className="mobile-nav-footer">
            <div className="mobile-nav-currency-wrap">
              <label htmlFor="mobile-drawer-currency" className="mobile-nav-currency-label">CURRENCY:</label>
              <select
                id="mobile-drawer-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="mobile-nav-currency-select"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol.trim()})
                  </option>
                ))}
              </select>
            </div>

            <div className="mobile-nav-bottom-links">
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="mobile-nav-admin-link"
              >
                👤 حسابي / My Account
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  openDrawer();
                }}
                className="mobile-nav-bag-btn"
              >
                Bag ({totalItems})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Overlay Modal — lazy chunk loaded only when triggered */}
      {searchOpen && (
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}

      {/* Slide-out Cart Drawer — self-contained exit animation */}
      <CartDrawer />

      {/* Floating non-intrusive luxury Cart Toast */}
      <CartToast />

      {/* Mobile Bottom Dock / Quick Nav */}
      <MobileBottomNav
        onOpenSearch={() => setSearchOpen(true)}
        onOpenMenu={handleOpenMobile}
      />
    </>
  );
}
