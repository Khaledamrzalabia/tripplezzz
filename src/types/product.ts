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
