import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "../../../lib/adminAuth.server";
import {
  getAsyncServerProducts,
  createServerProduct,
} from "../../../lib/products.server";
import type { Product } from "../../../types/product";

// "" / null / undefined = unlimited stock; otherwise a whole number >= 0
function parseStock(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

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
    if (!(await isAdminRequest())) {
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

    // Product links must be unique: "hoodie" becomes "hoodie-2" when "hoodie" is taken
    const baseSlug = cleanSlug || `product-${Date.now().toString(36)}`;
    const takenSlugs = new Set((await getAsyncServerProducts()).map((p) => p.slug));
    let finalSlug = baseSlug;
    for (let n = 2; takenSlugs.has(finalSlug); n++) finalSlug = `${baseSlug}-${n}`;
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
      stock: parseStock(body.stock),
    };

    await createServerProduct(newProduct);

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
