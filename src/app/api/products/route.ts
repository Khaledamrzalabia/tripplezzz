import { NextRequest, NextResponse } from "next/server";
import {
  getAsyncServerProducts,
  createServerProduct,
} from "../../../lib/products.server";
import type { Product } from "../../../types/product";

export async function GET() {
  const products = await getAsyncServerProducts();
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Security Check: Admin Authentication required to create products
    const adminSession = request.cookies.get("tz_admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { error: "غير مصرح لك بإضافة منتجات. يجب تسجيل الدخول كأدمن أولاً." },
        { status: 401 }
      );
    }
    const body = await request.json();
    const current = await getAsyncServerProducts();

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
      // If coming soon, omit price
      price: body.availability === "coming-soon" ? undefined : (body.price !== undefined && body.price !== "" ? Number(body.price) || 0 : undefined),
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

    await createServerProduct(newProduct);

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
