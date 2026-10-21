import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

import { guardMultiSignalRateLimit } from "../../../lib/rateLimit";
import { uploadToR2, isR2Configured } from "../../../lib/r2";
import { supabaseAdmin, isSupabaseConfigured } from "../../../lib/supabase";
import { isAdminRequest } from "../../../lib/adminAuth.server";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max
const MAX_INPUT_PIXELS = 40_000_000; // reject decompression bombs
// Formats as reported by sharp after decoding the real file content (AVIF is reported as "heif")
const ALLOWED_DECODED_FORMATS = new Set(["jpeg", "png", "webp", "heif"]);

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminRequest();

    if (!isAdmin) {
      const limit = guardMultiSignalRateLimit(request, "file_upload", {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 10, // max 10 uploads per 10 mins for public/customers
      });

      if (!limit.allowed) {
        return NextResponse.json(
          { error: "تم تجاوز الحد المسموح به لرفع الملفات مؤقتاً." },
          { status: 429 }
        );
      }
    }

    // Reject oversized bodies before buffering them
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_FILE_SIZE_BYTES + 64 * 1024) {
      return NextResponse.json(
        { error: "حجم الملف كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت." },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال أي ملف" }, { status: 400 });
    }

    // 1. File size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "حجم الملف كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت." },
        { status: 400 }
      );
    }

    // 2. MIME type check
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم. المسموح فقط صور (JPEG, PNG, WEBP, AVIF)" },
        { status: 400 }
      );
    }

    // 3. Extension check
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "امتداد الملف غير صالح للأمان." },
        { status: 400 }
      );
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // 4. Verify the real content is an image and re-encode it.
    // Re-encoding drops anything that is not pixel data (polyglot payloads, EXIF/GPS metadata).
    let buffer: Buffer;
    try {
      const image = sharp(inputBuffer, { limitInputPixels: MAX_INPUT_PIXELS });
      const meta = await image.metadata();
      if (!meta.format || !ALLOWED_DECODED_FORMATS.has(meta.format)) {
        throw new Error(`Unsupported decoded format: ${meta.format}`);
      }
      buffer = await image.rotate().webp({ quality: 88 }).toBuffer();
    } catch (decodeErr) {
      console.warn("Rejected upload with invalid image content:", decodeErr);
      return NextResponse.json(
        { error: "الملف ليس صورة صالحة." },
        { status: 400 }
      );
    }
    const contentType = "image/webp";

    // 5. Cryptographically safe random filename to prevent Path Traversal
    const safeHash = crypto.randomBytes(16).toString("hex");
    const filename = `${Date.now()}_${safeHash}.webp`;
    // Customer payment proofs are kept apart from admin product images
    const folder = isAdmin ? "products" : "payment-proofs";

    // 5. Cloudflare R2 Object Storage (Zero Egress, High Performance)
    if (isR2Configured) {
      try {
        const publicUrl = await uploadToR2({
          key: `${folder}/${filename}`,
          buffer,
          contentType,
        });

        return NextResponse.json({
          success: true,
          url: publicUrl,
        });
      } catch (r2Err) {
        console.error("Cloudflare R2 upload error, attempting fallback:", r2Err);
      }
    }

    // 6. Fallback: Supabase Storage if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from("products")
          .upload(`${folder}/${filename}`, buffer, {
            contentType,
            upsert: false,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("products")
            .getPublicUrl(`${folder}/${filename}`);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicUrlData.publicUrl,
            });
          }
        }
      } catch (storageErr) {
        console.warn("Supabase storage upload fallback:", storageErr);
      }
    }

    // 6. If running in serverless environment (Vercel) without external bucket, fallback to inline Data URL
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: dataUri,
      });
    }

    // 7. Local disk upload (for local development)
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
    });
  } catch (error: any) {
    console.error("Secure upload error:", error);
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 });
  }
}
