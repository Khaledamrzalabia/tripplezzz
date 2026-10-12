import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getPool } from "../../../../lib/db";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "mohamedhelmy@triplezzz.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "@migohelmy@ABC123XYZ@";
const SESSION_COOKIE_NAME = "tz_admin_session";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    const isAuthenticated = Boolean(
      sessionCookie && (sessionCookie.value === "authenticated" || sessionCookie.value.startsWith("token_"))
    );

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "غير مصرح. يرجى تسجيل الدخول أولاً كأدمن لتغيير كلمة المرور." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة وتأكيدها." },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور الجديدة يجب أن تتكون من 6 أحرف أو أرقام على الأقل." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين." },
        { status: 400 }
      );
    }

    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: "قاعدة البيانات غير متصلة حالياً لتسجيل كلمة المرور الجديدة." },
        { status: 500 }
      );
    }

    // Ensure public.admin_users table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Verify current password against DB or Master Password
    let isCurrentValid = false;
    const currentPassStr = String(currentPassword);
    const currentHash = crypto.createHash("sha256").update(currentPassStr).digest("hex");

    // Check DB admin_users
    try {
      const { rows } = await pool.query(
        "SELECT email, password_hash FROM public.admin_users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [ADMIN_USERNAME]
      );

      if (rows.length > 0) {
        const storedHash = rows[0].password_hash;
        const aBuf = Buffer.from(currentHash);
        const bBuf = Buffer.from(storedHash);
        if (aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf)) {
          isCurrentValid = true;
        }
      }
    } catch (dbErr) {
      console.warn("DB check error during password change:", dbErr);
    }

    // Fallback: Check against master password from environment
    if (!isCurrentValid) {
      const cBuf = Buffer.from(currentPassStr);
      const mBuf = Buffer.from(ADMIN_PASSWORD);
      if (cBuf.length === mBuf.length && crypto.timingSafeEqual(cBuf, mBuf)) {
        isCurrentValid = true;
      }
    }

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "كلمة المرور الحالية غير صحيحة. يمكنك إدخال كلمة المرور الحالية أو كلمة المرور الرئيسية (Master)." },
        { status: 401 }
      );
    }

    // Compute new hash and save to public.admin_users
    const newHash = crypto.createHash("sha256").update(String(newPassword)).digest("hex");

    await pool.query(
      `
      INSERT INTO public.admin_users (email, password_hash, role, updated_at)
      VALUES ($1, $2, 'admin', NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, updated_at = NOW();
      `,
      [ADMIN_USERNAME, newHash]
    );

    return NextResponse.json({
      success: true,
      message: "تم تحديث كلمة المرور بنجاح. يمكنك استخدام كلمة المرور الجديدة لتسجيل الدخول في أي وقت.",
    });
  } catch (error) {
    console.error("Change password route error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تغيير كلمة المرور. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}
