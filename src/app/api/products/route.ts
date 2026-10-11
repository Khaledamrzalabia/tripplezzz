import { NextRequest, NextResponse } from "next/server";
import {
  getAsyncServerProducts,
  createServerProduct,
} from "../../../lib/products.server";
import type { Product } from "../../../types/product";

export async function GET() {
  const products = await getAsyncServerProducts();
  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
    },
  });
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

    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: "Product name and category are required." },
        { status: 400 }
      );
    }

    // Generate slug from name or slug input, safely supporting Arabic and English
    const rawInputSlug = body.slug?.trim();
    const cleanSlug = rawInputSlug
      ? rawInputSlug.toLowerCase().replace(/[^\p{L}\p{N}\-_]/gu, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
      : body.name
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s\-_]/gu, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

    const finalSlug = cleanSlug || `product-${Date.now().toString(36)}`;
    const finalId = body.id || `tz-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    const newProduct: Product = {
      id: finalId,
      slug: finalSlug,
      name: body.name.trim(),
      description: body.description?.trim() || "",
      longDescription: body.longDescription?.trim() || "",
      craftSpecs: Array.isArray(body.craftSpecs) ? body.craftSpecs : [],
      fitSilhouette: body.fitSilhouette?.trim() || "",
      garmentCare: body.garmentCare?.trim() || "",
      price: body.price !== undefined && body.price !== "" && Number(body.price) > 0 ? Number(body.price) : undefined,
      currency: body.currency || "EGP",
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
