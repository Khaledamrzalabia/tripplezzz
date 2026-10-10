import type { Metadata } from "next";
import Hero from "./components/Hero";
import FeaturedSection from "./components/FeaturedSection";
import CollectionsSection from "./components/CollectionsSection";
import CultureSection from "./components/CultureSection";
import CraftSection from "./components/CraftSection";
import CommunitySection from "./components/CommunitySection";
import Newsletter from "./components/Newsletter";
import { getFeaturedProducts } from "../lib/products";

export const metadata: Metadata = {
  title: "Triple Z — Football Streetwear",
  description: "Premium football streetwear. Football, worn differently. Shop the latest collections.",
};

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <>
      {/* 1. Hero Campaign Section */}
      <Hero />

      {/* 2. Featured Pieces Carousel / Grid */}
      <FeaturedSection products={featured} />

      {/* 3. Explore The Collections (Banners & Category Cards) */}
      <CollectionsSection />

      {/* 4. Football Culture — The Brand & Lifestyle Visual */}
      <CultureSection />

      {/* 5. Craft & Detail — More Than A Hoodie */}
      <CraftSection />

      {/* 6. Community Lookbook — #TRIPLEZ */}
      <CommunitySection />

      {/* 7. Newsletter — First Access. No Filler. */}
      <Newsletter />
    </>
  );
}
