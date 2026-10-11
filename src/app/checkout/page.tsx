"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";
import { EGYPT_GOVERNORATES, type PaymentMethod, type PaymentType } from "../../types/order";

export default function CheckoutPage() {
  const router = useRouter();
  const { state, totalPrice, totalItems, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { customer, loading: authLoading, login, register } = useCustomerAuth();

  // Authentication requirement modal / tab state
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Checkout Delivery details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [governorate, setGovernorate] = useState(EGYPT_GOVERNORATES[0].en);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("instapay");
  const [paymentType, setPaymentType] = useState<PaymentType>("deposit"); // 'deposit' (30%) or 'full'
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  // Status & Validation
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [formError, setFormError] = useState("");

  // Populate data when customer logs in
  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
      setWhatsapp(customer.whatsapp || customer.phone || "");
      if (customer.governorate) setGovernorate(customer.governorate);
      if (customer.city) setCity(customer.city);
      if (customer.address) setAddress(customer.address);
    }
  }, [customer]);

  // Shipping calculation
  const currentGov = EGYPT_GOVERNORATES.find((g) => g.en === governorate) || EGYPT_GOVERNORATES[0];
  const shippingFee = currentGov.shipping;
  const subtotal = totalPrice;
  const grandTotal = subtotal + shippingFee;

  // Deposit 30% calculation
  const depositAmount = paymentType === "deposit" ? Math.round(grandTotal * 0.3) : grandTotal;
  const remainingAmount = grandTotal - depositAmount;

  // Handle Quick Auth
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    if (authTab === "login") {
      const res = await login(authEmail, authPassword);
      if (!res.success) {
        setAuthError(res.error || "فشل تسجيل الدخول");
      }
    } else {
      const res = await register({
        fullName: authFullName,
        email: authEmail,
        password: authPassword,
        phone: authPhone,
        governorate,
        city,
        address,
      });
      if (!res.success) {
        setAuthError(res.error || "فشل إنشاء الحساب");
      }
    }
    setAuthSubmitting(false);
  };

  // Proof Image Upload
  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingProof(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setPaymentProofUrl(data.url);
      } else {
        alert("فشل رفع صورة التحويل: " + (data.error || "خطأ"));
      }
    } catch {
      alert("حدث خطأ أثناء رفع سكرين التحويل");
    } finally {
      setUploadingProof(false);
    }
  };

  // Submit Order
  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!customer) {
      setFormError("يرجى تسجيل الدخول أو إنشاء حساب لإتمام الطلب");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !city.trim() || !address.trim()) {
      setFormError("يرجى ملء جميع بيانات التوصيل (الاسم، رقم الموبايل، المحافظة، الحي، والعنوان بالتفصيل)");
      return;
    }

    if (paymentMethod !== "cod" && paymentType === "deposit" && !paymentReference && !paymentProofUrl) {
      setFormError("يرجى إدخال رقم عملية التحويل أو رفع سكرين الشوت لتأكيد دفع العربون (30%)");
      return;
    }

    try {
      setStatus("loading");
      const orderData = {
        customerName: fullName,
        email,
        phone,
        whatsapp,
        governorate: currentGov.ar + " (" + currentGov.en + ")",
        city,
        address,
        notes,
        items: state.items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          productImage: it.product.images[0]?.src || "/hero.jpg",
          quantity: it.quantity,
          price: it.product.price || 0,
          selectedSize: it.selectedSize,
          selectedColor: it.selectedColor,
        })),
        subtotal,
        shippingFee,
        total: grandTotal,
        paymentMethod,
        paymentType,
        depositAmount,
        remainingAmount,
        paymentProofUrl,
        paymentReference,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إرسال الطلب");
      }

      setStatus("success");

      // Format Instagram order confirmation message
      const itemsList = state.items
        .map((it) => `• ${it.quantity}× ${it.product.name}${it.selectedSize ? ` (${it.selectedSize})` : ""}`)
        .join("\n");

      const paymentMethodArabic =
        paymentMethod === "instapay"
          ? "انستاباي (InstaPay)"
          : paymentMethod === "vodafone_cash"
          ? "فودافون كاش"
          : paymentMethod === "paypal"
          ? "PayPal"
          : "الدفع عند الاستلام (كاش)";

      const igOrderMessage = `مرحباً Triple Z 👋
أتممت طلبي عبر الموقع برقم: #${data.orderId}

📋 بيانات العميل:
- الاسم: ${fullName.trim()}
- الهاتف: ${phone.trim()}
- العنوان: ${currentGov.ar} — ${city} (${address.trim()})
${notes && notes.trim() ? `- ملاحظات: ${notes.trim()}\n` : ""}
👕 القطع المطلوبة:
${itemsList}

💵 إجمالي الفاتورة: ${grandTotal} ج.م
- طريقة الدفع: ${paymentMethodArabic}
${paymentType === "deposit" ? `- عربون (30%): ${depositAmount} ج.م (متبقي عند الاستلام: ${remainingAmount} ج.م)` : "- مدفوع بالكامل (100%)"}

أرجو تأكيد استلام الطلب وشحنه. شكراً لكم!`;

      // Copy to clipboard immediately inside user click gesture
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(igOrderMessage);
        }
      } catch {
        // Fallback handled on confirmation page
      }

      // Store in sessionStorage for order-confirmation page
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(
            "tz_last_order_details",
            JSON.stringify({
              orderId: data.orderId,
              message: igOrderMessage,
              customerName: fullName.trim(),
              phone: phone.trim(),
              total: grandTotal,
              paymentMethod: paymentMethodArabic,
            })
          );
        } catch {}
      }

      clearCart();
      router.push(`/order-confirmation?orderId=${data.orderId}`);
    } catch (err: any) {
      setStatus("idle");
      setFormError(err.message || "حدث خطأ أثناء معالجة الطلب");
    }
  };

  if (state.items.length === 0 && status !== "success") {
    return (
      <div className="checkout-page" dir="rtl" lang="ar">
        <div className="site-container" style={{ textAlign: "center", paddingTop: "6rem" }}>
          <div
            aria-hidden="true"
            style={{
              width: 76,
              height: 76,
              marginInline: "auto",
              marginBottom: "1.5rem",
              borderRadius: "50%",
              background: "rgba(201, 169, 110, 0.08)",
              border: "1px solid rgba(201, 169, 110, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--clr-accent)",
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h1 className="display-md" style={{ marginBottom: "1rem" }}>حقيبة التسوق فارغة</h1>
          <p style={{ color: "var(--clr-text-secondary)", marginBottom: "2rem" }}>أضف قطعك المفضلة أولاً قبل إتمام الطلب.</p>
          <Link href="/shop" className="btn btn-pill-white">تصفح الكولكشن ←</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page" dir="rtl" lang="ar">
      <div className="site-container">
        <div className="mockup-eyebrow">
          <span className="mockup-gold-dash" />
          <span>CHECKOUT • توصيل داخل مصر فقط</span>
        </div>
        <h1 className="display-md" style={{ marginBottom: "2.5rem" }}>إتمام الطلب (CHECKOUT)</h1>

        {/* 1. Customer Auth Banner / Gate */}
        {!authLoading && !customer && (
          <div style={{ background: "rgba(201, 169, 110, 0.08)", border: "1px solid var(--clr-accent)", borderRadius: "var(--radius-lg)", padding: "1.75rem", marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--clr-accent)" }}>
                  خطوة تسجيل الدخول / حساب المشتري
                </h3>
                <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem", margin: "0.25rem 0 0" }}>
                  لضمان متابعة وتأكيد طلبك، يرجى تسجيل الدخول أو إنشاء حساب سريع بالبريد ورقم الهاتف
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setAuthTab("register")}
                  style={{
                    padding: "0.4rem 1rem",
                    borderRadius: "999px",
                    border: "none",
                    background: authTab === "register" ? "var(--clr-accent)" : "rgba(255, 255, 255, 0.08)",
                    color: authTab === "register" ? "#000" : "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  حساب جديد
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  style={{
                    padding: "0.4rem 1rem",
                    borderRadius: "999px",
                    border: "none",
                    background: authTab === "login" ? "var(--clr-accent)" : "rgba(255, 255, 255, 0.08)",
                    color: authTab === "login" ? "#000" : "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  تسجيل الدخول
                </button>
              </div>
            </div>

            {authError && (
              <div style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "1rem", background: "rgba(239, 68, 68, 0.1)", padding: "0.6rem", borderRadius: "var(--radius-sm)" }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "flex-end" }}>
              {authTab === "register" && (
                <>
                  <div className="form-group">
                    <label className="form-label">الاسم بالكامل *</label>
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      className="form-input"
                      placeholder="محمد أحمد"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">رقم الهاتف *</label>
                    <input
                      type="tel"
                      required
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="form-input"
                      placeholder="01012345678"
                    />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني *</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="form-input"
                  placeholder="name@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">كلمة المرور *</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="btn btn-pill-white"
                  style={{ width: "100%", padding: "0.85rem" }}
                >
                  {authSubmitting ? "جاري المعالجة..." : authTab === "register" ? "تأكيد وإنشاء الحساب" : "تسجيل الدخول"}
                </button>
              </div>
            </form>
          </div>
        )}

        {customer && (
          <div style={{ background: "var(--clr-success-bg)", border: "1px solid var(--clr-success)", borderRadius: "var(--radius-md)", padding: "0.9rem 1.25rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ color: "var(--clr-success)", fontWeight: 600 }}>
              ✓ مسجل بحساب: <strong>{customer.fullName}</strong> ({customer.email})
            </span>
            <Link href="/account" style={{ color: "var(--clr-text-secondary)", fontSize: "0.85rem", textDecoration: "underline" }}>
              إدارة الحساب / تعديل
            </Link>
          </div>
        )}

        {formError && (
          <div style={{ background: "var(--clr-error-bg)", border: "1px solid var(--clr-error)", color: "var(--clr-text-primary)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "2rem" }}>
            {formError}
          </div>
        )}

        {/* Main Checkout Grid */}
        <div className="checkout-grid">
          <form onSubmit={handleSubmitOrder} noValidate>
            {/* Delivery Details */}
            <div className="checkout-form-section">
              <h2 className="checkout-section-title">بيانات الشحن والتوصيل (داخل مصر)</h2>
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">الاسم بالكامل لاستلام الشحنة *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input"
                    placeholder="الاسم ثلاثي"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">رقم الهاتف (للتواصل مع المندوب) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    placeholder="01012345678"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">رقم الواتساب أو حساب الإنستغرام *</label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="form-input"
                    placeholder="رقم الواتساب أو @instagram"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">المحافظة (جمهورية مصر العربية) *</label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="form-input"
                  >
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g.en} value={g.en}>
                        {g.ar} - مصاريف الشحن: {g.shipping} ج.م
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">المدينة / الحي / المنطقة *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                    placeholder="مثال: التجمع الخامس، الدقي، سموحة..."
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">العنوان بالتفصيل (الشارع، رقم العقار، الدور، الشقة) *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                    placeholder="شارع التسعين الشمالي، عمارة 12، شقة 4"
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">ملاحظات التوصيل للطيار (اختياري)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-input"
                    placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة، بجوار مسجد..."
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-form-section">
              <h2 className="checkout-section-title">طريقة الدفع (Payment Method)</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                {/* InstaPay */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "1rem", background: paymentMethod === "instapay" ? "rgba(201,169,110,0.1)" : "var(--clr-bg-surface)", border: `1px solid ${paymentMethod === "instapay" ? "var(--clr-accent)" : "var(--clr-border)"}`, borderRadius: "var(--radius-md)", padding: "1.25rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="instapay"
                    checked={paymentMethod === "instapay"}
                    onChange={() => setPaymentMethod("instapay")}
                    style={{ marginTop: "0.25rem" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>انستا باي (InstaPay) ⚡</div>
                    <div style={{ color: "var(--clr-text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      تحويل فوري عبر تطبيق إنستاباي لجميع البنوك المصرية.
                    </div>
                  </div>
                </label>

                {/* Vodafone Cash */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "1rem", background: paymentMethod === "vodafone_cash" ? "rgba(201,169,110,0.1)" : "var(--clr-bg-surface)", border: `1px solid ${paymentMethod === "vodafone_cash" ? "var(--clr-accent)" : "var(--clr-border)"}`, borderRadius: "var(--radius-md)", padding: "1.25rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vodafone_cash"
                    checked={paymentMethod === "vodafone_cash"}
                    onChange={() => setPaymentMethod("vodafone_cash")}
                    style={{ marginTop: "0.25rem" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>فودافون كاش / محافظ إلكترونية (Vodafone Cash) 📱</div>
                    <div style={{ color: "var(--clr-text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      تحويل مباشر إلى محفظة فودافون كاش الرسمية للبراند.
                    </div>
                  </div>
                </label>

                {/* PayPal */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "1rem", background: paymentMethod === "paypal" ? "rgba(201,169,110,0.1)" : "var(--clr-bg-surface)", border: `1px solid ${paymentMethod === "paypal" ? "var(--clr-accent)" : "var(--clr-border)"}`, borderRadius: "var(--radius-md)", padding: "1.25rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                    style={{ marginTop: "0.25rem" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>PayPal 🌐</div>
                    <div style={{ color: "var(--clr-text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      الدفع عبر حساب باي بال الدولي.
                    </div>
                  </div>
                </label>

                {/* COD */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: "1rem", background: paymentMethod === "cod" ? "rgba(201,169,110,0.1)" : "var(--clr-bg-surface)", border: `1px solid ${paymentMethod === "cod" ? "var(--clr-accent)" : "var(--clr-border)"}`, borderRadius: "var(--radius-md)", padding: "1.25rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => {
                      setPaymentMethod("cod");
                      setPaymentType("full");
                    }}
                    style={{ marginTop: "0.25rem" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>الدفع نقداً عند الاستلام (Cash On Delivery) 💵</div>
                    <div style={{ color: "var(--clr-text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      دفع كامل قيمة الطلب والشحن للمندوب يداً بيد عند المعاينة والاستلام.
                    </div>
                  </div>
                </label>
              </div>

              {/* Deposit / Full Selection (For Digital Payments) */}
              {paymentMethod !== "cod" && (
                <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-md)", padding: "1.5rem", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
                    خطة الدفع:
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setPaymentType("deposit")}
                      style={{
                        padding: "1rem",
                        borderRadius: "var(--radius-md)",
                        border: paymentType === "deposit" ? "2px solid var(--clr-accent)" : "1px solid var(--clr-border)",
                        background: paymentType === "deposit" ? "rgba(201,169,110,0.1)" : "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <strong style={{ display: "block", color: "var(--clr-accent)" }}>دفع عربون (ديبوزيت 30%)</strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--clr-text-secondary)" }}>
                        تدفع الآن {depositAmount} ج.م والمتبقي ({remainingAmount} ج.م) عند الاستلام
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentType("full")}
                      style={{
                        padding: "1rem",
                        borderRadius: "var(--radius-md)",
                        border: paymentType === "full" ? "2px solid var(--clr-accent)" : "1px solid var(--clr-border)",
                        background: paymentType === "full" ? "rgba(201,169,110,0.1)" : "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <strong style={{ display: "block", color: "var(--clr-text-primary)" }}>دفع المبلغ كاملاً الآن (100%)</strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--clr-text-secondary)" }}>
                        تدفع كامل الفاتورة {grandTotal} ج.م واستلام الطلب بدون أي مبالغ إضافية
                      </span>
                    </button>
                  </div>

                  {/* Payment Instructions & Proof Upload */}
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", borderRadius: "var(--radius-md)", padding: "1.25rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color: "var(--clr-accent)" }}>
                      بيانات التحويل الخاصة بـ Triple Z:
                    </h4>
                    {paymentMethod === "instapay" && (
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--clr-text-primary)" }}>
                        عنوان الدفع (IPA): <strong>triplez@instapay</strong> أو رقم: <strong>01000000000</strong>
                      </p>
                    )}
                    {paymentMethod === "vodafone_cash" && (
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--clr-text-primary)" }}>
                        رقم محفظة فودافون كاش: <strong>01000000000</strong>
                      </p>
                    )}
                    {paymentMethod === "paypal" && (
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--clr-text-primary)" }}>
                        حساب PayPal: <strong>payments@triple-z.com</strong>
                      </p>
                    )}

                    <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className="form-group">
                        <label className="form-label">رقم الحساب المحول منه أو رقم العملية</label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="form-input"
                          placeholder="مثال: تم التحويل من 010... أو كود المعاملة"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">إرفاق سكرين شوت التحويل (Screenshot) *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofUpload}
                          className="form-input"
                          style={{ padding: "0.5rem" }}
                        />
                        {uploadingProof && <span style={{ fontSize: "0.75rem", color: "var(--clr-accent)" }}>جاري رفع الصورة...</span>}
                        {paymentProofUrl && (
                          <span style={{ fontSize: "0.8rem", color: "var(--clr-success)", display: "block", marginTop: "0.25rem" }}>
                            ✓ تم رفع سكرين التحويل بنجاح
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-pill-white"
              disabled={status === "loading"}
              style={{ width: "100%", padding: "1.2rem", fontSize: "1.05rem" }}
            >
              {status === "loading"
                ? "جاري تأكيد وتسجيل الطلب..."
                : `تأكيد الطلب الآن • ${paymentType === "deposit" && paymentMethod !== "cod" ? `${depositAmount} ج.م (عربون)` : `${grandTotal} ج.م`}`}
            </button>
          </form>

          {/* Summary Sidebar */}
          <div className="checkout-summary">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem" }}>
              مراجعة الطلب ({totalItems} قطع)
            </h2>
            {state.items.map((item) => (
              <div key={item.product.id + (item.selectedSize ?? "")} className="checkout-item-row">
                <div className="checkout-item-img">
                  <Image
                    src={item.product.images[0]?.src ?? "/hero.jpg"}
                    alt={item.product.name}
                    width={52}
                    height={52}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                </div>
                <div className="checkout-item-info">
                  <p className="checkout-item-name">{item.product.name}</p>
                  <p className="checkout-item-meta">الكمية: {item.quantity}{item.selectedSize ? ` / المقاس: ${item.selectedSize}` : ""}</p>
                </div>
                <p className="checkout-item-price">{formatPrice((item.product.price ?? 0) * item.quantity)}</p>
              </div>
            ))}

            <div style={{ borderTop: "1px solid var(--clr-border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.95rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--clr-text-secondary)" }}>
                <span>مجموع المنتجات:</span>
                <span>{subtotal} ج.م</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--clr-text-secondary)" }}>
                <span>مصاريف الشحن ({currentGov.ar}):</span>
                <span>{shippingFee} ج.م</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.2rem", borderTop: "1px solid var(--clr-border)", paddingTop: "0.75rem" }}>
                <span>إجمالي الفاتورة:</span>
                <span style={{ color: "var(--clr-accent)" }}>{grandTotal} ج.م</span>
              </div>

              {paymentMethod !== "cod" && paymentType === "deposit" && (
                <div style={{ background: "rgba(201,169,110,0.1)", border: "1px solid var(--clr-accent)", borderRadius: "var(--radius-sm)", padding: "0.75rem", marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--clr-accent)" }}>
                    <span>المطلوب تحويله الآن (30% عربون):</span>
                    <span>{depositAmount} ج.م</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--clr-text-secondary)", marginTop: "0.25rem" }}>
                    <span>المتبقي عند استلام المندوب:</span>
                    <span>{remainingAmount} ج.م</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}