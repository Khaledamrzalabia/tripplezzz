"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { EGYPT_GOVERNORATES } from "../../types/order";

export default function AccountPage() {
  const router = useRouter();
  const { customer, loading, login, register, logout } = useCustomerAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [governorate, setGovernorate] = useState(EGYPT_GOVERNORATES[0].en);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Orders State (when logged in)
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await fetch("/api/orders?scope=customer");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  useState(() => {
    if (customer) {
      fetchOrders();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (mode === "login") {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || "خطأ في تسجيل الدخول");
      } else {
        fetchOrders();
      }
    } else {
      const res = await register({
        fullName,
        email,
        password,
        phone,
        whatsapp,
        governorate,
        city,
        address,
      });
      if (!res.success) {
        setError(res.error || "خطأ في إنشاء الحساب");
      } else {
        fetchOrders();
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="page-padding">
        <div className="site-container" style={{ textAlign: "center", paddingBlock: "6rem" }}>
          <div style={{ color: "var(--clr-accent)", fontSize: "1.2rem" }}>جاري التحميل...</div>
        </div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  if (customer) {
    return (
      <div className="page-padding" dir="rtl" lang="ar">
        <div className="site-container" style={{ maxWidth: "1000px" }}>
          <div className="mockup-eyebrow">
            <span className="mockup-gold-dash" />
            <span>CUSTOMER DASHBOARD • حساب العميل</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2.5rem" }}>
            <div>
              <h1 className="section-title" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", margin: 0 }}>
                أهلاً، {customer.fullName}
              </h1>
              <p style={{ color: "var(--clr-text-secondary)", marginTop: "0.5rem" }}>
                {customer.email} • {customer.phone} {customer.whatsapp ? `(واتساب: ${customer.whatsapp})` : ""}
              </p>
            </div>
            <button
              onClick={async () => {
                await logout();
                router.refresh();
              }}
              className="btn btn-pill-outline"
              style={{ fontSize: "0.85rem", padding: "0.6rem 1.4rem" }}
            >
              تسجيل الخروج
            </button>
          </div>

          {/* Customer Profile Card */}
          <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-lg)", padding: "1.75rem", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--clr-accent)" }}>
              عنوان التوصيل المسجل (داخل جمهورية مصر العربية)
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", color: "var(--clr-text-secondary)" }}>
              <div>
                <strong style={{ color: "var(--clr-text-primary)", display: "block" }}>المحافظة:</strong>
                {customer.governorate || "غير محددة"}
              </div>
              <div>
                <strong style={{ color: "var(--clr-text-primary)", display: "block" }}>المدينة / الحي:</strong>
                {customer.city || "غير محدد"}
              </div>
              <div>
                <strong style={{ color: "var(--clr-text-primary)", display: "block" }}>العنوان بالتفصيل:</strong>
                {customer.address || "غير مسجل"}
              </div>
            </div>
          </div>

          {/* Orders Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 className="section-title" style={{ fontSize: "1.6rem", margin: 0 }}>
                طلباتي السابقة ({orders.length})
              </h2>
              <button onClick={fetchOrders} className="btn btn-pill-outline" style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}>
                تحديث
              </button>
            </div>

            {ordersLoading ? (
              <p style={{ color: "var(--clr-text-muted)" }}>جاري تحميل الطلبات...</p>
            ) : orders.length === 0 ? (
              <div style={{ background: "var(--clr-bg-surface)", border: "1px dashed var(--clr-border)", borderRadius: "var(--radius-lg)", padding: "3rem", textAlign: "center" }}>
                <p style={{ color: "var(--clr-text-secondary)", marginBottom: "1.5rem" }}>ليس لديك أي طلبات سابقة حتى الآن.</p>
                <Link href="/shop" className="btn btn-pill-white">
                  تسوق الكولكشن الآن →
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      background: "var(--clr-bg-surface)",
                      border: "1px solid var(--clr-border)",
                      borderRadius: "var(--radius-lg)",
                      padding: "1.5rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", borderBottom: "1px solid var(--clr-border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--clr-text-primary)" }}>#{order.id}</span>
                        <span style={{ fontSize: "0.85rem", color: "var(--clr-text-muted)", marginLeft: "0.75rem" }}>
                          {new Date(order.createdAt).toLocaleDateString("ar-EG", { dateStyle: "medium" })}
                        </span>
                      </div>
                      <div>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem", fontSize: "0.9rem" }}>
                      <div>
                        <span style={{ color: "var(--clr-text-muted)" }}>طريقة الدفع:</span>{" "}
                        <strong>{getPaymentMethodLabel(order.paymentMethod)}</strong>
                        {order.paymentType === "deposit" && (
                          <span style={{ color: "var(--clr-accent)", display: "block", fontSize: "0.85rem" }}>
                            ديبوزيت (30%): {order.depositAmount} ج.م • المتبقي: {order.remainingAmount} ج.م
                          </span>
                        )}
                      </div>
                      <div>
                        <span style={{ color: "var(--clr-text-muted)" }}>العنوان:</span>{" "}
                        <span>{order.governorate} - {order.city}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--clr-text-muted)" }}>إجمالي الفاتورة:</span>{" "}
                        <strong style={{ color: "var(--clr-accent)", fontSize: "1.1rem" }}>{order.total} ج.م</strong>
                      </div>
                    </div>

                    {/* Order items */}
                    <div style={{ background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-sm)", padding: "0.75rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", display: "block", marginBottom: "0.5rem" }}>القطع المطلوبة:</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {order.items.map((it: any, idx: number) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                            <span>
                              {it.quantity}× {it.productName} {it.selectedSize ? `(${it.selectedSize})` : ""}
                            </span>
                            <span style={{ color: "var(--clr-text-secondary)" }}>{it.price * it.quantity} ج.م</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LOGIN / REGISTER FORM
  return (
    <div className="page-padding" dir="rtl" lang="ar">
      <div className="site-container" style={{ maxWidth: "560px" }}>
        <div className="mockup-eyebrow" style={{ justifyContent: "center" }}>
          <span className="mockup-gold-dash" />
          <span>TRIPLE Z MEMBERSHIP • جمهورية مصر العربية</span>
        </div>

        <h1 className="section-title" style={{ textAlign: "center", fontSize: "clamp(2rem, 4vw, 2.8rem)", marginBottom: "1rem" }}>
          {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب عميل جديد"}
        </h1>
        <p style={{ textAlign: "center", color: "var(--clr-text-secondary)", marginBottom: "2.5rem" }}>
          {mode === "login"
            ? "سجل دخولك لمتابعة طلباتك أو استكمال الشراء بسهولة"
            : "انضم إلى مجتمع Triple Z لحفظ تفاصيل الشحن ومتابعة شحناتك في مصر"}
        </p>

        {/* Mode Switch Tabs */}
        <div style={{ display: "flex", background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-pill)", padding: "0.3rem", marginBottom: "2rem" }}>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "var(--radius-pill)",
              border: "none",
              background: mode === "login" ? "var(--clr-bg-elevated)" : "transparent",
              color: mode === "login" ? "var(--clr-text-primary)" : "var(--clr-text-muted)",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "var(--radius-pill)",
              border: "none",
              background: mode === "register" ? "var(--clr-bg-elevated)" : "transparent",
              color: mode === "register" ? "var(--clr-text-primary)" : "var(--clr-text-muted)",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            حساب جديد
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#fca5a5", padding: "0.9rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", fontSize: "0.9rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="account-card-form"
          style={{
            background: "var(--clr-bg-surface)",
            border: "1px solid var(--clr-border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            boxSizing: "border-box",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {mode === "register" && (
            <>
              <div className="form-group" style={{ marginBottom: "1.25rem", width: "100%" }}>
                <label className="form-label">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  placeholder="محمد أحمد"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div className="account-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem", width: "100%" }}>
                <div className="form-group" style={{ width: "100%" }}>
                  <label className="form-label">رقم الهاتف *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    placeholder="01012345678"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div className="form-group" style={{ width: "100%" }}>
                  <label className="form-label">رقم الواتساب (اختياري)</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="form-input"
                    placeholder="01012345678"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div className="account-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem", width: "100%" }}>
                <div className="form-group" style={{ width: "100%" }}>
                  <label className="form-label">المحافظة (مصر) *</label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  >
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g.en} value={g.en}>
                        {g.ar} ({g.en})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ width: "100%" }}>
                  <label className="form-label">المدينة / الحي *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                    placeholder="المعادي / مدينة نصر / الدقي"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">العنوان بالتفصيل *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                  placeholder="رقم العقار، اسم الشارع، رقم الشقة أو علامة مميزة"
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label">البريد الإلكتروني (Email) *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="form-label">كلمة المرور *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-pill-white"
            style={{ width: "100%", padding: "1.1rem", fontSize: "1rem" }}
          >
            {submitting ? "جاري المعالجة..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب ومتابعة"}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "قيد المراجعة", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
    confirmed: { label: "تم التأكيد", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
    preparing: { label: "جاري التجهيز", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
    shipped: { label: "تم الشحن مع المندوب", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)" },
    delivered: { label: "تم التوصيل بنجاح", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
    cancelled: { label: "ملغي", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
  };

  const c = configs[status] || configs.pending;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "0.78rem",
        fontWeight: 700,
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.color}40`,
      }}
    >
      {c.label}
    </span>
  );
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "instapay":
      return "انستا باي (InstaPay)";
    case "vodafone_cash":
      return "فودافون كاش (Vodafone Cash)";
    case "paypal":
      return "PayPal";
    case "cod":
    default:
      return "الدفع عند الاستلام (COD)";
  }
}
