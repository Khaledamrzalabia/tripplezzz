import { Suspense } from "react";
import type { Metadata } from "next";
import { getAsyncServerProducts } from "../../lib/products.server";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop All Collections",
  description: "Explore the full Triple Z collection. Luxury hoodies, jackets, tees, and tracksuits inspired by football culture.",
};

export default async function ShopPage() {
  const products = await getAsyncServerProducts();

  return (
    <Suspense
      fallback={
        <div className="site-container" style={{ padding: "4rem 0", textAlign: "center" }}>
          Loading catalogue...
        </div>
      }
    >
      <ShopClient initialProducts={products} />
    </Suspense>
  );
}
