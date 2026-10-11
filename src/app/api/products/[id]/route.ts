import { NextRequest, NextResponse } from "next/server";
import {
  getAsyncServerProducts,
  updateServerProduct,
  deleteServerProduct,
} from "../../../../lib/products.server";
import type { Product } from "../../../../types/product";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const products = await getAsyncServerProducts();
  const product = products.find((p) => p.id === id || p.slug === id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  try {
    const adminSession = request.cookies.get("tz_admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const isComingSoon = body.availability === "coming-soon";

    let cleanSlug: string | undefined = undefined;
    if (body.slug !== undefined) {
      const trimmed = body.slug.trim();
      if (trimmed) {
        cleanSlug = trimmed;
      } else if (body.name?.trim()) {
        cleanSlug = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      }
    }

    const updateData: Partial<Product> = {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(cleanSlug !== undefined && { slug: cleanSlug }),
      ...(body.description !== undefined && { description: body.description.trim() }),
      ...(body.longDescription !== undefined && { longDescription: body.longDescription.trim() }),
      ...(body.price !== undefined && {
        price: body.price !== "" && Number(body.price) > 0 ? Number(body.price) : undefined,
      }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(Array.isArray(body.images) && { images: body.images }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.collection !== undefined && { collection: body.collection }),
      ...(Array.isArray(body.sizes) && { sizes: body.sizes }),
      ...(Array.isArray(body.colors) && { colors: body.colors }),
      ...(body.availability !== undefined && { availability: body.availability }),
      isBlurred: body.isBlurred !== undefined ? Boolean(body.isBlurred) : (isComingSoon ? true : false),
      ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
      ...(Array.isArray(body.craftSpecs) && { craftSpecs: body.craftSpecs }),
      ...(body.fitSilhouette !== undefined && { fitSilhouette: body.fitSilhouette.trim() }),
      ...(body.garmentCare !== undefined && { garmentCare: body.garmentCare.trim() }),
    };

    const updated = await updateServerProduct(id, updateData);

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const adminSession = request.cookies.get("tz_admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteServerProduct(id);

    if (!success) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
