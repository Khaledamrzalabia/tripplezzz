import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { isPostgresConfigured } from "../../../../lib/db";

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "triplez2026";
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

import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`admin_auth_${ip}`, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // max 5 login attempts per 15 mins
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تم تجاوز الحد الأقصى للمحاولات. يرجى الانتظار 15 دقيقة قبل المحاولة مرة أخرى." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم المستخدم وكلمة المرور." },
        { status: 400 }
      );
    }

    let success = false;
    let authUser = null;

    // Check credentials against configured ADMIN_USERNAME & ADMIN_PASSWORD
    const inputUser = String(username).trim();
    const inputPass = String(password);

    const uBuf = Buffer.from(inputUser);
    const expectedUBuf = Buffer.from(ADMIN_USERNAME);
    const pBuf = Buffer.from(inputPass);
    const expectedPBuf = Buffer.from(ADMIN_PASSWORD);

    const userMatches = uBuf.length === expectedUBuf.length && crypto.timingSafeEqual(uBuf, expectedUBuf);
    const passMatches = pBuf.length === expectedPBuf.length && crypto.timingSafeEqual(pBuf, expectedPBuf);

    if (userMatches && passMatches) {
      success = true;
      authUser = ADMIN_USERNAME;
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
