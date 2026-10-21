// =============================================
// TRIPLE Z — Product Data Types
// =============================================

export interface ProductImage {
  src: string;
  alt: string;
}

export type ProductCategory = "tops" | "bottoms" | "outerwear" | "accessories" | "footwear";
export type ProductAvailability = "in-stock" | "low-stock" | "out-of-stock" | "coming-soon";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  /** Craft & Specifications bullet points */
  craftSpecs?: string[];
  /** Fit & Silhouette description */
  fitSilhouette?: string;
  /** Garment Care instructions */
  garmentCare?: string;
  price?: number;
  currency: string;
  images: ProductImage[];
  category: ProductCategory;
  collection?: string;
  sizes?: string[];
  colors?: string[];
  availability: ProductAvailability;
  featured?: boolean;
  /** True if image should be blurred in teaser mode for Coming Soon drops */
  isBlurred?: boolean;
  /** True = verified real product data; False = placeholder demo data */
  isPlaceholder?: boolean;
}

/**
 * Single Unified Rule for whether a product is locked in "Coming Soon" / Teaser mode:
 * 1. availability === "coming-soon"
 * 2. OR isBlurred === true
 * 3. OR price is undefined / null / <= 0
 */
export function isProductComingSoon(product: Partial<Product> | null | undefined): boolean {
  if (!product) return true;
  if (product.availability === "coming-soon") return true;
  if (Boolean(product.isBlurred)) return true;
  if (product.price === undefined || product.price === null || Number(product.price) <= 0) return true;
  return false;
}
