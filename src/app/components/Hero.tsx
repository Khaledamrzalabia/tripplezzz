"use client";

import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="hero" aria-label="Campaign hero">
      {/* Background image: The pair hoodies image from the reference mockup */}
      <div className="hero-bg" aria-hidden="true">
        <Image
          src="/hero-hoodies-pair.webp"
          alt="Triple Z Argentina Messi 10 Hoodies Campaign"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center center" }}
        />
      </div>
      <div className="hero-overlay" aria-hidden="true" />

      {/* Main Content */}
      <div className="hero-content">
        <div className="hero-text-block">
          {/* Top Eyebrow */}
          <div className="hero-top-eyebrow">
            <span className="hero-gold-dash" />
            <span className="hero-eyebrow-text">TRIPLE Z — NEW SEASON</span>
          </div>

          {/* Headline */}
          <h1 className="hero-headline">
            FOOTBALL,<br />
            WORN<br />
            <span className="hero-highlight-sky">DIFFERENTLY.</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subline">
            Premium streetwear inspired by football culture.<br />
            Designed for those who play by their own rules.
          </p>

          {/* Action Buttons */}
          <div className="hero-actions">
            <Link href="/shop" className="hero-btn-primary">
              SHOP THE COLLECTION
            </Link>
            <Link href="/collections" className="hero-btn-secondary">
              EXPLORE COLLECTIONS
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Corner Indicators (N badge & Scroll indicator) */}
      <div className="hero-bottom-indicators" aria-hidden="true">
        <div className="hero-indicator-badge">
          <span>N</span>
        </div>
        <div className="hero-indicator-scroll">
          <span className="hero-scroll-bar" />
          <span className="hero-scroll-label">SCROLL</span>
        </div>
      </div>

      {/* Mobile Animated Energy Strip: Ticker marquee and hype pill */}
      <div className="hero-mobile-ticker" aria-hidden="true">
        <div className="hero-ticker-track">
          <span className="hero-ticker-item">⚡ ARE YOU READY?</span>
          <span className="hero-ticker-item">TRIPLE Z STREETWEAR</span>
          <span className="hero-ticker-item">NEW SEASON DROPS</span>
          <span className="hero-ticker-item">MESSI 10 &bull; CR7 HERITAGE</span>
          <span className="hero-ticker-item">⚡ ARE YOU READY?</span>
          <span className="hero-ticker-item">TRIPLE Z STREETWEAR</span>
          <span className="hero-ticker-item">NEW SEASON DROPS</span>
          <span className="hero-ticker-item">MESSI 10 &bull; CR7 HERITAGE</span>
        </div>
      </div>
    </section>
  );
}
