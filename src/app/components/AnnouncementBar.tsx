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
            TRIPLE Z • قطع ليمتد إيديشن بأعداد حصرية محدودة • شحن لكافة محافظات مصر
          </span>
        </div>

        {/* Center Link */}
        <div className="tz-announcement-center">
          <Link href="/#products" className="tz-announcement-link">
            SHOP THE WINTER COLLECTION →
          </Link>
        </div>

        {/* Right: Currency Indicator & Dismiss */}
        <div className="tz-announcement-right">
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--clr-accent)", letterSpacing: "0.08em" }}>
            EGP • ج.م
          </span>

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
