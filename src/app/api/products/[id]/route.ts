import { NextResponse } from "next/server";
import { getServerProducts, saveServerProducts } from "../../../../lib/products.server";
import type { Product } from "../../../../types/product";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const products = getServerProducts();
  const product = products.find((p) => p.id === id || p.slug === id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const body = await request.json();
    const products = getServerProducts();
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const existing = products[index];
    const isComingSoon = body.availability === "coming-soon";

    const updatedProduct: Product = {
      ...existing,
      name: body.name !== undefined ? body.name.trim() : existing.name,
      slug: body.slug !== undefined ? body.slug.trim() : existing.slug,
      description: body.description !== undefined ? body.description.trim() : existing.description,
      longDescription: body.longDescription !== undefined ? body.longDescription.trim() : existing.longDescription,
      price: isComingSoon ? undefined : (body.price !== undefined ? Number(body.price) || 0 : existing.price),
      currency: body.currency || existing.currency,
      images: Array.isArray(body.images) ? body.images : existing.images,
      category: body.category || existing.category,
      collection: body.collection || existing.collection,
      sizes: Array.isArray(body.sizes) ? body.sizes : existing.sizes,
      availability: body.availability || existing.availability,
      featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
      isPlaceholder: false,
    };

    products[index] = updatedProduct;
    saveServerProducts(products);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const products = getServerProducts();
    const filtered = products.filter((p) => p.id !== id);

    if (filtered.length === products.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    saveServerProducts(filtered);
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
