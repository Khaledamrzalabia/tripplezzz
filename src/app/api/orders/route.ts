import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { verifyCustomerToken } from "../../../lib/customers.server";
import { isAdminRequest } from "../../../lib/adminAuth.server";
import { getShippingRates } from "../../../lib/shipping.server";
import { EGYPT_GOVERNORATES, type Order, type PaymentMethod, type PaymentType } from "../../../types/order";

// GET /api/orders — List orders (Admin or Customer self-orders)
export async function GET(req: NextRequest) {
  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope"); // 'customer' or admin default
    const status = searchParams.get("status");

    // If customer requests their own orders
    if (scope === "customer") {
      const token = req.cookies.get("tz_customer_token")?.value;
      const customerId = token ? verifyCustomerToken(token) : null;
      if (!customerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const res = await pool.query(
        "SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC",
        [customerId]
      );
      return NextResponse.json(res.rows.map(mapRowToOrder));
    }

    // Admin scope (check admin session)
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    let query = "SELECT * FROM orders";
    const params: any[] = [];
    if (status && status !== "all") {
      query += " WHERE status = $1";
      params.push(status);
    }
    query += " ORDER BY created_at DESC";

    const res = await pool.query(query, params);
    return NextResponse.json(res.rows.map(mapRowToOrder));
  } catch (err: any) {
    console.error("Orders GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch orders" }, { status: 500 });
  }
}

import { guardMultiSignalRateLimit } from "../../../lib/rateLimit";

// POST /api/orders — Create a new order
export async function POST(req: NextRequest) {
  try {
    const limit = guardMultiSignalRateLimit(req, "create_order", {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 6, // max 6 orders placed per 10 mins per device/IP
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح به لإنشاء الطلبات مؤقتاً لحماية النظام من الطلبات المكررة." },
        { status: 429 }
      );
    }

    const pool = getPool();
    if (!pool) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }

    const body = await req.json();
    const {
      customerName,
      email,
      phone,
      whatsapp,
      governorate,
      city,
      address,
      notes,
      items,
      subtotal,
      shippingFee,
      total,
      paymentMethod,
      paymentType,
      depositAmount,
      remainingAmount,
      paymentProofUrl,
      paymentReference,
    } = body;

    const cleanPhone = (phone || "").replace(/[\s\-\+]/g, "").replace(/^20/, "");
    if (!cleanPhone || !/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقم (يبدأ بـ 010 أو 011 أو 012 أو 015)" },
        { status: 400 }
      );
    }

    const safeEmail = (email && email.trim()) || `${cleanPhone}@customer.triplez.com`;

    if (!customerName || !governorate || !city || !address) {
      return NextResponse.json({ error: "جميع بيانات العميل والعنوان مطلوبة" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "السلة فارغة" }, { status: 400 });
    }

    // 1. SECURITY & AVAILABILITY INTEGRITY: Fetch verified products from DB
    const productIds = items.map((it: any) => it.productId).filter(Boolean);
    const dbRes = await pool.query(
      "SELECT id, name, price, images, availability FROM products WHERE id = ANY($1::varchar[])",
      [productIds]
    );

    const productMap = new Map<string, { price: number; name: string; img?: string; availability?: string }>();
    for (const r of dbRes.rows) {
      const imgs = Array.isArray(r.images) ? r.images : (typeof r.images === "string" ? JSON.parse(r.images) : []);
      productMap.set(r.id, {
        price: r.price !== null && r.price !== undefined ? Number(r.price) : 0,
        name: r.name,
        img: imgs[0]?.src || "/hero.jpg",
        availability: r.availability || "in-stock",
      });
    }

    // 2. Validate availability and compute genuine subtotal
    let verifiedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const verified = productMap.get(item.productId);
      if (!verified) {
        return NextResponse.json(
          { error: `المنتج (${item.productName || item.productId}) لم يعد متاحاً بالمتجر` },
          { status: 400 }
        );
      }

      if (verified.availability === "out-of-stock") {
        return NextResponse.json(
          { error: `عذراً، نفدت الكمية من المنتج (${verified.name})` },
          { status: 400 }
        );
      }

      if (verified.availability === "coming-soon") {
        return NextResponse.json(
          { error: `المنتج (${verified.name}) لم يتم إطلاقه للبيع بعد (Coming Soon)` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Math.min(20, Math.floor(Number(item.quantity) || 1)));
      const unitPrice = verified.price;

      verifiedSubtotal += unitPrice * qty;
      verifiedItems.push({
        productId: item.productId,
        productName: verified.name,
        productImage: verified.img || "/hero.jpg",
        quantity: qty,
        price: unitPrice,
        selectedSize: item.selectedSize || "Standard",
        selectedColor: item.selectedColor || "#0a0a0a",
      });
    }

    // 3. Verified Egyptian shipping fee lookup from admin settings
    const activeRates = await getShippingRates();
    let verifiedShipping = 70; // safe default
    const cleanInputGov = (governorate || "").toLowerCase().replace(/محافظة/g, "").trim();
    const matchedGov = activeRates.find((g) => {
      const cleanAr = (g.ar || "").toLowerCase().replace(/محافظة/g, "").trim();
      const cleanEn = (g.en || "").toLowerCase().trim();
      return (
        governorate.toLowerCase().includes(cleanEn) ||
        cleanEn.includes(cleanInputGov) ||
        governorate.includes(cleanAr) ||
        cleanAr.includes(cleanInputGov)
      );
    });
    if (matchedGov) {
      verifiedShipping = Number(matchedGov.shipping) || 0;
    }

    const verifiedTotal = verifiedSubtotal + verifiedShipping;

    // Accurate financial calculation: COD = 0 deposit, 100% remaining
    let verifiedDeposit = 0;
    let verifiedRemaining = verifiedTotal;

    if (paymentMethod === "cod") {
      verifiedDeposit = 0;
      verifiedRemaining = verifiedTotal;
    } else if (paymentType === "deposit") {
      verifiedDeposit = Math.round(verifiedTotal * 0.3);
      verifiedRemaining = verifiedTotal - verifiedDeposit;
    } else {
      // 100% full online payment (InstaPay / Vodafone Cash / PayPal)
      verifiedDeposit = verifiedTotal;
      verifiedRemaining = 0;
    }

    // Optional customer token link
    const token = req.cookies.get("tz_customer_token")?.value;
    const customerId = token ? verifyCustomerToken(token) : null;

    const orderId = "TZ-" + Math.floor(100000 + Math.random() * 900000);

    await pool.query(
      `INSERT INTO orders (
        id, customer_id, customer_name, email, phone, whatsapp,
        governorate, city, address, notes, items,
        subtotal, shipping_fee, total, payment_method, payment_type,
        deposit_amount, remaining_amount, payment_proof_url, payment_reference, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, 'pending'
      )`,
      [
        orderId,
        customerId || null,
        customerName.trim(),
        safeEmail.trim().toLowerCase(),
        cleanPhone,
        whatsapp?.trim() || null,
        governorate.trim(),
        city.trim(),
        address.trim(),
        notes?.trim() || null,
        JSON.stringify(verifiedItems),
        verifiedSubtotal,
        verifiedShipping,
        verifiedTotal,
        paymentMethod as PaymentMethod,
        (paymentType || "full") as PaymentType,
        verifiedDeposit,
        verifiedRemaining,
        paymentProofUrl || null,
        paymentReference?.trim() || null,
      ]
    );

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    console.error("Orders POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 500 });
  }
}

