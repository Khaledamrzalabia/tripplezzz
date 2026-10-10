import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProductsByCollection } from "../../lib/products";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse all Triple Z collections.",
};

const COLLECTIONS = [
  { slug: "argentina", name: "Argentina", description: "Heritage in every detail. Inspired by football champions.", image: "/campaign/banner-argentina.png" },
  { slug: "portugal", name: "Portugal", description: "Passion beyond borders. Historic crimson & emerald details.", image: "/campaign/banner-portugal.png" },
  { slug: "stadium", name: "Stadium", description: "Match day energy, everyday wearability and technical outerwear.", image: "/products/stadium-track-jacket.png" },
  { slug: "core", name: "Core", description: "The essentials. Timeless basics with Triple Z attitude.", image: "/products/pitch-black-tee.png" },
];

export default function CollectionsPage() {
  return (
    <div className="page-padding">
      <div className="site-container">
        <p className="section-eyebrow">Browse</p>
        <h1 className="section-title" style={{ marginBottom: "0.75rem" }}>Collections</h1>
        <p style={{ color: "var(--clr-text-secondary)", marginBottom: "3rem", fontSize: "0.95rem" }}>
          Curated drops with a coherent point of view.
        </p>
        <div className="collections-grid">
          {COLLECTIONS.map((c) => {
            const count = getProductsByCollection(c.slug).length;
            return (
              <Link key={c.slug} href={`/collections/${c.slug}`} className="collection-card">
                <div className="collection-card-bg">
                  <Image src={c.image} alt={c.name} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: "cover" }} />
                </div>
                <div className="collection-card-overlay" aria-hidden="true" />
                <div className="collection-card-body">
                  <h2 className="collection-card-name">{c.name}</h2>
                  <p className="collection-card-count">{count} piece{count !== 1 ? "s" : ""} — {c.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
