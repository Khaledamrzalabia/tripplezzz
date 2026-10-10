import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function Page() {
  return (
    <div className="policy-page">
      <div className="site-container policy-content">
        <Link href="/" style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          &larr; Home
        </Link>
        <h1 className="section-title" style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>Terms of Service</h1>
        <div className="policy-placeholder">This is a placeholder terms of service. Legally reviewed terms must be drafted before launch.</div>
<h2>Use of the Site</h2>
<p>By accessing this site you agree to use it only for lawful purposes and in a manner that does not infringe the rights of others.</p>
<h2>Products</h2>
<p>All product descriptions are provided in good faith. Prices and availability are subject to change without notice.</p>
<h2>Intellectual Property</h2>
<p>All content on this site, including the Triple Z name, logo, and imagery, is the intellectual property of Triple Z.</p>
<h2>Limitation of Liability</h2>
<p>Triple Z will not be liable for any indirect, incidental, or consequential damages arising from use of this site.</p>
      </div>
    </div>
  );
}