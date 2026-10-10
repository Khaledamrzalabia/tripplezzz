import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { isPostgresConfigured, getPool } from "../../../../lib/db";

// Admin credentials from environment variables (defaults to requested admin credentials)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "mohamedhelmy@triplezzz.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "@migohelmy@ABC123XYZ@";
const SESSION_COOKIE_NAME = "tz_admin_session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  const isAuthenticated = Boolean(
    sessionCookie && (sessionCookie.value === "authenticated" || sessionCookie.value.startsWith("token_"))
  );

  return NextResponse.json({
    authenticated: isAuthenticated,
  });
}

import { guardMultiSignalRateLimit } from "../../../../lib/rateLimit";

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

    let success = false;
    let authUser = null;

    const inputUser = String(username).trim();
    const inputPass = String(password);

    // 1. Verify against Supabase PostgreSQL Database (public.admin_users table)
    const pool = getPool();
    if (pool) {
      try {
        const inputHash = crypto.createHash("sha256").update(inputPass).digest("hex");
        const { rows } = await pool.query(
          "SELECT email, password_hash, role FROM public.admin_users WHERE LOWER(email) = LOWER($1) LIMIT 1",
          [inputUser]
        );

        if (rows.length > 0) {
          const userRecord = rows[0];
          const storedHash = userRecord.password_hash;
          const aBuf = Buffer.from(inputHash);
          const bBuf = Buffer.from(storedHash);

          if (aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf)) {
            success = true;
            authUser = userRecord.email;
          }
        }
      } catch (dbErr) {
        console.warn("Supabase database admin verification error:", dbErr);
      }
    }

    // 2. Also check credentials against configured environment variables
    if (!success) {
      const uBuf = Buffer.from(inputUser.toLowerCase());
      const expectedUBuf = Buffer.from(ADMIN_USERNAME.toLowerCase());
      const pBuf = Buffer.from(inputPass);
      const expectedPBuf = Buffer.from(ADMIN_PASSWORD);

      const userMatches = uBuf.length === expectedUBuf.length && crypto.timingSafeEqual(uBuf, expectedUBuf);
      const passMatches = pBuf.length === expectedPBuf.length && crypto.timingSafeEqual(pBuf, expectedPBuf);

      if (userMatches && passMatches) {
        success = true;
        authUser = ADMIN_USERNAME;
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة." },
        { status: 401 }
      );
    }

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: `token_${Date.now()}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: authUser,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Failed to process login." }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true, message: "Logged out" });
}
