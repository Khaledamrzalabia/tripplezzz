"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error securely
    console.error("Triple Z runtime error:", error);
  }, [error]);

  return (
    <div className="page-padding">
      <div className="site-container" style={{ maxWidth: "680px", textAlign: "center", paddingBlock: "5rem 6rem" }}>
        <div className="mockup-eyebrow" style={{ justifyContent: "center", marginBottom: "1rem" }}>
          <span className="mockup-gold-dash" />
          <span>SYSTEM NOTICE</span>
          <span className="mockup-gold-dash" />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            lineHeight: 1,
            color: "#ffffff",
            marginBottom: "1rem",
          }}
        >
          SOMETHING WENT WRONG
        </h1>

        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--clr-text-secondary)",
            lineHeight: 1.6,
            maxWidth: "480px",
            marginInline: "auto",
            marginBottom: "2.5rem",
          }}
        >
          An unexpected error occurred while loading this view. You can attempt to refresh the component or return to the home pitch.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => reset()} className="btn btn-pill-white">
            <span>TRY AGAIN</span>
            <span style={{ fontSize: "1.1rem" }}>↻</span>
          </button>
          <Link href="/" className="btn btn-pill-outline">
            <span>RETURN HOME</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
