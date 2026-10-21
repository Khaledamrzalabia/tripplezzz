import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";
import { normalizeEgyptPhone } from "../../../../lib/phone";
import {
  hashPassword,
  verifyPassword,
  isLegacyPasswordHash,
  createCustomerToken,
  verifyCustomerToken,
  getCustomerById,
  getCustomerByEmail,
} from "../../../../lib/customers.server";
import { guardMultiSignalRateLimit } from "../../../../lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function sessionCookie(token: string) {
  return {
    name: "tz_customer_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };
}

const SESSIONS_DISABLED = { error: "تسجيل الدخول غير متاح حالياً. حاول تاني بعد شوية." };

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

// POST /api/customer/auth — Register or Login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, fullName, phone, whatsapp, governorate, city, address } = body;

    const limit = guardMultiSignalRateLimit(
      req,
      "customer_auth",
      {
        windowMs: 15 * 60 * 1000,
        maxRequests: 15, // max 15 attempts per 15 mins
      },
      email || ""
    );

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "محاولات تسجيل دخول كثيرة جداً. لحماية حسابك يرجى الانتظار 15 دقيقة قبل إعادة المحاولة." },
        { status: 429 }
      );
    }

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

      if (!verifyPassword(String(password), record.passwordHash)) {
        return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
      }

      // Move accounts from the old shared-salt hash to a per-customer salt
      if (isLegacyPasswordHash(record.passwordHash)) {
        await pool.query("UPDATE customers SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
          hashPassword(String(password)),
          record.customer.id,
        ]);
      }

      const token = createCustomerToken(record.customer.id);
      if (!token) {
        console.error("Customer sessions disabled: set CUSTOMER_SESSION_SECRET or ADMIN_SESSION_SECRET (32+ chars).");
        return NextResponse.json(SESSIONS_DISABLED, { status: 503 });
      }
      const res = NextResponse.json({ success: true, customer: record.customer });
      res.cookies.set(sessionCookie(token));
      return res;
    }

    // 2. REGISTER
    if (action === "register") {
      if (!email || !password || !fullName || !phone) {
        return NextResponse.json({ error: "يرجى ملء جميع الحقول المطلوبة (الاسم، الإيميل، الباسورد، الموبايل)" }, { status: 400 });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      if (!EMAIL_RE.test(cleanEmail)) {
        return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
      }
      if (String(password).length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json({ error: `كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} حروف على الأقل` }, { status: 400 });
      }
      const cleanPhone = normalizeEgyptPhone(phone);
      if (!cleanPhone) {
        return NextResponse.json({ error: "يرجى إدخال رقم موبايل مصري صحيح (010 / 011 / 012 / 015)" }, { status: 400 });
      }

      const existing = await getCustomerByEmail(cleanEmail);
      if (existing) {
        return NextResponse.json({ error: "هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول" }, { status: 409 });
      }

      const id = "cust-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const passwordHash = hashPassword(String(password));

      try {
        await pool.query(
          `INSERT INTO customers (id, full_name, email, password_hash, phone, whatsapp, governorate, city, address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [id, String(fullName).trim().slice(0, 255), cleanEmail, passwordHash, cleanPhone, typeof whatsapp === "string" && whatsapp.trim() ? whatsapp.trim().slice(0, 50) : null, governorate ? String(governorate).slice(0, 100) : null, city ? String(city).slice(0, 100) : null, address ? String(address) : null]
        );
      } catch (insertErr) {
        // Two sign-ups with the same email at the same moment
        if ((insertErr as { code?: string }).code === "23505") {
          return NextResponse.json({ error: "هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول" }, { status: 409 });
        }
        throw insertErr;
      }

      const customer = await getCustomerById(id);
      const token = createCustomerToken(id);
      if (!token) {
        console.error("Customer sessions disabled: set CUSTOMER_SESSION_SECRET or ADMIN_SESSION_SECRET (32+ chars).");
        return NextResponse.json(SESSIONS_DISABLED, { status: 503 });
      }

      const res = NextResponse.json({ success: true, customer });
      res.cookies.set(sessionCookie(token));
      return res;
    }

    // 3. LOGOUT
    if (action === "logout") {
      const res = NextResponse.json({ success: true });
      res.cookies.delete("tz_customer_token");
      return res;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Customer auth handler error:", err);
    return NextResponse.json({ error: "حصل خطأ، حاول تاني" }, { status: 500 });
  }
}
