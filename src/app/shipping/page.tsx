import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Returns",
};

export default function Page() {
  return (
    <div className="policy-page">
      <div className="site-container policy-content">
        <Link href="/" style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          &larr; Home
        </Link>
        <h1 className="section-title" style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>Shipping & Returns</h1>
        <div className="policy-placeholder">This page contains placeholder policy information. Real shipping and returns policies must be provided by the business before launch.</div>
<h2>Shipping</h2>
<p>Shipping rates and delivery timescales will be calculated at checkout based on your location. We aim to dispatch orders within 2–5 business days.</p>
<h2>Returns</h2>
<p>If you are not satisfied with your purchase, please contact us within 14 days of receipt to discuss a return or exchange. Items must be unworn and in original packaging.</p>
<h2>Damaged or Incorrect Orders</h2>
<p>If your order arrives damaged or incorrect, please contact us immediately with a description and photos. We will make it right.</p>
      </div>
    </div>
  );
}