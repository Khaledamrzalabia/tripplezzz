"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 3;

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 1 ? totalSlides : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev === totalSlides ? 1 : prev + 1));
  };

  return (
    <section className="hero" aria-label="Campaign hero">
      {/* Background image: The user's requested pair hoodies image */}
      <div className="hero-bg" aria-hidden="true">
        <Image
          src="/hero-hoodies-pair.jpg"
          alt="Triple Z Argentina Messi 10 Hoodies Campaign"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "68% 32%" }}
        />
      </div>
      <div className="hero-overlay" aria-hidden="true" />

      {/* Main Content */}
      <div className="hero-content site-container">
        {/* Top Eyebrow */}
        <div className="hero-top-eyebrow">
          <span className="hero-gold-dash" />
          <span className="hero-eyebrow-text">NEW SEASON</span>
        </div>

        {/* Brand Crest */}
        <div className="hero-brand-crest" aria-hidden="true">
          <span className="hero-crest-stars">★★★</span>
          <span className="hero-crest-text">TRIPLE Z</span>
        </div>

        {/* Headline */}
        <h1 className="hero-headline">
          FOOTBALL,<br />
          WORN<br />
          <span className="hero-highlight-sky">DIFFERENTLY.</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subline">
          Premium streetwear inspired by football culture. Designed for those who play by their own rules.
        </p>

        {/* Action Buttons */}
        <div className="hero-actions">
          <Link href="/shop" className="btn btn-pill-white">
            <span>SHOP THE COLLECTION</span>
            <span style={{ fontSize: "1.1rem" }}>→</span>
          </Link>
          <Link href="/lookbook" className="btn btn-pill-outline">
            <span style={{ fontSize: "0.85rem" }}>▶</span>
            <span>WATCH FILM</span>
          </Link>
        </div>

        {/* Bottom Bar: 3 Pillars (Left) & Collection Navigator (Right) */}
        <div className="hero-bottom-bar">
          <div className="hero-pillars">
            <div className="hero-pillar-item">
              <span className="pillar-icon">⚽</span>
              <span className="pillar-label">FOOTBALL HERITAGE</span>
            </div>
            <div className="hero-pillar-item">
              <span className="pillar-icon">💎</span>
              <span className="pillar-label">PREMIUM MATERIALS</span>
            </div>
            <div className="hero-pillar-item">
              <span className="pillar-icon">⭐</span>
              <span className="pillar-label">CONTEMPORARY STREETWEAR</span>
            </div>
          </div>

          <div className="hero-slider-nav">
            <div className="hero-slider-tag">
              <span className="hero-gold-dash-sm" />
              <span>ARGENTINA COLLECTION</span>
            </div>
            <div className="hero-slider-controls">
              <span className="hero-counter">0{currentSlide} / 0{totalSlides}</span>
              <div className="hero-arrow-btns">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="hero-arrow-btn"
                  aria-label="Previous slide"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="hero-arrow-btn"
                  aria-label="Next slide"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
