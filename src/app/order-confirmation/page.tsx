"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "TZ-CONFIRMED";

  return (
    <div className="page-padding">
      <div className="site-container" style={{ maxWidth: "760px", textAlign: "center" }}>
        {/* Success Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid #10b981",
            color: "#10b981",
            fontSize: "2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginInline: "auto",
            marginBottom: "2rem",
          }}
        >
          ✓
        </div>

        <div className="mockup-eyebrow" style={{ justifyContent: "center" }}>
          <span className="mockup-gold-dash" />
          <span>ORDER CONFIRMED</span>
        </div>

        <h1 className="section-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", marginBottom: "1rem" }}>
          THANK YOU FOR YOUR ORDER
        </h1>

        <p style={{ color: "var(--clr-text-secondary)", fontSize: "1.1rem", marginBottom: "2rem" }}>
          Your order <strong>#{orderId}</strong> has been received and is currently being processed.
        </p>

        {/* Timeline Progress */}
        <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-lg)", padding: "2.5rem", marginBlock: "3rem", textAlign: "left" }}>
          <h2 style={{ fontSize: "1rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--clr-accent)", marginBottom: "2rem" }}>
            ORDER STATUS TIMELINE
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1.5rem", position: "relative" }}>
            <div style={{ borderLeft: "2px solid #10b981", paddingLeft: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700 }}>STEP 1 • COMPLETE</span>
              <p style={{ fontWeight: 600, marginTop: "0.25rem" }}>Order Confirmed</p>
              <span style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>Payment verified</span>
            </div>
            <div style={{ borderLeft: "2px solid var(--clr-accent)", paddingLeft: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-accent)", fontWeight: 700 }}>STEP 2 • IN PROGRESS</span>
              <p style={{ fontWeight: 600, marginTop: "0.25rem" }}>Quality Control</p>
              <span style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>Garment inspection</span>
            </div>
            <div style={{ borderLeft: "2px solid var(--clr-border)", paddingLeft: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", fontWeight: 700 }}>STEP 3 • UPCOMING</span>
              <p style={{ fontWeight: 600, marginTop: "0.25rem", color: "var(--clr-text-muted)" }}>Courier Dispatch</p>
              <span style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>Tracking number assigned</span>
            </div>
            <div style={{ borderLeft: "2px solid var(--clr-border)", paddingLeft: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", fontWeight: 700 }}>STEP 4 • UPCOMING</span>
              <p style={{ fontWeight: 600, marginTop: "0.25rem", color: "var(--clr-text-muted)" }}>Delivered</p>
              <span style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>At your doorstep</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1.25rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/shop" className="btn btn-pill-white">
            CONTINUE SHOPPING →
          </Link>
          <Link href="/" className="btn btn-pill-outline">
            RETURN TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
