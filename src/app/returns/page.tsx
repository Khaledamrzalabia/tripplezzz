import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description: "Learn about Triple Z's 14-day hassle-free return and exchange policy.",
};

export default function ReturnsPage() {
  return (
    <div className="page-padding">
      <div className="site-container" style={{ maxWidth: "840px" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div className="mockup-eyebrow" style={{ justifyContent: "center" }}>
            <span className="mockup-gold-dash" />
            <span>HASSLE-FREE PROMISE</span>
          </div>
          <h1 className="section-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
            RETURNS & EXCHANGES
          </h1>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: "1rem", marginTop: "1rem" }}>
            We want you to be completely satisfied with your piece. We offer simple 14-day returns and exchanges.
          </p>
        </div>

        {/* 3 Step Process */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "4rem" }}>
          <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-md)", padding: "2rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--clr-accent)", display: "block", marginBottom: "0.5rem" }}>01</span>
            <h3 style={{ fontSize: "1.1rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>REQUEST</h3>
            <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Contact returns@triple-z.com with your order number and specify whether you need an exchange or a refund.
            </p>
          </div>
          <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-md)", padding: "2rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--clr-accent)", display: "block", marginBottom: "0.5rem" }}>02</span>
            <h3 style={{ fontSize: "1.1rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>PICKUP</h3>
            <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Our authorized courier partner will collect the boxed item from your address free of charge for eligible exchanges.
            </p>
          </div>
          <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-md)", padding: "2rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--clr-accent)", display: "block", marginBottom: "0.5rem" }}>03</span>
            <h3 style={{ fontSize: "1.1rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>REFUND OR SHIP</h3>
            <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Once inspected, replacement sizes are dispatched immediately, or refunds are credited to your original payment method in 3–5 days.
            </p>
          </div>
        </div>

        {/* Policy Terms */}
        <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-lg)", padding: "2.5rem", marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.3rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem" }}>
            RETURN CONDITIONS
          </h2>
          <ul style={{ color: "var(--clr-text-secondary)", lineHeight: 1.8, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <li>Items must be returned within 14 calendar days of confirmed delivery.</li>
            <li>Garments must be in pristine, unworn condition with original brand tags and packaging intact.</li>
            <li>Limited edition tournament memorabilia must not exhibit any signs of wear, fragrance, or handling damage.</li>
            <li>Exchanges for another size or colourway are free for the first occurrence.</li>
          </ul>

          <div style={{ marginTop: "2.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/contact" className="btn btn-pill-white">
              START A RETURN →
            </Link>
            <Link href="/shop" className="btn btn-pill-outline">
              BACK TO SHOPPING
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
