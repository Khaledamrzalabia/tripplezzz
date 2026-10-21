import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { PoolClient } from "pg";
import { getPool, ensureProductsTable, rowToProduct } from "../../../lib/db";
import { verifyCustomerToken } from "../../../lib/customers.server";
import { isAdminRequest } from "../../../lib/adminAuth.server";
import { getShippingRates } from "../../../lib/shipping.server";
import { getStoreSettings } from "../../../lib/settings.server";
import { guardMultiSignalRateLimit } from "../../../lib/rateLimit";
import { normalizeEgyptPhone } from "../../../lib/phone";
import { isProductComingSoon, type Product } from "../../../types/product";
import {
  canChangeOrderStatus,
  type GovernorateShipping,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
  type PaymentType,
} from "../../../types/order";

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
  } catch (err) {
    console.error("Orders GET error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

const PAYMENT_METHODS: PaymentMethod[] = ["cod", "instapay", "vodafone_cash", "paypal"];
const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
const MAX_ORDER_LINES = 20;
const DEPOSIT_RATE = 0.3;

// Proof screenshots come from /api/upload: R2/Supabase (https), local disk (/uploads/) or inline data URLs
function isSafeProofUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  return url.startsWith("https://") || url.startsWith("/uploads/") || url.startsWith("data:image/");
}

// Exact match only: the checkout sends "<ar> (<en>)"; plain "<en>" or "<ar>" are accepted too
function matchGovernorate(input: string, rates: GovernorateShipping[]): GovernorateShipping | null {
  const value = input.trim();
  return rates.find((g) => value === `${g.ar} (${g.en})` || value === g.en || value === g.ar) || null;
}

// Total pieces per product (the same product can appear in several sizes)
function quantitiesByProduct(items: OrderItem[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const it of items) totals.set(it.productId, (totals.get(it.productId) || 0) + it.quantity);
  return totals;
}

// Put cancelled pieces back on sale (only for products that track stock)
async function restoreStock(client: PoolClient, items: OrderItem[]): Promise<void> {
  for (const [productId, qty] of quantitiesByProduct(items)) {
    await client.query(
      `UPDATE products
         SET stock = stock + $2,
             availability = CASE WHEN availability = 'out-of-stock' THEN 'in-stock' ELSE availability END,
             updated_at = NOW()
       WHERE id = $1 AND stock IS NOT NULL`,
      [productId, qty]
    );
  }
}

// Short human-friendly order number, checked for collisions
async function generateOrderId(client: PoolClient): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = "TZ-" + crypto.randomInt(100000, 1000000);
    const { rowCount } = await client.query("SELECT 1 FROM orders WHERE id = $1", [id]);
    if (!rowCount) return id;
  }
  throw new Error("Could not allocate a unique order number");
}