// PATCH /api/orders — Update order status (Admin or Customer self-cancellation)
export async function PATCH(req: NextRequest) {
  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Order ID and status required" }, { status: 400 });
    }

    const isAdmin = await isAdminRequest();
    const customerToken = req.cookies.get("tz_customer_token")?.value;
    const customerId = customerToken ? verifyCustomerToken(customerToken) : null;

    // Customer cancellation flow
    if (status === "cancelled" && customerId && !isAdmin) {
      const checkOrder = await pool.query(
        "SELECT * FROM orders WHERE id = $1 AND customer_id = $2",
        [id, customerId]
      );
      if (checkOrder.rows.length === 0) {
        return NextResponse.json({ error: "Order not found or unauthorized" }, { status: 404 });
      }

      const existingOrder = checkOrder.rows[0];
      if (["shipped", "delivered"].includes(existingOrder.status)) {
        return NextResponse.json({ error: "لا يمكن إلغاء الطلب بعد خروجه مع مندوب الشحن. يرجى التواصل معنا مباشرة." }, { status: 400 });
      }

      const res = await pool.query(
        "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
        [id]
      );
      return NextResponse.json({ success: true, order: mapRowToOrder(res.rows[0]) });
    }

    // Admin flow
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const res = await pool.query(
      "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: mapRowToOrder(res.rows[0]) });
  } catch (err: any) {
    console.error("Orders PATCH error:", err);
    return NextResponse.json({ error: err.message || "Failed to update order" }, { status: 500 });
  }
}

function mapRowToOrder(r: any): Order {
  return {
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    email: r.email,
    phone: r.phone,
    whatsapp: r.whatsapp,
    governorate: r.governorate,
    city: r.city,
    address: r.address,
    notes: r.notes,
    items: Array.isArray(r.items) ? r.items : (typeof r.items === "string" ? JSON.parse(r.items) : []),
    subtotal: Number(r.subtotal),
    shippingFee: Number(r.shipping_fee),
    total: Number(r.total),
    paymentMethod: r.payment_method,
    paymentType: r.payment_type,
    depositAmount: Number(r.deposit_amount),
    remainingAmount: Number(r.remaining_amount),
    paymentProofUrl: r.payment_proof_url,
    paymentReference: r.payment_reference,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
