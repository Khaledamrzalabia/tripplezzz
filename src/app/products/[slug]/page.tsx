import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAsyncServerProducts } from "../../../lib/products.server";
import { SITE_URL, absoluteUrl } from "../../../lib/site";
import { isProductComingSoon } from "../../../types/product";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const products = await getAsyncServerProducts();
  const product = products.find((p) => p.slug === slug || p.id === slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} | Triple Z`,
      description: product.description,
      images: product.images[0]?.src ? [{ url: product.images[0].src }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Triple Z`,
      description: product.description,
      images: product.images[0]?.src ? [product.images[0].src] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const products = await getAsyncServerProducts();
  const product = products.find((p) => p.slug === slug || p.id === slug);

  if (!product) {
    notFound();
  }

  const related = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((img) => absoluteUrl(img.src)),
    description: product.description,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "Triple Z",
    },
    // Search engines require a price on an Offer: teaser pieces without one get no offer
    ...(product.price
      ? {
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`,
            priceCurrency: "EGP",
            price: product.price,
            availability:
              product.availability === "out-of-stock"
                ? "https://schema.org/OutOfStock"
                : isProductComingSoon(product)
                ? "https://schema.org/PreOrder"
                : "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}