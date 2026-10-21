"use client";

import { useState, type FormEvent } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus("error");
      setMsg("Please enter your email.");
      return;
    }
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 600));
    setStatus("success");
    setMsg("You're on the list. Expect the unexpected.");
    setEmail("");
  };

  return (
    <section className="mockup-newsletter-section" aria-label="Newsletter signup">
      <div className="site-container">
        <div className="mockup-newsletter-grid">
          {/* Left: Heading & Info */}
          <div>
            <h2 className="mockup-newsletter-title">
              FIRST ACCESS. NO FILLER.
            </h2>
            <p className="mockup-newsletter-desc">
              Drop alerts, exclusive releases, and campaign previews — direct to your inbox.
            </p>
          </div>

          {/* Right: Input & Join Button */}
          <div>
            <form className="mockup-newsletter-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                className="mockup-newsletter-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setMsg(""); }}
                disabled={status === "loading" || status === "success"}
                autoComplete="email"
                required
              />
              <button
                type="submit"
                className="mockup-newsletter-btn"
                disabled={status === "loading" || status === "success"}
              >
                {status === "loading" ? "..." : status === "success" ? "JOINED" : "JOIN"}
              </button>
            </form>

            <p className="mockup-newsletter-disclaimer">
              {msg ? (
                <span style={{ color: status === "success" ? "var(--clr-success)" : "var(--clr-error)" }}>{msg}</span>
              ) : (
                "No spam. Unsubscribe anytime."
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
