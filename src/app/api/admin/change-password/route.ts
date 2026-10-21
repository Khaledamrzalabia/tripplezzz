import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getPool } from "../../../../lib/db";
import {
  ADMIN_MIN_PASSWORD_LENGTH,
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminFromRequest,
  getBootstrapAdmin,
  getStoredAdminHash,
  hashAdminPassword,
  verifyAdminPassword,
} from "../../../../lib/adminAuth.server";

export async function POST(request: Request) {
  try {
    const adminEmail = await getAdminFromRequest();
    if (!adminEmail) {
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

    if (String(newPassword).length < ADMIN_MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `كلمة المرور الجديدة يجب أن تتكون من ${ADMIN_MIN_PASSWORD_LENGTH} حرفاً على الأقل.` },
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

    // Verify the current password: database hash if one exists, otherwise the env bootstrap password
    const currentPassStr = String(currentPassword);
    let isCurrentValid = false;
    const storedHash = await getStoredAdminHash(adminEmail);

    if (storedHash) {
      isCurrentValid = verifyAdminPassword(currentPassStr, storedHash);
    } else {
      const bootstrap = getBootstrapAdmin();
      if (bootstrap && bootstrap.email === adminEmail) {
        const cBuf = Buffer.from(currentPassStr);
        const mBuf = Buffer.from(bootstrap.password);
        isCurrentValid = cBuf.length === mBuf.length && crypto.timingSafeEqual(cBuf, mBuf);
      }
    }

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "كلمة المرور الحالية غير صحيحة." },
        { status: 401 }
      );
    }

    await pool.query(
      `
      INSERT INTO public.admin_users (email, password_hash, role, updated_at)
      VALUES ($1, $2, 'admin', NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, updated_at = NOW();
      `,
      [adminEmail, hashAdminPassword(String(newPassword))]
    );

    // All previous sessions are now invalid; issue a fresh one for this browser
    const token = await createAdminSessionToken(adminEmail);
    if (token) {
      const cookieStore = await cookies();
      cookieStore.set(adminSessionCookieOptions(token));
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث كلمة المرور بنجاح وتم تسجيل الخروج من كل الأجهزة الأخرى.",
    });
  } catch (error) {
    console.error("Change password route error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تغيير كلمة المرور. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}
