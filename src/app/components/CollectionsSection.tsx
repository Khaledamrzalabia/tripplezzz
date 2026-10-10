import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    title: "HOODIES",
    subtitle: "Iconic fits, everyday wear.",
    image: "/products/product-front-hoodie-pedestal.jpg",
    href: "/shop?category=tops",
  },
  {
    title: "JACKETS",
    subtitle: "For the streets.",
    image: "/products/stadium-track-jacket.png",
    href: "/shop?category=outerwear",
  },
  {
    title: "TEES",
    subtitle: "Minimal. Bold.",
    image: "/products/pitch-black-tee.png",
    href: "/shop?category=tops",
  },
  {
    title: "TRACKSUITS",
    subtitle: "Game-ready style.",
    image: "/campaign/culture-seated-model.png",
    href: "/shop?category=bottoms",
  },
];

export default function CollectionsSection() {
  return (
    <section className="section mockup-collections-section" aria-labelledby="collections-heading">
      <div className="site-container">
        {/* Header */}
        <div className="mockup-section-header">
          <div>
            <div className="mockup-eyebrow">
              <span className="mockup-gold-dash" />
              <span>EXPLORE THE COLLECTIONS</span>
            </div>
            <h2 className="mockup-section-title" id="collections-heading">
              EXPLORE THE COLLECTIONS
            </h2>
            <p className="mockup-section-subtitle">Different stories. Same passion.</p>
          </div>

          <Link href="/collections" className="btn btn-pill-outline-sm">
            <span>VIEW ALL COLLECTIONS</span>
            <span style={{ fontSize: "1rem" }}>→</span>
          </Link>
        </div>

        {/* 2 Major Banners */}
        <div className="mockup-banners-grid">
          {/* Argentina Banner */}
          <div className="mockup-banner-card">
            <div className="mockup-banner-bg">
              <Image
                src="/campaign/banner-argentina.png"
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
                src="/campaign/banner-portugal.png"
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

        {/* 4 Category Cards */}
        <div className="mockup-categories-grid">
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
                  <h4 className="mockup-cat-title">{cat.title}</h4>
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
