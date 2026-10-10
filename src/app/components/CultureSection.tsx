import Link from "next/link";
import Image from "next/image";

export default function CultureSection() {
  return (
    <section className="section mockup-culture-section" aria-labelledby="culture-heading">
      <div className="site-container">
        <div className="mockup-culture-grid">
          {/* Left Column: Narrative & Stats */}
          <div className="mockup-culture-left">
            <h2 className="mockup-culture-title" id="culture-heading">
              FOOTBALL CULTURE.<br />
              WORN YOUR WAY.
            </h2>

            <p className="mockup-culture-desc">
              Triple Z is a premium streetwear label rooted in football culture. We create pieces that live beyond the stadium — built for those who carry the game with them everywhere.
            </p>

            <Link href="/about" className="btn btn-pill-outline-sm mockup-culture-btn">
              <span>OUR STORY</span>
              <span style={{ fontSize: "1rem" }}>→</span>
            </Link>

            {/* 3 Numbered Pillars */}
            <div className="mockup-culture-pillars">
              <div className="mockup-culture-pillar">
                <span className="pillar-num">01</span>
                <span className="pillar-text">FOOTBALL CULTURE</span>
              </div>
              <div className="mockup-culture-pillar">
                <span className="pillar-num">02</span>
                <span className="pillar-text">PREMIUM QUALITY</span>
              </div>
              <div className="mockup-culture-pillar">
                <span className="pillar-num">03</span>
                <span className="pillar-text">GLOBAL COMMUNITY</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Lifestyle Visual */}
          <div className="mockup-culture-right">
            <div className="mockup-culture-img-container">
              <Image
                src="/campaign/culture-seated-model.webp"
                alt="Triple Z Football Culture Lifestyle"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />

              {/* Floating Quote Card */}
              <div className="mockup-culture-floating-quote">
                <p className="quote-text">
                  SAME GAME.<br />
                  DIFFERENT<br />
                  PERSPECTIVE.
                </p>
                <div className="quote-emblem" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--clr-accent)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="4"/>
                    <line x1="12" y1="20" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
                    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="4" y2="12"/>
                    <line x1="20" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
                    <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
