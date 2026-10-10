"use client";

import Link from "next/link";
import { useCurrency, CURRENCIES, type CurrencyCode } from "../../context/CurrencyContext";

const FOOTER_SECTIONS = {
  SHOP: [
    { label: "All Products", href: "/shop" },
    { label: "Collections", href: "/collections" },
    { label: "New Arrivals", href: "/shop?sort=newest" },
    { label: "Gift Cards", href: "/shop?category=accessories" },
  ],
  ABOUT: [
    { label: "Our Story", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Size Guide", href: "/size-guide" },
    { label: "Studio / Admin", href: "/admin" },
  ],
  SUPPORT: [
    { label: "Shipping & Returns", href: "/shipping" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "FAQ", href: "/faq" },
  ],
};

export default function Footer() {
  const { currency, setCurrency } = useCurrency();

  return (
    <footer className="mockup-footer" role="contentinfo">
      <div className="site-container">
        {/* Top 5-Column Grid */}
        <div className="mockup-footer-grid">
          {/* Col 1: Brand & Socials */}
          <div className="mockup-footer-brand-col">
            <Link href="/" className="mockup-footer-logo">
              TRIPLE Z
            </Link>
            <p className="mockup-footer-desc">
              Premium football streetwear. The brand where contemporary fashion meets football culture.
            </p>
            {/* Social Icons */}
            <div className="mockup-footer-socials">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="mockup-social-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="mockup-social-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.38a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.5 6.3 6.3 0 0 0 1.95-4.5V8.89a8.28 8.28 0 0 0 5.25 1.83V7.27a4.85 4.85 0 0 1-1.43-.58z"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="mockup-social-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                </svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="mockup-social-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2, 3, 4: Navigation Links */}
          {Object.entries(FOOTER_SECTIONS).map(([title, links]) => (
            <div key={title} className="mockup-footer-nav-col">
              <p className="mockup-footer-col-title">{title}</p>
              <ul className="mockup-footer-links">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Col 5: Right Slogan */}
          <div className="mockup-footer-slogan-col">
            <div className="mockup-footer-divider" />
            <div className="mockup-footer-slogan-content">
              <p className="mockup-footer-slogan">
                FOOTBALL.<br />
                WORN DIFFERENTLY.
              </p>
              <div className="mockup-footer-slogan-line">
                <span className="slogan-bar" />
                <span className="slogan-dot" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Currency & Copyright */}
        <div className="mockup-footer-bottom">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span>&copy; 2026 Triple Z. All rights reserved.</span>
            <span>Designed for the next generation.</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="tz-currency-select"
              aria-label="Footer currency selection"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol.trim()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}