import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "../../components/ProductCard";
import { getAsyncServerProducts } from "../../../lib/products.server";
import { isProductComingSoon } from "../../../types/product";

const COLLECTION_META: Record<string, { name: string; description: string; image: string }> = {
  argentina: { name: "Argentina", description: "Heritage in every detail. Inspired by the champions of the world.", image: "/campaign/banner-argentina.webp" },
  portugal: { name: "Portugal", description: "Passion beyond borders. Crafted with iconic crimson and emerald tones.", image: "/campaign/banner-portugal.webp" },
  stadium: { name: "Stadium", description: "Match day energy you can wear anywhere. Technical meets streetwear.", image: "/products/stadium-track-jacket.webp" },
  core: { name: "Core", description: "The essentials refined. Timeless pieces with Triple Z attitude.", image: "/products/pitch-black-tee.webp" },
};

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const allProducts = await getAsyncServerProducts();
  const hasProducts = allProducts.some((p) => (p.collection || "").toLowerCase() === slug.toLowerCase());
  const meta = COLLECTION_META[slug] || (hasProducts ? {
    name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
    description: `Explore the Triple Z ${slug} collection. Limited edition streetwear.`,
    image: "/campaign/banner-argentina.webp",
  } : null);

  if (!meta) return {};
  return { title: meta.name + " Collection | Triple Z", description: meta.description };
}

export default async function CollectionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const allProducts = await getAsyncServerProducts();
  const products = allProducts
    .filter((p) => (p.collection || "").toLowerCase() === slug.toLowerCase())
    .sort((a, b) => {
      const aOpen = !isProductComingSoon(a);
      const bOpen = !isProductComingSoon(b);
      if (aOpen && !bOpen) return 1;
      if (!aOpen && bOpen) return -1;
      return 0;
    });

  const meta = COLLECTION_META[slug] || (products.length > 0 ? {
    name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
    description: `Explore the Triple Z ${slug} drop. Limited edition football streetwear.`,
    image: products[0]?.images[0]?.src || "/campaign/banner-argentina.webp",
  } : null);

  if (!meta) notFound();

  return (
    <div className="page-padding">
      <div className="site-container">
        <div style={{ position: "relative", height: "clamp(280px,40vh,480px)", marginBottom: "4rem", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <Image src={meta.image} alt={meta.name} fill sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 30%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 30%,rgba(10,10,10,0.85) 100%)" }} />
          <div style={{ position: "absolute", bottom: "2rem", left: "2rem" }}>
            <Link href="/collections" style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Back to Collections
            </Link>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem,7vw,5rem)", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1, marginTop: "0.5rem" }}>
              {meta.name}
            </h1>
            <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.95rem", marginTop: "0.5rem" }}>{meta.description}</p>
          </div>
        </div>
        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No products in this collection yet.</h3>
            <Link href="/shop" className="btn btn-outline" style={{ marginTop: "1.5rem" }}>Browse All Products</Link>
          </div>
        )}
      </div>
    </div>
  );
}