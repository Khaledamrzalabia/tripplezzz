import type { Metadata } from "next";
import Hero from "./components/Hero";
import ProductsSection from "./components/ProductsSection";
import CultureSection from "./components/CultureSection";
import CraftSection from "./components/CraftSection";
import CommunitySection from "./components/CommunitySection";
import Newsletter from "./components/Newsletter";
import { getAsyncServerProducts } from "../lib/products.server";
import { getStoreSettings } from "../lib/settings.server";

export const metadata: Metadata = {
  title: "Triple Z — Football Streetwear",
  description: "Premium football streetwear. Football, worn differently. Shop the winter collection.",
};

export default async function HomePage() {
  const [allProducts, settings] = await Promise.all([getAsyncServerProducts(), getStoreSettings()]);
  const { media } = settings;

  return (
    <>
      {/* 1. Hero Campaign Section */}
      <Hero media={media} />

      {/* 2. All Products — straight after the hero */}
      <ProductsSection
        products={allProducts}
        title={media.productsTitle}
        subtitle={media.productsSubtitle}
      />

      {/* 3. Football Culture — The Brand & Lifestyle Visual */}
      <CultureSection image={media.cultureImage} />

      {/* 4. Craft & Detail — More Than A Hoodie */}
      <CraftSection images={media.craftImages} />

      {/* 5. Community Lookbook — #TRIPLEZ */}
      <CommunitySection images={media.communityImages} />

      {/* 6. Newsletter — First Access. No Filler. */}
      <Newsletter />
    </>
  );
}
