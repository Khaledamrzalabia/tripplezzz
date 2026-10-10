import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getPool } from "../../../../lib/db";
import {
  hashPassword,
  createCustomerToken,
  verifyCustomerToken,
  getCustomerById,
  getCustomerByEmail,
} from "../../../../lib/customers.server";

// GET /api/customer/auth — Check current customer session
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("tz_customer_token")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const customerId = verifyCustomerToken(token);
    if (!customerId) {
      const res = NextResponse.json({ authenticated: false });
      res.cookies.delete("tz_customer_token");
      return res;
    }

    const customer = await getCustomerById(customerId);
    if (!customer) {
      const res = NextResponse.json({ authenticated: false });
      res.cookies.delete("tz_customer_token");
      return res;
    }

    return NextResponse.json({ authenticated: true, customer });
  } catch (err) {
    console.error("Customer auth error:", err);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

// POST /api/customer/auth — Register or Login
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`customer_auth_${ip}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 20, // 20 attempts per 15 mins for customer accounts
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "محاولات كثيرة جداً. يرجى الانتظار قليلاً قبل إعادة المحاولة." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { action, email, password, fullName, phone, whatsapp, governorate, city, address } = body;

    const pool = getPool();
    if (!pool) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }

    // 1. LOGIN
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const record = await getCustomerByEmail(email);
      if (!record) {
        return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
      }

      const inputHash = hashPassword(password);
      const inputBuf = Buffer.from(inputHash);
      const targetBuf = Buffer.from(record.passwordHash);

      if (inputBuf.length !== targetBuf.length || !crypto.timingSafeEqual(inputBuf, targetBuf)) {
        return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
      }

      const token = createCustomerToken(record.customer.id);
      const res = NextResponse.json({ success: true, customer: record.customer });
      res.cookies.set({
        name: "tz_customer_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
      return res;
    }

    // 2. REGISTER
    if (action === "register") {
      if (!email || !password || !fullName || !phone) {
        return NextResponse.json({ error: "يرجى ملء جميع الحقول المطلوبة (الاسم، الإيميل، الباسورد، الموبايل)" }, { status: 400 });
      }

      const existing = await getCustomerByEmail(email);
      if (existing) {
        return NextResponse.json({ error: "هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول" }, { status: 409 });
      }

      const id = "cust-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const passwordHash = hashPassword(password);

      await pool.query(
        `INSERT INTO customers (id, full_name, email, password_hash, phone, whatsapp, governorate, city, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, fullName.trim(), email.trim().toLowerCase(), passwordHash, phone.trim(), whatsapp?.trim() || null, governorate || null, city || null, address || null]
      );

      const customer = await getCustomerById(id);
      const token = createCustomerToken(id);

      const res = NextResponse.json({ success: true, customer });
      res.cookies.set({
        name: "tz_customer_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
      return res;
    }

    // 3. LOGOUT
    if (action === "logout") {
      const res = NextResponse.json({ success: true });
      res.cookies.delete("tz_customer_token");
      return res;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Customer auth handler error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
