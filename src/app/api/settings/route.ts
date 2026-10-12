import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getStoreSettings,
  updateStoreSettings,
  resetStoreSettings,
} from "../../../lib/settings.server";
import type { StoreSettings } from "../../../types/settings";

// GET /api/settings — Retrieve active store settings (payment & social)
export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch store settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings — Update payment details and social links (Admin Only)
export async function PUT(req: NextRequest) {
  try {
    const adminSession = req.cookies.get("tz_admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { error: "غير مصرح لك بتعديل الإعدادات. يرجى تسجيل الدخول كأدمن أولاً." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Partial<StoreSettings>;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "بيانات الإعدادات غير صالحة" },
        { status: 400 }
      );
    }

    const updated = await updateStoreSettings(body);

    try {
      revalidatePath("/", "layout");
      revalidatePath("/checkout");
      revalidatePath("/order-confirmation");
      revalidatePath("/admin");
    } catch (e) {
      // safe fallback
    }

    return NextResponse.json({
      success: true,
      message: "تم حفظ وتحديث إعدادات الدفع والسوشيال ميديا بنجاح",
      settings: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء حفظ الإعدادات" },
      { status: 500 }
    );
  }
}

// POST /api/settings — Actions like reset to defaults (Admin Only)
export async function POST(req: NextRequest) {
  try {
    const adminSession = req.cookies.get("tz_admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { error: "غير مصرح لك. يرجى تسجيل الدخول كأدمن." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (body.action === "reset") {
      const defaultSettings = await resetStoreSettings();

      try {
        revalidatePath("/", "layout");
        revalidatePath("/checkout");
        revalidatePath("/order-confirmation");
        revalidatePath("/admin");
      } catch (e) {
        // safe fallback
      }

      return NextResponse.json({
        success: true,
        message: "تمت استعادة إعدادات الدفع والسوشيال الافتراضية بنجاح",
        settings: defaultSettings,
      });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "فشل تنفيذ العملية" },
      { status: 500 }
    );
  }
}
