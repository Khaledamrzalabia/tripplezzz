import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import { guardMultiSignalRateLimit } from "../../../lib/rateLimit";
import { uploadToR2, isR2Configured } from "../../../lib/r2";
import { supabaseAdmin, isSupabaseConfigured } from "../../../lib/supabase";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max

export async function POST(request: Request) {
  try {
    const limit = guardMultiSignalRateLimit(request, "file_upload", {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 10, // max 10 uploads per 10 mins
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح به لرفع الملفات مؤقتاً." },
        { status: 429 }
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Cryptographically safe random filename to prevent Path Traversal
    const safeHash = crypto.randomBytes(16).toString("hex");
    const filename = `${Date.now()}_${safeHash}${ext}`;

    // 5. Cloudflare R2 Object Storage (Zero Egress, High Performance)
    if (isR2Configured) {
      try {
        const publicUrl = await uploadToR2({
          key: `products/${filename}`,
          buffer,
          contentType: file.type,
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
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("products")
            .getPublicUrl(filename);

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
      const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
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
