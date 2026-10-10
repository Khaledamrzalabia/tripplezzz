import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-padding not-found">
      <div className="site-container" style={{ maxWidth: "700px", textAlign: "center", paddingBlock: "5rem 6rem" }}>
        {/* Subtle Brand Crest */}
        <div className="mockup-eyebrow" style={{ justifyContent: "center", marginBottom: "1rem" }}>
          <span className="mockup-gold-dash" />
          <span>OFF PITCH — 404</span>
          <span className="mockup-gold-dash" />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.5rem, 8vw, 6.5rem)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            lineHeight: 0.95,
            color: "#ffffff",
            marginBottom: "1.25rem",
          }}
        >
          PAGE NOT FOUND
        </h1>

        <p
          style={{
            fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
            color: "var(--clr-text-secondary)",
            lineHeight: 1.6,
            maxWidth: "520px",
            marginInline: "auto",
            marginBottom: "2.5rem",
          }}
        >
          The piece or collection you are looking for has been archived, moved, or never took the pitch.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-pill-white">
            <span>RETURN TO HOME</span>
            <span style={{ fontSize: "1.1rem" }}>→</span>
          </Link>
          <Link href="/shop" className="btn btn-pill-outline">
            <span>EXPLORE SHOP</span>
          </Link>
        </div>
      </div>
    </div>
  );
}