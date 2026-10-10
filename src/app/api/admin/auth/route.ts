import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { isPostgresConfigured } from "../../../../lib/db";

// Default admin password if not defined in .env
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
    postgresConnected: isPostgresConfigured,
    supabaseConnected: isSupabaseConfigured,
    dbMode: isPostgresConfigured
      ? "Direct PostgreSQL Pooler"
      : isSupabaseConfigured
      ? "Supabase API"
      : "Local JSON Store",
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
    const { password, email } = body;

    let success = false;
    let authUser = null;

    // Check 1: If user provided email & password and Supabase is configured
    if (email && password && isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (!error && data.user) {
          success = true;
          authUser = data.user.email;
        }
      } catch (err) {
        console.warn("Supabase auth check failed:", err);
      }
    }

    // Check 2: Master Admin Passcode (Works with ADMIN_PASSWORD in .env or default fallback)
    if (!success && password) {
      const pBuf = Buffer.from(password);
      const aBuf = Buffer.from(ADMIN_PASSWORD);
      if (pBuf.length === aBuf.length && crypto.timingSafeEqual(pBuf, aBuf)) {
        success = true;
        authUser = "Master Admin";
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: "كلمة السر غير صحيحة، يرجى التأكد من كلمة المرور والمحاولة مجدداً." },
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
      postgresConnected: isPostgresConfigured,
      supabaseConnected: isSupabaseConfigured,
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