function parseItems(raw: unknown): OrderItem[] {
  return (raw as Record<string, unknown>[]).map((it) => ({
    productId: String(it.productId || ""),
    productName: String(it.productName || ""),
    quantity: Math.max(1, Math.min(20, Math.floor(Number(it.quantity) || 1))),
    price: 0,
    selectedSize: it.selectedSize ? String(it.selectedSize) : undefined,
    selectedColor: it.selectedColor ? String(it.selectedColor) : undefined,
  }));
}

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
      total,
      paymentMethod,
      paymentType,
      paymentProofUrl,
      paymentReference,
    } = body;

    const cleanPhone = normalizeEgyptPhone(phone);
    if (!cleanPhone) {
      return NextResponse.json(
        { error: "يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقم (يبدأ بـ 010 أو 011 أو 012 أو 015)" },
        { status: 400 }
      );
    }

    const safeEmail = (typeof email === "string" && email.trim()) || `${cleanPhone}@customer.triplez.com`;

    if (!customerName || !governorate || !city || !address) {
      return NextResponse.json({ error: "جميع بيانات العميل والعنوان مطلوبة" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "السلة فارغة" }, { status: 400 });
    }
    if (items.length > MAX_ORDER_LINES) {
      return NextResponse.json({ error: "عدد القطع في الطلب أكبر من المسموح" }, { status: 400 });
    }

    // 1. Payment method & proof are enforced here, not only in the checkout page
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: "طريقة الدفع غير صحيحة" }, { status: 400 });
    }
    const method = paymentMethod as PaymentMethod;
    const type: PaymentType = method === "cod" ? "full" : paymentType === "deposit" ? "deposit" : "full";

    if (method !== "cod") {
      const { payment } = await getStoreSettings();
      const enabled =
        method === "instapay" ? payment.instapay.enabled
        : method === "vodafone_cash" ? payment.vodafoneCash.enabled
        : payment.paypal.enabled;
      if (!enabled) {
        return NextResponse.json({ error: "طريقة الدفع دي متوقفة حالياً، اختار طريقة تانية" }, { status: 400 });
      }
      if (!isSafeProofUrl(paymentProofUrl)) {
        return NextResponse.json({ error: "يرجى رفع سكرين شوت التحويل لتأكيد الدفع" }, { status: 400 });
      }
      if (method === "vodafone_cash" && !String(paymentReference || "").trim()) {
        return NextResponse.json({ error: "يرجى كتابة رقم فودافون كاش اللي حوّلت منه" }, { status: 400 });
      }
    }

    // 2. Governorate must be one of the configured ones (no silent default)
    const matchedGov = matchGovernorate(String(governorate), await getShippingRates());
    if (!matchedGov) {
      return NextResponse.json({ error: "يرجى اختيار المحافظة من القائمة" }, { status: 400 });
    }
    const verifiedShipping = Number(matchedGov.shipping) || 0;

    // 3. Verified products: same "can it be bought" rule as the storefront
    await ensureProductsTable();
    const requested = parseItems(items);
    const dbRes = await pool.query("SELECT * FROM products WHERE id = ANY($1::varchar[])", [
      requested.map((it) => it.productId),
    ]);
    const productMap = new Map<string, Product>(dbRes.rows.map((r) => [r.id, rowToProduct(r)]));

    let verifiedSubtotal = 0;
    const verifiedItems: OrderItem[] = [];

    for (const item of requested) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `المنتج (${item.productName || item.productId}) لم يعد متاحاً بالمتجر` },
          { status: 400 }
        );
      }
      if (product.availability === "out-of-stock") {
        return NextResponse.json({ error: `عذراً، نفدت الكمية من المنتج (${product.name})` }, { status: 400 });
      }
      // Covers coming-soon, blurred teasers and products without a price
      if (isProductComingSoon(product)) {
        return NextResponse.json(
          { error: `المنتج (${product.name}) غير متاح للبيع حالياً` },
          { status: 400 }
        );
      }
      const sizes = product.sizes || [];
      const size = item.selectedSize || sizes[0] || "Standard";
      if (sizes.length > 0 && !sizes.includes(size)) {
        return NextResponse.json({ error: `المقاس ${size} غير متاح للمنتج (${product.name})` }, { status: 400 });
      }
      const colors = product.colors || [];
      const color = item.selectedColor || colors[0] || "#0a0a0a";
      if (colors.length > 0 && !colors.includes(color)) {
        return NextResponse.json({ error: `اللون المختار غير متاح للمنتج (${product.name})` }, { status: 400 });
      }

      const unitPrice = Number(product.price);
      verifiedSubtotal += unitPrice * item.quantity;
      verifiedItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0]?.src || "/hero.jpg",
        quantity: item.quantity,
        price: unitPrice,
        selectedSize: size,
        selectedColor: color,
      });
    }

    // 4. Money: deposit is 30% of products + shipping; COD pays everything on delivery
    const verifiedTotal = verifiedSubtotal + verifiedShipping;
    const verifiedDeposit =
      method === "cod" ? 0 : type === "deposit" ? Math.round(verifiedTotal * DEPOSIT_RATE) : verifiedTotal;
    const verifiedRemaining = verifiedTotal - verifiedDeposit;
    const totals = {
      subtotal: verifiedSubtotal,
      shippingFee: verifiedShipping,
      total: verifiedTotal,
      depositAmount: verifiedDeposit,
      remainingAmount: verifiedRemaining,
    };

    // The customer already transferred money based on the page's numbers: never record different ones
    if (typeof total === "number" && Math.abs(total - verifiedTotal) > 0.5) {
      return NextResponse.json(
        {
          error: "الأسعار اتغيرت من وقت ما ضفت القطع للسلة. راجع الإجمالي الجديد قبل التأكيد.",
          code: "PRICE_CHANGED",
          totals,
        },
        { status: 409 }
      );
    }

    // Optional customer token link
    const token = req.cookies.get("tz_customer_token")?.value;
    const customerId = token ? verifyCustomerToken(token) : null;

    // 5. Reserve stock and create the order atomically
    const client = await pool.connect();
    let orderId: string;
    let soldOut = false;
    try {
      await client.query("BEGIN");

      for (const [productId, qty] of quantitiesByProduct(verifiedItems)) {
        const product = productMap.get(productId)!;
        if (product.stock === null || product.stock === undefined) continue;
        const res = await client.query(
          `UPDATE products
             SET stock = stock - $2,
                 availability = CASE WHEN stock - $2 = 0 THEN 'out-of-stock' ELSE availability END,
                 updated_at = NOW()
           WHERE id = $1 AND stock >= $2
           RETURNING stock`,
          [productId, qty]
        );
        if (!res.rowCount) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: `الكمية المتاحة من (${product.name}) أقل من المطلوب` },
            { status: 409 }
          );
        }
        if (Number(res.rows[0].stock) === 0) soldOut = true;
      }

      orderId = await generateOrderId(client);
      await client.query(
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
          String(customerName).trim().slice(0, 255),
          safeEmail.trim().toLowerCase().slice(0, 255),
          cleanPhone,
          typeof whatsapp === "string" && whatsapp.trim() ? whatsapp.trim().slice(0, 50) : null,
          `${matchedGov.ar} (${matchedGov.en})`,
          String(city).trim().slice(0, 100),
          String(address).trim(),
          typeof notes === "string" && notes.trim() ? notes.trim() : null,
          JSON.stringify(verifiedItems),
          verifiedSubtotal,
          verifiedShipping,
          verifiedTotal,
          method,
          type,
          verifiedDeposit,
          verifiedRemaining,
          method === "cod" ? null : paymentProofUrl,
          typeof paymentReference === "string" && paymentReference.trim() ? paymentReference.trim().slice(0, 120) : null,
        ]
      );

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK").catch(() => {});
      throw txErr;
    } finally {
      client.release();
    }

    if (soldOut) {
      try {
        revalidatePath("/", "layout");
      } catch {
        // safe fallback
      }
    }

    return NextResponse.json({ success: true, orderId, totals });
  } catch (err) {
    console.error("Orders POST error:", err);
    return NextResponse.json({ error: "تعذر إنشاء الطلب، حاول مرة تانية" }, { status: 500 });
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
    if (!id || !ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Order ID and a valid status are required" }, { status: 400 });
    }
    const newStatus = status as OrderStatus;

    const isAdmin = await isAdminRequest();
    const customerToken = req.cookies.get("tz_customer_token")?.value;
    const customerId = customerToken ? verifyCustomerToken(customerToken) : null;

    if (!isAdmin && !customerId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const found = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id]);
      const existing = found.rows[0];

      if (!existing || (!isAdmin && existing.customer_id !== customerId)) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const current = existing.status as OrderStatus;

      if (!isAdmin) {
        // Customers can only cancel before the store confirms the order (and its payment)
        if (newStatus !== "cancelled" || current !== "pending") {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "الطلب اتأكد بالفعل ومينفعش يتلغي من هنا. تواصل معانا على واتساب أو إنستجرام." },
            { status: 400 }
          );
        }
      } else if (!canChangeOrderStatus(current, newStatus)) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "مينفعش تغيّر حالة طلب اتسلّم أو اتلغى." },
          { status: 400 }
        );
      }

      const res = await client.query(
        "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [newStatus, id]
      );
      const order = mapRowToOrder(res.rows[0]);

      if (newStatus === "cancelled") {
        await restoreStock(client, order.items);
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true, order });
    } catch (txErr) {
      await client.query("ROLLBACK").catch(() => {});
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Orders PATCH error:", err);
    return NextResponse.json({ error: "تعذر تحديث الطلب" }, { status: 500 });
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
