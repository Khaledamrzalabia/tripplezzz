import { NextResponse } from "next/server";
import { getServerProducts, saveServerProducts } from "../../../lib/products.server";
import type { Product } from "../../../types/product";

export async function GET() {
  const products = getServerProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = getServerProducts();

    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: "Product name and category are required." },
        { status: 400 }
      );
    }

    // Generate slug from name if not provided
    const slug =
      body.slug?.trim() ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newProduct: Product = {
      id: body.id || `tz-${Date.now().toString().slice(-4)}`,
      slug: slug || `product-${Date.now()}`,
      name: body.name.trim(),
      description: body.description?.trim() || "",
      longDescription: body.longDescription?.trim() || "",
      // If coming soon, omit or don't set price
      price: body.availability === "coming-soon" ? undefined : Number(body.price) || 0,
      currency: body.currency || "USD",
      images: Array.isArray(body.images) && body.images.length > 0
        ? body.images
        : [{ src: "/hero.jpg", alt: body.name }],
      category: body.category || "tops",
      collection: body.collection || "core",
      sizes: Array.isArray(body.sizes) ? body.sizes : ["S", "M", "L", "XL"],
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : ["#0a0a0a", "#4a7c9d", "#c9a96e"],
      availability: body.availability || "in-stock",
      isBlurred: Boolean(body.isBlurred || body.availability === "coming-soon"),
      featured: Boolean(body.featured),
      isPlaceholder: false,
    };

    const updated = [newProduct, ...current];
    saveServerProducts(updated);

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
