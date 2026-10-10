import fs from "fs";
import path from "path";
import type { Product } from "../types/product";
import defaultProducts from "../data/products.json";

const DATA_FILE = path.join(process.cwd(), "src", "data", "products.json");

export function getServerProducts(): Product[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw) as Product[];
    }
  } catch (err) {
    console.error("Error reading products data on server:", err);
  }
  return (defaultProducts as unknown) as Product[];
}

export function saveServerProducts(products: Product[]): boolean {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to save products to disk:", err);
    return false;
  }
}
