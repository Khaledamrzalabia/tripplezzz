"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getAllProducts } from "../../lib/products";
import { useCurrency } from "../../context/CurrencyContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const allProducts = getAllProducts();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setQuery("");
    }
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
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
  }, [isOpen, onClose]);

  const filtered = query.trim()
    ? allProducts.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.collection?.toLowerCase().includes(q)
        );
      })
    : [];

  if (!isOpen) return null;

  return (
    <div className="tz-search-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search Catalogue">
      <div className="tz-search-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="tz-search-input-wrap">
          <svg className="tz-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, collection, style..."
            className="tz-search-input"
            aria-label="Search items"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="tz-search-clear" aria-label="Clear search">
              ✕
            </button>
          )}
          <button type="button" onClick={onClose} className="tz-search-close-btn" aria-label="Close search">
            ✕
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="tz-search-quick-tags">
          <span className="tz-quick-label">POPULAR:</span>
          {["Argentina", "Portugal", "Stadium Jacket", "Hoodies", "Black Tee"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              className="tz-quick-pill"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="tz-search-results">
          {query.trim() === "" ? (
            <div className="tz-search-intro">
              <p className="tz-search-hint">Type to discover the collection or browse by football drops.</p>
              <div className="tz-search-features">
                <div className="tz-feat-tag">
                  <span className="tz-feat-dot" />
                  <span>3-Star Argentina Drop</span>
                </div>
                <div className="tz-feat-tag">
                  <span className="tz-feat-dot" />
                  <span>Portugal Heritage Fleece</span>
                </div>
                <div className="tz-feat-tag">
                  <span className="tz-feat-dot" />
                  <span>Stadium Weather-Resistant Shells</span>
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="tz-search-empty">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <Link href="/shop" onClick={onClose} className="btn btn-pill-outline-sm" style={{ marginTop: "1rem" }}>
                VIEW ALL PRODUCTS
              </Link>
            </div>
          ) : (
            <div className="tz-search-grid">
              {filtered.map((product) => {
                const img = product.images[0]?.src || "/hero.jpg";
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="tz-search-card"
                  >
                    <div className="tz-search-card-img">
                      <Image
                        src={img}
                        alt={product.name}
                        fill
                        sizes="80px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="tz-search-card-info">
                      <span className="tz-search-card-col">{product.collection?.toUpperCase() || "CORE"}</span>
                      <h4 className="tz-search-card-name">{product.name}</h4>
                      <span className="tz-search-card-price">{formatPrice(product.price)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
