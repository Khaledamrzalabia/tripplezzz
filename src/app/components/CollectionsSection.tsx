import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    title: "HOODIES",
    subtitle: "Everyday cuts & oversized drops.",
    image: "/products/product-front-hoodie-pedestal.webp",
    href: "/shop?search=hoodie",
  },
  {
    title: "JACKETS",
    subtitle: "Technical pitch & matchday outerwear.",
    image: "/products/stadium-track-jacket.webp",
    href: "/shop?search=jacket",
  },
  {
    title: "TEES",
    subtitle: "Heavyweight combed cotton essentials.",
    image: "/products/pitch-black-tee.webp",
    href: "/shop?search=tee",
  },
  {
    title: "TRACKSUITS",
    subtitle: "Pitch & street engineered fit.",
    image: "/campaign/culture-seated-model.webp",
    href: "/shop?search=tracksuit",
  },
];

export default function CollectionsSection() {
  return (
    <section className="section mockup-collections-section" aria-labelledby="collections-heading">
      <div className="site-container">
        {/* Part 1: Nation Collections (Argentina, Portugal, etc.) */}
        <div className="mockup-section-header">
          <div>
            <h2 className="mockup-section-title" id="collections-heading">
              EXPLORE THE COLLECTIONS
            </h2>
            <p className="mockup-section-subtitle">Different nations. Same relentless passion.</p>
          </div>

          <Link href="/collections" className="btn btn-pill-outline-sm">
            <span>VIEW ALL COLLECTIONS</span>
            <span style={{ fontSize: "1rem" }}>→</span>
          </Link>
        </div>

        {/* 2 Major Banners (Argentina & Portugal) */}
        <div className="mockup-banners-grid">
          {/* Argentina Banner */}
          <div className="mockup-banner-card">
            <div className="mockup-banner-bg">
              <Image
                src="/campaign/banner-argentina.webp"
                alt="Argentina Collection"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="mockup-banner-overlay" />
            <div className="mockup-banner-content">
              <h3 className="mockup-banner-title">ARGENTINA<br />COLLECTION</h3>
              <p className="mockup-banner-desc">Heritage in every detail.</p>
              <Link href="/collections/argentina" className="btn btn-pill-white-sm">
                <span>SHOP NOW</span>
                <span style={{ fontSize: "1rem" }}>→</span>
              </Link>
            </div>
          </div>

          {/* Portugal Banner */}
          <div className="mockup-banner-card">
            <div className="mockup-banner-bg">
              <Image
                src="/campaign/banner-portugal.webp"
                alt="Portugal Collection"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="mockup-banner-overlay" />
            <div className="mockup-banner-content">
              <h3 className="mockup-banner-title">PORTUGAL<br />COLLECTION</h3>
              <p className="mockup-banner-desc">Passion beyond borders.</p>
              <Link href="/collections/portugal" className="btn btn-pill-white-sm">
                <span>SHOP NOW</span>
                <span style={{ fontSize: "1rem" }}>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Part 2: Dedicated Header for Our Clothes Group (Shop by Apparel) */}
        <div
          className="mockup-section-header mockup-apparel-header"
          style={{
            marginTop: "5rem",
            paddingTop: "2.75rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <h2 className="mockup-section-title" id="apparel-group-heading">
              SHOP BY APPAREL
            </h2>
            <p className="mockup-section-subtitle">
              Browse by silhouette — find all hoodies, jackets, tees & tracksuits across every collection.
            </p>
          </div>

          <Link href="/shop" className="btn btn-pill-outline-sm">
            <span>VIEW ALL APPAREL</span>
            <span style={{ fontSize: "1rem" }}>→</span>
          </Link>
        </div>

        {/* 4 Category Cards (Hoodies, Jackets, Tees, Tracksuits) */}
        <div className="mockup-categories-grid" aria-labelledby="apparel-group-heading">
          {CATEGORIES.map((cat, idx) => (
            <Link key={idx} href={cat.href} className="mockup-cat-card">
              <div className="mockup-cat-bg">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="mockup-cat-overlay" />
              <span className="mockup-card-heart" aria-hidden="true">
                ♡
              </span>
              <div className="mockup-cat-content">
                <div>
                  <h3 className="mockup-cat-title">{cat.title}</h3>
                  <p className="mockup-cat-desc">{cat.subtitle}</p>
                </div>
                <div className="mockup-cat-arrow" aria-hidden="true">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
