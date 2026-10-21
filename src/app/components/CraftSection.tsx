import Link from "next/link";
import Image from "next/image";

const CRAFT_ITEMS = [
  {
    title: "PREMIUM EMBROIDERY",
    desc: "Details that last.",
  },
  {
    title: "LEGACY IN DETAILS",
    desc: "Inspired by heritage.",
  },
  {
    title: "REFINED CONSTRUCTION",
    desc: "Built for everyday.",
  },
];

interface Props {
  /** One image per craft card, in order */
  images: string[];
}

export default function CraftSection({ images }: Props) {
  return (
    <section className="section mockup-craft-section" aria-labelledby="craft-heading">
      <div className="site-container">
        <div className="mockup-craft-grid">
          {/* Left: 3 Detail Zoom Cards */}
          <div className="mockup-craft-cards-grid">
            {CRAFT_ITEMS.map((item, idx) => (
              <div key={idx} className="mockup-craft-card">
                <div className="mockup-craft-img-wrap">
                  <Image
                    src={images[idx]}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="mockup-craft-card-info">
                  <h3 className="craft-card-title">{item.title}</h3>
                  <p className="craft-card-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Narrative Block */}
          <div className="mockup-craft-narrative">
            <h2 className="mockup-craft-title" id="craft-heading">
              MORE THAN<br />
              A HOODIE.
            </h2>

            <p className="mockup-craft-text">
              From premium fabrics to intricate embroidery, every detail is designed with intention. We combine contemporary fashion with football heritage to create pieces that stand out on the streets and beyond.
            </p>

            <Link href="/about" className="btn btn-pill-outline-sm">
              <span>DISCOVER THE DETAILS</span>
              <span style={{ fontSize: "1rem" }}>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
