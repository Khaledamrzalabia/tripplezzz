import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { verifyCustomerToken } from "../../../lib/customers.server";
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
    const adminCookie = req.cookies.get("tz_admin_session")?.value;
    if (!adminCookie) {
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

// POST /api/orders — Create a new order
export async function POST(req: NextRequest) {
  try {
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

    if (!customerName || !email || !phone || !governorate || !city || !address) {
      return NextResponse.json({ error: "جميع بيانات العميل والعنوان مطلوبة" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "السلة فارغة" }, { status: 400 });
    }

    // 1. SECURITY & PRICE INTEGRITY: Fetch verified products from DB
    const productIds = items.map((it: any) => it.productId).filter(Boolean);
    const dbRes = await pool.query(
      "SELECT id, name, price, images FROM products WHERE id = ANY($1::varchar[])",
      [productIds]
    );

    const priceMap = new Map<string, { price: number; name: string; img?: string }>();
    for (const r of dbRes.rows) {
      const imgs = Array.isArray(r.images) ? r.images : (typeof r.images === "string" ? JSON.parse(r.images) : []);
      priceMap.set(r.id, {
        price: r.price !== null && r.price !== undefined ? Number(r.price) : 0,
        name: r.name,
        img: imgs[0]?.src || "/hero.jpg",
      });
    }

    // 2. Validate and compute genuine subtotal
    let verifiedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const verified = priceMap.get(item.productId);
      const qty = Math.max(1, Math.min(20, Math.floor(Number(item.quantity) || 1)));
      const unitPrice = verified ? verified.price : (Number(item.price) || 0);

      verifiedSubtotal += unitPrice * qty;
      verifiedItems.push({
        productId: item.productId,
        productName: verified ? verified.name : item.productName,
        productImage: verified?.img || item.productImage || "/hero.jpg",
        quantity: qty,
        price: unitPrice,
        selectedSize: item.selectedSize || "Standard",
        selectedColor: item.selectedColor || "#0a0a0a",
      });
    }

    // 3. Verified Egyptian shipping fee lookup
    let verifiedShipping = 70; // safe default
    const matchedGov = EGYPT_GOVERNORATES.find(
      (g) => governorate.includes(g.en) || governorate.includes(g.ar)
    );
    if (matchedGov) {
      verifiedShipping = matchedGov.shipping;
    }

    const verifiedTotal = verifiedSubtotal + verifiedShipping;
    const isDeposit = paymentType === "deposit" && paymentMethod !== "cod";
    const verifiedDeposit = isDeposit ? Math.round(verifiedTotal * 0.3) : verifiedTotal;
    const verifiedRemaining = verifiedTotal - verifiedDeposit;

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
        email.trim().toLowerCase(),
        phone.trim(),
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

// PATCH /api/orders — Update order status (Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get("tz_admin_session")?.value;
    if (!adminCookie) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 401 });
    }

    const pool = getPool();
    if (!pool) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Order ID and status required" }, { status: 400 });
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
