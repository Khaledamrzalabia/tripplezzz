"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCurrency, CURRENCIES, type CurrencyCode } from "../../context/CurrencyContext";
import { DEFAULT_STORE_SETTINGS, type SocialSettings } from "../../types/settings";

const FOOTER_SECTIONS = {
  SHOP: [
    { label: "All Products", href: "/shop" },
    { label: "New Arrivals", href: "/shop?sort=newest" },
    { label: "Gift Cards", href: "/shop?category=accessories" },
  ],
  ABOUT: [
    { label: "Our Story", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Size Guide", href: "/size-guide" },
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
  const [social, setSocial] = useState<SocialSettings>(DEFAULT_STORE_SETTINGS.social);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.social) setSocial(data.social);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="mockup-footer" role="contentinfo">
      <div className="site-container">
        {/* Top Grid */}
        <div className="mockup-footer-grid">
          {/* Col 1: Brand & Socials */}
          <div className="mockup-footer-brand-col">
            <Link href="/" className="mockup-footer-logo">
              TRIPLE Z
            </Link>
            <p className="mockup-footer-desc">
              Where contemporary fashion meets football culture.
            </p>
            {/* Social Icons */}
            <div className="mockup-footer-socials">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="mockup-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
              )}
              {social.tiktok && (
                <a href={social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="mockup-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.38a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.5 6.3 6.3 0 0 0 1.95-4.5V8.89a8.28 8.28 0 0 0 5.25 1.83V7.27a4.85 4.85 0 0 1-1.43-.58z"/>
                  </svg>
                </a>
              )}
              {social.whatsapp && (
                <a
                  href={social.whatsapp.startsWith("http") ? social.whatsapp : `https://wa.me/${social.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="mockup-social-icon"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="mockup-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                  </svg>
                </a>
              )}
              {social.x && (
                <a href={social.x} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="mockup-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Links Group (3 columns side-by-side on mobile, direct columns on desktop) */}
          <div className="mockup-footer-links-group">
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
          </div>

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
          <div className="mockup-footer-copyright">
            <span>&copy; 2026 Triple Z. All rights reserved.</span>
          </div>

          <div className="mockup-footer-currency-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>العملة:</span>
            <span style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "var(--clr-accent)",
              border: "1px solid rgba(226, 255, 76, 0.25)",
              padding: "2px 8px",
              borderRadius: "4px",
              background: "rgba(226, 255, 76, 0.05)"
            }}>
              🇪🇬 EGP • جنيه مصري
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}