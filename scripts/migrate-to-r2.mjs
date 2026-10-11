import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Pool } from "pg";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    envVars[key] = val;
  }
}

const accountId = envVars.R2_ACCOUNT_ID;
const accessKeyId = envVars.R2_ACCESS_KEY_ID;
const secretAccessKey = envVars.R2_SECRET_ACCESS_KEY;
const bucketName = envVars.R2_BUCKET_NAME || "mohamed-helmy";
const publicDomain = (envVars.R2_PUBLIC_DOMAIN || "").replace(/\/+$/, "");
const connectionString = envVars.DATABASE_URL;

console.log("R2 Config Check:", { bucketName, publicDomain });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".webp") return "image/webp";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function uploadLocalFile(relPath) {
  const cleanRel = relPath.startsWith("/") ? relPath.slice(1) : relPath;
  const absPath = path.join(process.cwd(), "public", cleanRel);

  if (!fs.existsSync(absPath)) {
    console.warn(`File not found on disk: ${absPath}`);
    return null;
  }

  const buffer = fs.readFileSync(absPath);
  const key = `assets/${cleanRel}`;
  const contentType = getMime(absPath);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2.send(command);
  const r2Url = `${publicDomain}/${key}`;
  console.log(`Uploaded: ${cleanRel} -> ${r2Url}`);
  return r2Url;
}

async function runMigration() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const { rows: products } = await pool.query("SELECT id, name, images FROM products;");
    console.log(`Found ${products.length} products in DB.`);

    const urlCache = {};

    for (const prod of products) {
      if (!Array.isArray(prod.images)) continue;
      let updated = false;

      const newImages = [];
      for (const img of prod.images) {
        const src = img.src;
        if (typeof src === "string" && !src.startsWith("http")) {
          if (!urlCache[src]) {
            const r2Url = await uploadLocalFile(src);
            if (r2Url) {
              urlCache[src] = r2Url;
            }
          }

          if (urlCache[src]) {
            newImages.push({ ...img, src: urlCache[src] });
            updated = true;
          } else {
            newImages.push(img);
          }
        } else {
          newImages.push(img);
        }
      }

      if (updated) {
        await pool.query("UPDATE products SET images = $1 WHERE id = $2;", [
          JSON.stringify(newImages),
          prod.id,
        ]);
        console.log(`Updated product in DB: [${prod.id}] ${prod.name}`);
      }
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

runMigration();
