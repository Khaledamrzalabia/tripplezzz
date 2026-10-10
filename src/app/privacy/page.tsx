import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function Page() {
  return (
    <div className="policy-page">
      <div className="site-container policy-content">
        <Link href="/" style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          &larr; Home
        </Link>
        <h1 className="section-title" style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>Privacy Policy</h1>
        <div className="policy-placeholder">This is a placeholder privacy policy. A legally reviewed privacy policy must be drafted before launch.</div>
<h2>Information We Collect</h2>
<p>We collect information you provide when placing an order or signing up for our newsletter, including your name, email, and shipping address.</p>
<h2>How We Use It</h2>
<p>Your information is used solely to process orders and send relevant communications. We do not sell your data to third parties.</p>
<h2>Cookies</h2>
<p>We use essential cookies to maintain your cart session. No tracking cookies are deployed without consent.</p>
<h2>Contact</h2>
<p>For privacy inquiries, contact us via the <a href="/contact">contact page</a>.</p>
      </div>
    </div>
  );
}