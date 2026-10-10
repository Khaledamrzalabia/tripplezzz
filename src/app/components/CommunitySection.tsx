import Link from "next/link";
import Image from "next/image";

const COMMUNITY_IMAGES = [
  "/products/product-messi-back-pedestal.jpg",
  "/campaign/banner-argentina.png",
  "/craft/craft-stripe.png",
  "/campaign/banner-portugal.png",
  "/campaign/culture-seated-model.png",
];

export default function CommunitySection() {
  return (
    <section className="section mockup-community-section" aria-label="Community lookbook">
      <div className="site-container">
        <div className="mockup-community-grid">
          {/* 5 Photos */}
          {COMMUNITY_IMAGES.map((src, idx) => (
            <div key={idx} className="mockup-community-tile">
              <Image
                src={src}
                alt={`Triple Z community member ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}

          {/* 6th Tile: Join the Movement CTA */}
          <div className="mockup-community-tile mockup-community-cta">
            <div>
              <p className="community-cta-eyebrow">JOIN THE MOVEMENT</p>
              <h3 className="community-cta-tag">#TRIPLEZ</h3>
              <p className="community-cta-desc">
                Real people. Real style. Tag us to be featured.
              </p>
            </div>
            <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="community-arrow-btn" aria-label="Follow us on Instagram">
              →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
