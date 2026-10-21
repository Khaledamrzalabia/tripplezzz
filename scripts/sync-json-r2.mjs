import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "src", "data", "products.json");
const products = JSON.parse(fs.readFileSync(file, "utf-8"));
const r2Base = "https://pub-cb13df92ef414969943ee4af399cc80d.r2.dev/assets";

for (const p of products) {
  if (Array.isArray(p.images)) {
    for (const img of p.images) {
      if (typeof img.src === "string" && !img.src.startsWith("http")) {
        const clean = img.src.startsWith("/") ? img.src.slice(1) : img.src;
        img.src = `${r2Base}/${clean}`;
      }
    }
  }
}

fs.writeFileSync(file, JSON.stringify(products, null, 2), "utf-8");
console.log("Updated products.json fallback with Cloudflare R2 URLs successfully!");
