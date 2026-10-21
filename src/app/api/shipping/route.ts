import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "../../../lib/adminAuth.server";
import {
  getShippingRates,
  updateShippingRates,
  resetShippingRates,
} from "../../../lib/shipping.server";
import type { GovernorateShipping } from "../../../types/order";

// GET /api/shipping — Retrieve active shipping rates per governorate
export async function GET() {
  try {
    const rates = await getShippingRates();
    return NextResponse.json(rates, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("GET /api/shipping error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping rates" },
      { status: 500 }
    );
  }
}

// PUT /api/shipping — Update governorate shipping rates (Admin Only)
export async function PUT(req: NextRequest) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json(
        { error: "غير مصرح لك بتعديل أسعار الشحن. يرجى تسجيل الدخول كأدمن أولاً." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const rates = body.rates as GovernorateShipping[];

    if (!Array.isArray(rates) || rates.length === 0) {
      return NextResponse.json(
        { error: "قائمة أسعار الشحن غير صالحة" },
        { status: 400 }
      );
    }

    await updateShippingRates(rates);
    const updatedRates = await getShippingRates();

    return NextResponse.json({
      success: true,
      message: "تم تحديث أسعار الشحن بنجاح",
      rates: updatedRates,
    });
  } catch (error: any) {
    console.error("PUT /api/shipping error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء حفظ أسعار الشحن" },
      { status: 500 }
    );
  }
}

// POST /api/shipping — Special Admin actions (e.g., reset to defaults)
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json(
        { error: "غير مصرح لك. يرجى تسجيل الدخول كأدمن." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (body.action === "reset") {
      const defaultRates = await resetShippingRates();
      return NextResponse.json({
        success: true,
        message: "تمت استعادة أسعار الشحن الافتراضية بنجاح",
        rates: defaultRates,
      });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/shipping error:", error);
    return NextResponse.json(
      { error: error.message || "فشل تنفيذ العملية" },
      { status: 500 }
    );
  }
}
