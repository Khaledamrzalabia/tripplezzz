import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Triple Z — the brand, the culture, the vision.",
};

export default function AboutPage() {
  return (
    <div className="about-hero page-padding">
      <div className="site-container">
        <div className="about-content" style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p className="section-eyebrow" style={{ justifyContent: "center" }}>The Brand</p>
          <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>Football, Worn Differently.</h1>
          <p>
            Triple Z is a premium streetwear label rooted in football culture. We create pieces that exist beyond the stadium — made for those who live and breathe the game, on and off the pitch.
          </p>
          <p>
            Our garments are built with intention: quality construction, considered silhouettes, and a visual identity that speaks before you say a word.
          </p>
        </div>

        {/* Campaign image */}
        <div style={{ position: "relative", height: "clamp(320px, 55vh, 600px)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "5rem" }}>
          <Image src="/campaign/culture-seated-model.png" alt="Triple Z campaign" fill sizes="(max-width: 1024px) 100vw, 80vw" style={{ objectFit: "cover", objectPosition: "center 30%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(10,10,10,0.6) 100%)" }} />
        </div>

        {/* Values */}
        <div className="about-content" style={{ textAlign: "left", marginInline: "auto" }}>
          <h2 className="section-title" style={{ marginBottom: "2rem", textAlign: "center" }}>What We Stand For</h2>
          <div className="about-values">
            <div className="value-card">
              <div className="value-card-icon">⚽</div>
              <h3 className="value-card-title">Football Culture</h3>
              <p className="value-card-text">Born from the terraces, the training grounds, and the streets. Football is not just the sport — it is the attitude.</p>
            </div>
            <div className="value-card">
              <div className="value-card-icon">🧵</div>
              <h3 className="value-card-title">Quality First</h3>
              <p className="value-card-text">Every piece uses premium-weight fabrics and is built to last. We do not cut corners on construction or feel.</p>
            </div>
            <div className="value-card">
              <div className="value-card-icon">✦</div>
              <h3 className="value-card-title">Distinctive Identity</h3>
              <p className="value-card-text">Triple Z has a point of view. Our aesthetic is bold, intentional, and unmistakably ours.</p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
            <p style={{ color: "var(--clr-text-muted)", fontSize: "0.8rem", fontStyle: "italic", marginBottom: "2rem" }}>
              Detailed brand history and founding story to be added when verified information is available.
            </p>
            <Link href="/shop" className="btn btn-primary btn-lg">Shop the Collection</Link>
          </div>
        </div>
      </div>
    </div>
  );
}