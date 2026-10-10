"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrency, CURRENCIES, type CurrencyCode } from "../../context/CurrencyContext";

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  const { currency, setCurrency } = useCurrency();

  if (dismissed) return null;

  return (
    <div className="tz-announcement-bar" role="region" aria-label="Announcement">
      <div className="site-container tz-announcement-inner">
        {/* Left: Brand Tag */}
        <div className="tz-announcement-left">
          <span className="tz-announcement-badge">LIMITED DROP</span>
          <span className="tz-announcement-msg">
            NEW SEASON LIVE • FREE SHIPPING ON ORDERS OVER $150
          </span>
        </div>

        {/* Center Link */}
        <div className="tz-announcement-center">
          <Link href="/collections/argentina" className="tz-announcement-link">
            DISCOVER THE ARGENTINA DROP →
          </Link>
        </div>

        {/* Right: Currency Selector & Dismiss */}
        <div className="tz-announcement-right">
          <label htmlFor="currency-select-top" className="sr-only">Select Currency</label>
          <select
            id="currency-select-top"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="tz-currency-select"
            aria-label="Change currency"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol.trim()})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="tz-announcement-close"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
