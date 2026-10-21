import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getPool } from "../../../../lib/db";
import { guardMultiSignalRateLimit } from "../../../../lib/rateLimit";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminFromRequest,
  getBootstrapAdmin,
  getStoredAdminHash,
  hashAdminPassword,
  isAdminAuthConfigured,
  isLegacyAdminHash,
  verifyAdminPassword,
} from "../../../../lib/adminAuth.server";

export async function GET() {
  const admin = await getAdminFromRequest();
  return NextResponse.json({
    authenticated: Boolean(admin),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Multi-signal protection (IP + Fingerprint + Target Username)
    const limit = guardMultiSignalRateLimit(
      request,
      "admin_auth",
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // max 5 attempts per window
      },
      username || ""
    );

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تم تجاوز الحد الأقصى للمحاولات وتم تجميد الطلبات مؤقتاً لحماية الحساب. يرجى الانتظار 15 دقيقة." },
        { status: 429 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم المستخدم وكلمة المرور." },
        { status: 400 }
      );
    }

    if (!isAdminAuthConfigured()) {
      console.error("Admin login disabled: ADMIN_SESSION_SECRET is missing or shorter than 32 characters.");
      return NextResponse.json(
        { error: "تسجيل دخول الأدمن غير مفعل على السيرفر. يرجى ضبط متغيرات البيئة." },
        { status: 503 }
      );
    }

    const inputUser = String(username).trim().toLowerCase();
    const inputPass = String(password);
    let success = false;

    // 1. Database admin (public.admin_users). Once a row exists, it is the only source of truth.
    const storedHash = await getStoredAdminHash(inputUser);
    if (storedHash) {
      success = verifyAdminPassword(inputPass, storedHash);

      // Transparently upgrade legacy unsalted SHA-256 hashes to scrypt
      if (success && isLegacyAdminHash(storedHash)) {
        const pool = getPool();
        await pool?.query(
          "UPDATE public.admin_users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)",
          [hashAdminPassword(inputPass), inputUser]
        );
      }
    } else {
      // 2. Bootstrap admin from environment (only until a password is set in the database)
      const bootstrap = getBootstrapAdmin();
      if (bootstrap) {
        const uBuf = Buffer.from(inputUser);
        const expectedUBuf = Buffer.from(bootstrap.email);
        const pBuf = Buffer.from(inputPass);
        const expectedPBuf = Buffer.from(bootstrap.password);

        const userMatches = uBuf.length === expectedUBuf.length && crypto.timingSafeEqual(uBuf, expectedUBuf);
        const passMatches = pBuf.length === expectedPBuf.length && crypto.timingSafeEqual(pBuf, expectedPBuf);
        success = userMatches && passMatches;
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة." },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken(inputUser);
    if (!token) {
      return NextResponse.json({ error: "Failed to create session." }, { status: 500 });
    }

    const cookieStore = await cookies();
    cookieStore.set(adminSessionCookieOptions(token));

    return NextResponse.json({
      success: true,
      user: inputUser,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Failed to process login." }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ success: true, message: "Logged out" });
}
