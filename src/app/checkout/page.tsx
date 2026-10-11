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

  // Wizard Step: 1 = Personal info & Auth, 2 = Shipping & Location, 3 = Payment & Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Authentication requirement modal / tab state
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Step 1: Customer Contact
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Step 2: Shipping Details
  const [governorate, setGovernorate] = useState(EGYPT_GOVERNORATES[0].en);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");

  // Step 3: Payment Options
  // Default to 'deposit' (30%) with InstaPay for guaranteed limited piece reservation
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("instapay");
  const [paymentType, setPaymentType] = useState<PaymentType>("deposit");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

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
      if (currentStep === 1 && customer.fullName && customer.phone) {
        // Automatically allow progressing or keep ready
      }
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

  // Detected location confirmation modal state
  const [detectedLocationData, setDetectedLocationData] = useState<{
    govEn: string;
    govAr: string;
    city: string;
    street: string;
    displayName: string;
  } | null>(null);

  // GPS Auto-detect handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("خاصية تحديد الموقع غير مدعومة في متصفحك، يمكنك اختيار المحافظة وكتابة العنوان يدوياً.");
      return;
    }

    setDetectingGps(true);
    setGpsSuccessMsg("");
    setFormError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ar`,
            { headers: { "User-Agent": "TripleZ-Store-Checkout/1.0" } }
          );

          if (!res.ok) throw new Error("تعذر جلب تفاصيل العنوان");
          const data = await res.json();
          const addr = data.address || {};

          // Auto-match governorate
          const stateText = (addr.state || addr.province || addr.governorate || "").toLowerCase();
          const matchedGov = EGYPT_GOVERNORATES.find((g) => {
            const arName = g.ar.replace("محافظة", "").trim();
            return (
              stateText.includes(g.en.toLowerCase()) ||
              stateText.includes(arName) ||
              (data.display_name && data.display_name.includes(arName))
            );
          }) || EGYPT_GOVERNORATES[0];

          const detectedCity = addr.city || addr.town || addr.suburb || addr.neighbourhood || addr.village || "";
          const street = addr.road || addr.residential || addr.suburb || "";

          // Instead of instantly applying without user knowing, prompt confirmation modal
          setDetectedLocationData({
            govEn: matchedGov.en,
            govAr: matchedGov.ar,
            city: detectedCity,
            street,
            displayName: data.display_name || "",
          });
        } catch (err) {
          console.warn("GPS reverse error:", err);
          alert("تم التقاط إحداثياتك لكن تعذر قراءة اسم الشارع تلقائياً. يمكنك اختيار المحافظة والحي يدوياً.");
        } finally {
          setDetectingGps(false);
        }
      },
      (error) => {
        setDetectingGps(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert("تنبيه: إذن تحديد الموقع لم يُمنح في إعدادات المتصفح أو تم رفضه مسبقاً. يمكنك اختيار المحافظة وكتابة العنوان يدوياً بكل سهولة وبدون أي مشكلة.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert("تعذر قراءة إشارة GPS بدقة حالياً. يمكنك إدخال المحافظة والعنوان يدوياً.");
        } else {
          alert("استغرق تحديد الموقع وقتاً أطول من المعتاد. يرجى اختيار المحافظة والعنوان يدوياً.");
        }
      },
      { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  const handleConfirmDetectedLocation = () => {
    if (!detectedLocationData) return;
    setGovernorate(detectedLocationData.govEn);
    if (detectedLocationData.city) setCity(detectedLocationData.city);
    if (detectedLocationData.street) {
      setAddress((prev) => (prev ? prev : `${detectedLocationData.street} - `));
    }
    setGpsSuccessMsg(`✓ تم اعتماد الموقع: ${detectedLocationData.govAr}${detectedLocationData.city ? ` - ${detectedLocationData.city}` : ""}`);
    setDetectedLocationData(null);
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

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

  // Wizard Step Validations
  const validateStep1 = () => {
    if (!fullName.trim() || !phone.trim()) {
      setFormError("يرجى ملء الاسم الكامل ورقم الهاتف للمتابعة");
      return false;
    }
    setFormError("");
    return true;
  };

  const validateStep2 = () => {
    if (!city.trim() || !address.trim()) {
      setFormError("يرجى ملء الحي والعنوان بالتفصيل (الشارع، رقم العقار، الشقة) للمتابعة");
      return false;
    }
    setFormError("");
    return true;
  };

  // Submit Order
  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!customer) {
      setCurrentStep(1);
      setFormError("يرجى تسجيل الدخول أو إنشاء حساب لإتمام الطلب");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !city.trim() || !address.trim()) {
      setFormError("يرجى التأكد من ملء جميع بيانات الشحن والتواصل");
      return;
    }

    // Validation for online payments
    if (paymentMethod !== "cod") {
      if (paymentMethod === "vodafone_cash" && !paymentReference.trim()) {
        setFormError("يرجى كتابة رقم فودافون كاش الذي قمت بالتحويل منه للتحقق من المعاملة");
        return;
      }
      if (!paymentProofUrl) {
        setFormError(
          paymentMethod === "vodafone_cash"
            ? "يرجى رفع سكرين شوت من رسالة تأكيد الدفع بفودافون كاش"
            : paymentMethod === "paypal"
            ? "يرجى رفع سكرين شوت من إشعار دفع PayPal"
            : "يرجى رفع سكرين شوت من إشعار تحويل إنستاباي لتأكيد الحجز فورياً"
        );
        return;
      }
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
          ? "فودافون كاش (Vodafone Cash)"
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
${paymentType === "deposit" && paymentMethod !== "cod" ? `- العربون المودع (30% أولوية تسليم): ${depositAmount} ج.م (المتبقي عند الاستلام: ${remainingAmount} ج.م)` : "- الدفع: عند الاستلام / بالكامل"}

أرجو تأكيد استلام الطلب وشحنه بأسرع وقت. شكراً لكم!`;

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
        <div className="site-container" style={{ textAlign: "center", paddingTop: "6rem", minHeight: "60vh" }}>
          <div
            aria-hidden="true"
            style={{
              width: 76,
              height: 76,
              marginInline: "auto",
              marginBottom: "1.5rem",
              borderRadius: "50%",
              background: "rgba(226, 255, 76, 0.08)",
              border: "1px solid rgba(226, 255, 76, 0.25)",
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
        {/* Header & Badges */}
        <div style={{ marginBottom: "2rem" }}>
          <div className="mockup-eyebrow">
            <span className="mockup-gold-dash" />
            <span>CHECKOUT • شحن وتوصيل فوري لجميع محافظات مصر</span>
          </div>
          <h1 className="display-md" style={{ marginBottom: "0.5rem" }}>إتمام الطلب</h1>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.95rem" }}>
            جميع قطع Triple Z تصدر بكميات حصرية محدودة (Limited Edition Drops).
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="checkout-stepper-container">
          {[
            { num: 1, title: "بيانات العميل", desc: "الحساب والتواصل" },
            { num: 2, title: "عنوان التوصيل", desc: "تحديد الموقع GPS" },
            { num: 3, title: "طريقة الدفع", desc: "أولوية الحجز والعربون" },
          ].map((st) => {
            const isActive = currentStep === st.num;
            const isDone = currentStep > st.num;
            return (
              <div
                key={st.num}
                className="checkout-step-item"
                onClick={() => {
                  if (st.num === 1) setCurrentStep(1);
                  if (st.num === 2 && validateStep1()) setCurrentStep(2);
                  if (st.num === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                }}
                style={{
                  opacity: isActive ? 1 : isDone ? 0.9 : 0.5,
                  transition: "opacity 0.2s ease"
                }}
              >
                <div
                  className="checkout-step-circle"
                  style={{
                    background: isDone
                      ? "var(--clr-accent)"
                      : isActive
                      ? "rgba(226, 255, 76, 0.15)"
                      : "rgba(255, 255, 255, 0.05)",
                    color: isDone ? "#000" : isActive ? "var(--clr-accent)" : "#fff",
                    border: isActive ? "2px solid var(--clr-accent)" : "1px solid rgba(255, 255, 255, 0.1)"
                  }}
                >
                  {isDone ? "✓" : st.num}
                </div>
                <div>
                  <div className="checkout-step-title" style={{ fontWeight: 700, fontSize: "0.95rem", color: isActive ? "var(--clr-accent)" : "inherit" }}>
                    {st.title}
                  </div>
                  <div className="checkout-step-desc" style={{ fontSize: "0.75rem", color: "var(--clr-text-secondary)" }}>
                    {st.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Error message */}
        {formError && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #ef4444",
            color: "#fca5a5",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "2rem",
            fontSize: "0.95rem"
          }}>
            ⚠️ {formError}
          </div>
        )}

        {/* Main Grid: Form Steps + Sticky Order Summary */}
        <div className="checkout-grid" style={{ alignItems: "flex-start" }}>
          <div>
            <form onSubmit={handleSubmitOrder} noValidate>
              {/* ================= STEP 1: Personal Info & Customer Gate ================= */}
              {currentStep === 1 && (
                <div className="checkout-form-section" style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h2 className="checkout-section-title" style={{ margin: 0 }}>الخطوة 1: بيانات العميل والحساب</h2>
                    <span style={{ fontSize: "0.85rem", color: "var(--clr-accent)" }}>1 من 3</span>
                  </div>

                  {/* Auth Requirement Gate */}
                  {!authLoading && !customer && (
                    <div style={{
                      background: "rgba(226, 255, 76, 0.05)",
                      border: "1px solid rgba(226, 255, 76, 0.3)",
                      borderRadius: "var(--radius-md)",
                      padding: "1.25rem",
                      marginBottom: "1.5rem"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div>
                          <strong style={{ color: "var(--clr-accent)", fontSize: "0.95rem" }}>
                            👤 يرجى الدخول أو تسجيل حساب لمتابعة طلبك:
                          </strong>
                          <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}>
                            الحساب يحفظ سجل فواتيرك ويسهل شحن دروباتك القادمة.
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            type="button"
                            onClick={() => setAuthTab("register")}
                            style={{
                              padding: "0.35rem 0.85rem",
                              borderRadius: "999px",
                              border: "none",
                              background: authTab === "register" ? "var(--clr-accent)" : "rgba(255, 255, 255, 0.08)",
                              color: authTab === "register" ? "#000" : "#fff",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            حساب جديد
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuthTab("login")}
                            style={{
                              padding: "0.35rem 0.85rem",
                              borderRadius: "999px",
                              border: "none",
                              background: authTab === "login" ? "var(--clr-accent)" : "rgba(255, 255, 255, 0.08)",
                              color: authTab === "login" ? "#000" : "#fff",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            تسجيل الدخول
                          </button>
                        </div>
                      </div>

                      {authError && (
                        <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                          {authError}
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", alignItems: "flex-end" }}>
                        {authTab === "register" && (
                          <>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: "0.8rem" }}>الاسم *</label>
                              <input
                                type="text"
                                required
                                value={authFullName}
                                onChange={(e) => {
                                  setAuthFullName(e.target.value);
                                  setFullName(e.target.value);
                                }}
                                className="form-input"
                                placeholder="محمد أحمد"
                                style={{ padding: "0.6rem" }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: "0.8rem" }}>رقم الموبايل *</label>
                              <input
                                type="tel"
                                required
                                value={authPhone}
                                onChange={(e) => {
                                  setAuthPhone(e.target.value);
                                  setPhone(e.target.value);
                                }}
                                className="form-input"
                                placeholder="01012345678"
                                style={{ padding: "0.6rem" }}
                              />
                            </div>
                          </>
                        )}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: "0.8rem" }}>البريد الإلكتروني *</label>
                          <input
                            type="email"
                            required
                            value={authEmail}
                            onChange={(e) => {
                              setAuthEmail(e.target.value);
                              setEmail(e.target.value);
                            }}
                            className="form-input"
                            placeholder="name@example.com"
                            style={{ padding: "0.6rem" }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: "0.8rem" }}>كلمة المرور *</label>
                          <input
                            type="password"
                            required
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="form-input"
                            placeholder="••••••••"
                            style={{ padding: "0.6rem" }}
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={handleAuthSubmit}
                            disabled={authSubmitting}
                            className="btn btn-pill-white"
                            style={{ width: "100%", padding: "0.65rem", fontSize: "0.85rem" }}
                          >
                            {authSubmitting ? "جاري الحفظ..." : authTab === "register" ? "إنشاء الحساب ✓" : "دخول ✓"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {customer && (
                    <div style={{
                      background: "rgba(34, 197, 94, 0.08)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.85rem 1.25rem",
                      marginBottom: "1.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ color: "#4ade80", fontWeight: 700, fontSize: "0.9rem" }}>
                        ✓ مرحباً {customer.fullName} ({customer.phone || customer.email})
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}>تم استرجاع بياناتك</span>
                    </div>
                  )}

                  {/* Customer Information Inputs */}
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">الاسم بالكامل (لاستلام الشحنة) *</label>
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
                      <label className="form-label">رقم الهاتف الأساسي (للمندوب وشركة الشحن) *</label>
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
                      <label className="form-label">رقم الواتساب أو حساب الإنستغرام (للتأكيد السريع)</label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="form-input"
                        placeholder="010... أو @username"
                      />
                    </div>

                    <div className="form-group full">
                      <label className="form-label">البريد الإلكتروني (لتلقي إشعار الفاتورة والشحن)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        placeholder="example@mail.com"
                      />
                    </div>
                  </div>

                  <div className="checkout-nav-actions" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep1()) setCurrentStep(2);
                      }}
                      className="btn btn-pill-white"
                      style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}
                    >
                      التالي: عنوان التوصيل ←
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: Shipping & 1-Tap GPS Auto Detect ================= */}
              {currentStep === 2 && (
                <div className="checkout-form-section" style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h2 className="checkout-section-title" style={{ margin: 0 }}>الخطوة 2: عنوان الشحن والتوصيل</h2>
                    <span style={{ fontSize: "0.85rem", color: "var(--clr-accent)" }}>2 من 3</span>
                  </div>

                  {/* 1-Tap GPS Location Button */}
                  <div className="checkout-gps-banner">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>📍</span>
                        <strong style={{ fontSize: "1rem", color: "var(--clr-accent)" }}>
                          تحديد موقعي الحالي تلقائياً (GPS)
                        </strong>
                      </div>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--clr-text-secondary)" }}>
                        ضغطة واحدة تكشف محافظتك والمنطقة وتملأ تفاصيل التوصيل أوتوماتيكياً.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingGps}
                      className="btn btn-outline"
                      style={{
                        padding: "0.7rem 1.4rem",
                        borderColor: "var(--clr-accent)",
                        color: "var(--clr-accent)",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer"
                      }}
                    >
                      {detectingGps ? (
                        <>
                          <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
                          جاري تحديد الموقع بدقة...
                        </>
                      ) : (
                        <>
                          <span>🎯</span>
                          تحديد مكاني الآن
                        </>
                      )}
                    </button>
                  </div>

                  {/* Detected Location Confirmation Modal / Card */}
                  {detectedLocationData && (
                    <div style={{
                      background: "rgba(226, 255, 76, 0.08)",
                      border: "2px solid var(--clr-accent)",
                      borderRadius: "var(--radius-md)",
                      padding: "1.25rem",
                      marginBottom: "1.5rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>🎯</span>
                        <strong style={{ color: "var(--clr-accent)", fontSize: "1rem" }}>
                          تم التقاط موقعك! هل تود اعتماده؟
                        </strong>
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "var(--clr-text-primary)", marginBottom: "0.75rem", lineHeight: "1.6" }}>
                        <div>• <strong>المحافظة:</strong> {detectedLocationData.govAr}</div>
                        {detectedLocationData.city && <div>• <strong>المنطقة / الحي:</strong> {detectedLocationData.city}</div>}
                        {detectedLocationData.street && <div>• <strong>الشارع المكتشف:</strong> {detectedLocationData.street}</div>}
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={handleConfirmDetectedLocation}
                          className="btn btn-pill-white"
                          style={{ padding: "0.55rem 1.25rem", fontSize: "0.85rem", fontWeight: 800 }}
                        >
                          نعم، اعتمد هذا العنوان ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetectedLocationData(null)}
                          className="btn btn-outline"
                          style={{ padding: "0.55rem 1rem", fontSize: "0.85rem" }}
                        >
                          إلغاء وتعديل يدوياً ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {gpsSuccessMsg && (
                    <div style={{
                      background: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid #22c55e",
                      color: "#4ade80",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "1.25rem",
                      fontSize: "0.85rem"
                    }}>
                      {gpsSuccessMsg}
                    </div>
                  )}

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">المحافظة (جمهورية مصر العربية) *</label>
                      <select
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        className="form-input"
                      >
                        {EGYPT_GOVERNORATES.map((g) => (
                          <option key={g.en} value={g.en}>
                            {g.ar} - شحن: {g.shipping} ج.م
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
                      <label className="form-label">العنوان بالتفصيل (الشارع، رقم العقار، الدور، رقم الشقة) *</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="form-input"
                        placeholder="شارع التسعين الشمالي، عمارة 14، الدور الثالث، شقة 8"
                      />
                    </div>

                    <div className="form-group full">
                      <label className="form-label">ملاحظات التوصيل للطيار (اختياري)</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="form-input"
                        placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة، بجوار صيدلية..."
                      />
                    </div>
                  </div>

                  <div className="checkout-nav-actions">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="btn btn-outline"
                      style={{ padding: "0.9rem 1.5rem" }}
                    >
                      → العودة للبيانات
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep2()) setCurrentStep(3);
                      }}
                      className="btn btn-pill-white"
                      style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}
                    >
                      التالي: طريقة الدفع والأولوية ←
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 3: Payment Choice & Deposit Priority ================= */}
              {currentStep === 3 && (
                <div className="checkout-form-section" style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h2 className="checkout-section-title" style={{ margin: 0 }}>الخطوة 3: خطة الدفع وتأكيد الحجز</h2>
                    <span style={{ fontSize: "0.85rem", color: "var(--clr-accent)" }}>3 من 3</span>
                  </div>

                  {/* Priority Guarantee Banner: Deposit vs COD */}
                  <div style={{
                    background: "linear-gradient(135deg, rgba(226, 255, 76, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%)",
                    border: "1px solid var(--clr-accent)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.25rem",
                    marginBottom: "1.75rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.3rem" }}>⚡</span>
                      <strong style={{ color: "var(--clr-accent)", fontSize: "1.05rem" }}>
                        ضمان حجز القطعة وأولوية التجهيز والشحن
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: "1.6", color: "var(--clr-text-secondary)" }}>
                      نظراً لأن جميع قطع Triple Z تُنتج بأعداد حصرية محدودة (Limited Edition Drops)، فإن <strong style={{ color: "#fff" }}>العملاء الذين يدفعون عربوناً (30%) أو الدفع الرقمي</strong> يتم حجز مقاسهم فوراً وتجهيز أوردرهم بأعلى أولوية شحن. طلبات الدفع عند الاستلام تخضع لتوفر المخزون وقت خروج الشحنة.
                    </p>
                  </div>

                  {/* Payment Plans Comparison Cards */}
                  <div className="checkout-plan-grid">
                    {/* Option A: Recommended Deposit */}
                    <div
                      onClick={() => {
                        setPaymentType("deposit");
                        if (paymentMethod === "cod") setPaymentMethod("instapay");
                      }}
                      style={{
                        padding: "1.25rem",
                        borderRadius: "var(--radius-md)",
                        border: paymentType === "deposit" && paymentMethod !== "cod"
                          ? "2px solid var(--clr-accent)"
                          : "1px solid var(--clr-border)",
                        background: paymentType === "deposit" && paymentMethod !== "cod"
                          ? "rgba(226, 255, 76, 0.08)"
                          : "var(--clr-bg-surface)",
                        cursor: "pointer",
                        position: "relative",
                        transition: "border-color 0.2s"
                      }}
                    >
                      <div style={{
                        position: "absolute",
                        top: "-10px",
                        left: "15px",
                        background: "var(--clr-accent)",
                        color: "#000",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "4px"
                      }}>
                        الأسرع والأضمن ★
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>🔒</span>
                        <strong style={{ color: "var(--clr-accent)", fontSize: "1rem" }}>
                          دفع عربون 30% (حجز فوري مؤكد)
                        </strong>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--clr-text-secondary)", margin: 0, lineHeight: "1.5" }}>
                        تدفع الآن <strong style={{ color: "#fff" }}>{depositAmount} ج.م</strong> فقط عبر انستاباي أو فودافون كاش، والباقي (<strong style={{ color: "#fff" }}>{remainingAmount} ج.م</strong>) عند استلام الشحنة من المندوب.
                      </p>
                    </div>

                    {/* Option B: COD */}
                    <div
                      onClick={() => {
                        setPaymentMethod("cod");
                        setPaymentType("full");
                      }}
                      style={{
                        padding: "1.25rem",
                        borderRadius: "var(--radius-md)",
                        border: paymentMethod === "cod"
                          ? "2px solid var(--clr-accent)"
                          : "1px solid var(--clr-border)",
                        background: paymentMethod === "cod"
                          ? "rgba(226, 255, 76, 0.08)"
                          : "var(--clr-bg-surface)",
                        cursor: "pointer",
                        transition: "border-color 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>💵</span>
                        <strong style={{ color: "var(--clr-text-primary)", fontSize: "1rem" }}>
                          الدفع نقداً عند الاستلام (COD)
                        </strong>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--clr-text-secondary)", margin: 0, lineHeight: "1.5" }}>
                        دفع كامل المبلغ <strong style={{ color: "#fff" }}>{grandTotal} ج.م</strong> كاش للمندوب يداً بيد عند الوصول (الأولوية الثانية في جدول الشحن).
                      </p>
                    </div>
                  </div>

                  {/* Payment Channel Selection (When Digital / Deposit is active) */}
                  {paymentMethod !== "cod" && (
                    <div style={{
                      background: "var(--clr-bg-surface)",
                      border: "1px solid var(--clr-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "1.25rem",
                      marginBottom: "1.75rem"
                    }}>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 1rem" }}>
                        اختر وسيلة تحويل العربون ({depositAmount} ج.م):
                      </h3>

                      <div className="checkout-payment-channel-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                        {/* InstaPay */}
                        <div
                          onClick={() => setPaymentMethod("instapay")}
                          style={{
                            padding: "1rem",
                            borderRadius: "var(--radius-md)",
                            border: paymentMethod === "instapay" ? "2px solid var(--clr-accent)" : "1px solid var(--clr-border)",
                            background: paymentMethod === "instapay" ? "rgba(226, 255, 76, 0.05)" : "transparent",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
                            <span>⚡</span>
                            <span>انستا باي (InstaPay)</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--clr-text-secondary)", marginTop: "0.3rem" }}>
                            سكرين شوت من التحويل فقط
                          </div>
                        </div>

                        {/* Vodafone Cash */}
                        <div
                          onClick={() => setPaymentMethod("vodafone_cash")}
                          style={{
                            padding: "1rem",
                            borderRadius: "var(--radius-md)",
                            border: paymentMethod === "vodafone_cash" ? "2px solid var(--clr-accent)" : "1px solid var(--clr-border)",
                            background: paymentMethod === "vodafone_cash" ? "rgba(226, 255, 76, 0.05)" : "transparent",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
                            <span>📱</span>
                            <span>فودافون كاش</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--clr-text-secondary)", marginTop: "0.3rem" }}>
                            رقم المحول منه + سكرين شوت
                          </div>
                        </div>

                        {/* PayPal */}
                        <div
                          onClick={() => setPaymentMethod("paypal")}
                          style={{
                            padding: "1rem",
                            borderRadius: "var(--radius-md)",
                            border: paymentMethod === "paypal" ? "2px solid var(--clr-accent)" : "1px solid var(--clr-border)",
                            background: paymentMethod === "paypal" ? "rgba(226, 255, 76, 0.05)" : "transparent",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
                            <span>🌐</span>
                            <span>PayPal</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--clr-text-secondary)", marginTop: "0.3rem" }}>
                            سكرين شوت من الدفع فقط
                          </div>
                        </div>
                      </div>

                      {/* Payment Account Credentials & 1-Tap Copy */}
                      <div style={{
                        background: "rgba(0, 0, 0, 0.4)",
                        borderRadius: "var(--radius-md)",
                        padding: "1.25rem",
                        border: "1px solid rgba(255, 255, 255, 0.08)"
                      }}>
                        {paymentMethod === "instapay" && (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                              <div>
                                <span style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}>عنوان الدفع اللحظي (IPA):</span>
                                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--clr-accent)", letterSpacing: "0.03em", wordBreak: "break-all" }}>
                                  migohlmy@instapay
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy("migohlmy@instapay", "ipa")}
                                className="btn btn-outline"
                                style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}
                              >
                                {copiedText === "ipa" ? "✓ تم النسخ" : "نسخ IPA 📋"}
                              </button>
                            </div>

                            {/* Direct InstaPay payment link */}
                            <div style={{
                              background: "rgba(226, 255, 76, 0.06)",
                              border: "1px solid rgba(226, 255, 76, 0.2)",
                              borderRadius: "var(--radius-sm)",
                              padding: "0.75rem 1rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "0.75rem"
                            }}>
                              <div style={{ fontSize: "0.85rem" }}>
                                <span>أو اضغط لفتح رابط الدفع المباشر في إنستاباي:</span>
                              </div>
                              <a
                                href="https://ipn.eg/S/migohlmy/instapay/2BdKeD"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-pill-white"
                                style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", textDecoration: "none" }}
                              >
                                فتح رابط الدفع ↗
                              </a>
                            </div>
                          </div>
                        )}

                        {paymentMethod === "vodafone_cash" && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div>
                              <span style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}>رقم محفظة فودافون كاش المعتمد:</span>
                              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--clr-accent)", letterSpacing: "0.08em" }}>
                                01044463717
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy("01044463717", "voda")}
                              className="btn btn-outline"
                              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                            >
                              {copiedText === "voda" ? "✓ تم النسخ" : "نسخ الرقم 📋"}
                            </button>
                          </div>
                        )}

                        {paymentMethod === "paypal" && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div>
                              <span style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}>حساب PayPal الرسمي:</span>
                              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--clr-accent)", letterSpacing: "0.03em" }}>
                                payments@triple-z.com
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy("payments@triple-z.com", "paypal")}
                              className="btn btn-outline"
                              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                            >
                              {copiedText === "paypal" ? "✓ تم النسخ" : "نسخ الإيميل 📋"}
                            </button>
                          </div>
                        )}

                        {/* Transaction reference & Screenshot Upload */}
                        <div style={{ marginTop: "1.25rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1rem" }}>
                          <div className={paymentMethod === "vodafone_cash" ? "checkout-proof-grid" : ""}>
                            {/* Phone number input required ONLY for Vodafone Cash */}
                            {paymentMethod === "vodafone_cash" && (
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">الرقم الذي قمت بالتحويل منه (محفظة فودافون كاش) *</label>
                                <input
                                  type="tel"
                                  required
                                  value={paymentReference}
                                  onChange={(e) => setPaymentReference(e.target.value)}
                                  className="form-input"
                                  placeholder="010XXXXXXXX"
                                />
                              </div>
                            )}

                            {/* Screenshot Upload for all online payments (InstaPay / Vodafone Cash / PayPal) */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">
                                {paymentMethod === "vodafone_cash"
                                  ? "ارفع سكرين شوت من رسالة الدفع والتأكيد *"
                                  : "ارفع سكرين شوت من إشعار التحويل الناجح *"}
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleProofUpload}
                                className="form-input"
                                style={{ padding: "0.5rem" }}
                              />
                              {uploadingProof && (
                                <span style={{ fontSize: "0.75rem", color: "var(--clr-accent)", display: "block", marginTop: "0.25rem" }}>
                                  جاري رفع الصورة...
                                </span>
                              )}
                              {paymentProofUrl && (
                                <span style={{ fontSize: "0.8rem", color: "#4ade80", display: "block", marginTop: "0.25rem" }}>
                                  ✓ تم رفع سكرين شوت التحويل بنجاح
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation & Submit Button */}
                  <div className="checkout-nav-actions">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="btn btn-outline"
                      style={{ padding: "1rem 1.75rem" }}
                    >
                      → العودة للعنوان
                    </button>

                    <button
                      type="submit"
                      className="btn btn-pill-white"
                      disabled={status === "loading"}
                      style={{ flex: 1, padding: "1.1rem", fontSize: "1.05rem", fontWeight: 800 }}
                    >
                      {status === "loading"
                        ? "جاري تأكيد وتسجيل الطلب..."
                        : `تأكيد الطلب النهائي • ${paymentType === "deposit" && paymentMethod !== "cod" ? `${depositAmount} ج.م (عربون)` : `${grandTotal} ج.م`}`}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Sticky Summary Sidebar */}
          <div className="checkout-summary" style={{ position: "sticky", top: "100px" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
              مراجعة الطلب ({totalItems} قطع)
            </h2>

            <div style={{ maxHeight: "280px", overflowY: "auto", marginBottom: "1rem" }}>
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
                    <p className="checkout-item-meta">
                      الكمية: {item.quantity}{item.selectedSize ? ` / المقاس: ${item.selectedSize}` : ""}
                    </p>
                  </div>
                  <p className="checkout-item-price">{formatPrice((item.product.price ?? 0) * item.quantity)}</p>
                </div>
              ))}
            </div>

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
                <div style={{
                  background: "rgba(226, 255, 76, 0.08)",
                  border: "1px solid var(--clr-accent)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem",
                  marginTop: "0.5rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--clr-accent)" }}>
                    <span>المطلوب دفعه الآن (30% عربون):</span>
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