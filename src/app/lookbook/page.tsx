import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lookbook & Editorial",
  description: "Triple Z Campaign Lookbook: Football Culture Worn Differently.",
};

const LOOKBOOK_ENTRIES = [
  {
    title: "THE CHAMPIONS OF THE WORLD",
    subtitle: "Argentina Series — Buenos Aires Terrace Editorial",
    image: "/campaign/banner-argentina.png",
    aspect: "landscape",
    productLink: "/collections/argentina",
    desc: "Shot on location against the dramatic sky and monument stone. Featuring the 500gsm La Pulga Signature Hoodie with golden embroidery and authentic AFA 3-star insignia.",
  },
  {
    title: "PASSION BEYOND BORDERS",
    subtitle: "Portugal Heritage — Lisbon Streetwear Vision",
    image: "/campaign/banner-portugal.png",
    aspect: "landscape",
    productLink: "/collections/portugal",
    desc: "A clash of crimson and forest green block paneling. An homage to golden generations and relentless football culture.",
  },
  {
    title: "THE CITADEL OF FOOTBALL",
    subtitle: "Street Silhouette & Contemplation",
    image: "/campaign/culture-seated-model.png",
    aspect: "panoramic",
    productLink: "/shop?category=bottoms",
    desc: "Capturing the calm between the storm. The full Triple Z tracksuit sitting upon neoclassical stone steps in dusk illumination.",
  },
  {
    title: "THREAD BY THREAD",
    subtitle: "Gold Ingot Embroidery Macro",
    image: "/craft/craft-embroidery.png",
    aspect: "square",
    productLink: "/shop",
    desc: "Extreme close-up revealing over 45,000 dense golden stitches across custom-textured heavyweight fleece.",
  },
  {
    title: "THE THREE STARS",
    subtitle: "AFA Crest & Sun of May Detailing",
    image: "/craft/craft-crest.png",
    aspect: "square",
    productLink: "/products/triple-z-la-pulga-hoodie",
    desc: "Precision metallic thread crest commemorating football immortality.",
  },
  {
    title: "STADIUM PITCH OUTERWEAR",
    subtitle: "Weatherproof Technical Shell",
    image: "/products/stadium-track-jacket.png",
    aspect: "tall",
    productLink: "/products/triple-z-stadium-track-jacket",
    desc: "Two-way golden zipper, tailored aerodynamic sleeves, and signature Argentine blue and gold piping.",
  },
];

export default function LookbookPage() {
  return (
    <div className="page-padding">
      <div className="site-container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "5rem" }}>
          <div className="mockup-eyebrow" style={{ justifyContent: "center" }}>
            <span className="mockup-gold-dash" />
            <span>EDITORIAL & CAMPAIGN</span>
          </div>
          <h1 className="section-title" style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}>
            LOOKBOOK
          </h1>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: "1.1rem", maxWidth: "600px", marginInline: "auto", marginTop: "1rem" }}>
            Football culture meets contemporary streetwear. Explore the visual narrative of Season 1.
          </p>
        </div>

        {/* Gallery Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6rem" }}>
          {LOOKBOOK_ENTRIES.map((entry, idx) => (
            <article key={idx} style={{ maxWidth: "1100px", marginInline: "auto", width: "100%" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: entry.aspect === "panoramic" ? "clamp(320px, 50vh, 580px)" : entry.aspect === "square" ? "clamp(340px, 60vh, 700px)" : "clamp(360px, 65vh, 720px)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                }}
              >
                <Image
                  src={entry.image}
                  alt={entry.title}
                  fill
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div style={{ marginTop: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--clr-accent)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {entry.subtitle}
                  </span>
                  <h2 style={{ fontSize: "1.8rem", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: "0.25rem", color: "var(--clr-text-primary)" }}>
                    {entry.title}
                  </h2>
                  <p style={{ color: "var(--clr-text-secondary)", maxWidth: "640px", marginTop: "0.5rem", lineHeight: 1.6, fontSize: "0.95rem" }}>
                    {entry.desc}
                  </p>
                </div>
                <Link href={entry.productLink} className="btn btn-pill-outline-sm">
                  <span>VIEW PIECE</span>
                  <span style={{ fontSize: "1rem" }}>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Banner */}
        <div style={{ marginTop: "8rem", textAlign: "center", background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-lg)", padding: "4rem 2rem" }}>
          <h3 style={{ fontSize: "2rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
            READY TO WEAR THE GAME?
          </h3>
          <p style={{ color: "var(--clr-text-secondary)", marginBottom: "2rem", maxWidth: "500px", marginInline: "auto" }}>
            Explore limited runs of our Season 1 drops before sizes sell out.
          </p>
          <Link href="/shop" className="btn btn-pill-white">
            SHOP THE FULL DROP →
          </Link>
        </div>
      </div>
    </div>
  );
}
