"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface StoredOrderDetails {
  orderId: string;
  message: string;
  customerName?: string;
  phone?: string;
  total?: number;
  paymentMethod?: string;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "TZ-CONFIRMED";

  const [orderDetails, setOrderDetails] = useState<StoredOrderDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(4); // 4-second auto-redirect
  const [isRedirectCancelled, setIsRedirectCancelled] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Instagram DM target URL
  const instagramDmUrl = "https://ig.me/m/triplez1606";
  const instagramProfileUrl = "https://www.instagram.com/triplez1606/";

  // Default message in case sessionStorage wasn't populated
  const fallbackMessage = `مرحباً Triple Z 👋\nأتممت طلبي عبر الموقع برقم: #${orderId}\nيرجى تأكيد استلام الطلب وتجهيزه للشحن. شكراً لكم!`;

  const currentMessage = orderDetails?.message || fallbackMessage;

  useEffect(() => {
    // 1. Retrieve order details from sessionStorage if available
    let saved: StoredOrderDetails | null = null;
    try {
      const raw = sessionStorage.getItem("tz_last_order_details");
      if (raw) {
        saved = JSON.parse(raw);
        setOrderDetails(saved);
      }
    } catch {}

    const textToCopy = saved?.message || fallbackMessage;

    // 2. Automatically copy to clipboard on mount
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }

    // 3. Start 4-second countdown to open Instagram Direct automatically
    let secondsLeft = 4;
    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setCountdown(secondsLeft);

      if (secondsLeft <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        // Only redirect if user didn't cancel
        window.location.href = instagramDmUrl;
      }
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [orderId]);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCancelRedirect = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsRedirectCancelled(true);
    setCountdown(null);
  };

  return (
    <div className="page-padding order-confirmation-page" dir="rtl" lang="ar">
      <div className="site-container" style={{ maxWidth: "780px", textAlign: "center" }}>
        {/* Animated Success Badge */}
        <div className="order-conf-badge-wrap">
          <div className="order-conf-icon">✓</div>
        </div>

        <div className="mockup-eyebrow" style={{ justifyContent: "center" }}>
          <span className="mockup-gold-dash" />
          <span>تم تسجيل وتأكيد الطلب بنجاح</span>
          <span className="mockup-gold-dash" />
        </div>

        <h1 className="order-conf-title">
          شكراً لطلبك من Triple Z
        </h1>

        <p className="order-conf-subtitle">
          تم استلام طلبك برقم <strong style={{ color: "var(--clr-accent)" }}>#{orderId}</strong> وهو الآن قيد المعالجة والتجهيز.
        </p>

        {/* ======================================================================
            INSTAGRAM DIRECT AUTO-REDIRECT & CONFIRMATION BOX (HERO ACTION)
           ====================================================================== */}
        <section className="order-conf-ig-box">
          {/* Header */}
          <div className="order-conf-ig-header">
            <div className="order-conf-ig-badge">
              <span className="order-conf-ig-icon">📸</span>
              <span>تأكيد الطلب عبر إنستجرام (@triplez1606)</span>
            </div>

            {/* Countdown Banner */}
            {!isRedirectCancelled && countdown !== null && countdown > 0 ? (
              <div className="order-conf-countdown-banner">
                <span className="order-conf-countdown-dot" />
                <span>
                  جاري فتح محادثة إنستجرام تلقائياً خلال <strong>{countdown}</strong> ثوانٍ...
                </span>
                <button
                  type="button"
                  onClick={handleCancelRedirect}
                  className="order-conf-cancel-timer-btn"
                  title="البقاء في هذه الصفحة"
                >
                  إلغاء التحويل التلقائي ✕
                </button>
              </div>
            ) : null}
          </div>

          <div className="order-conf-ig-body">
            {/* Success notice */}
            <div className="order-conf-notice-pill">
              <span style={{ fontSize: "1.1rem" }}>✅</span>
              <span>
                <strong>تم نسخ تفاصيل طلبك تلقائياً إلى الحافظة!</strong>
                <br />
                عند فتح شات إنستجرام، اضغط فقط <strong>لصق (Paste)</strong> وأرسل الرسالة لخدمة العملاء لتأكيد الحجز فوراً.
              </span>
            </div>

            {/* Primary Action Button */}
            <a
              href={instagramDmUrl}
              className="order-conf-ig-btn"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>فتح محادثة إنستجرام وإرسال الرسالة (@triplez1606) ↗</span>
            </a>

            {/* Copy Button & WhatsApp Alternate */}
            <div className="order-conf-action-btns">
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-outline order-conf-secondary-btn"
              >
                <span>{copied ? "تم النسخ بنجاح! ✓" : "📋 نسخ تفاصيل الطلب مرة أخرى"}</span>
              </button>

              <a
                href={instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline order-conf-secondary-btn"
              >
                <span>زيارة صفحة @triplez1606 ↗</span>
              </a>
            </div>

            {/* Message Preview Box */}
            <div className="order-conf-message-preview">
              <div className="order-conf-preview-header">
                <span className="order-conf-preview-title">معاينة الرسالة الجاهزة للإرسال:</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="order-conf-copy-pill"
                >
                  {copied ? "تم النسخ ✓" : "نسخ الرسالة"}
                </button>
              </div>
              <pre className="order-conf-pre">{currentMessage}</pre>
            </div>
          </div>
        </section>

        {/* Timeline Progress */}
        <div className="order-conf-timeline-card">
          <h2 className="order-conf-timeline-title">
            مراحل تجهيز وتسليم الطلب
          </h2>

          <div className="order-conf-timeline-grid">
            <div className="order-conf-step completed">
              <span className="order-conf-step-num">المرحلة 1 • تم بنجاح</span>
              <p className="order-conf-step-name">تسجيل الطلب</p>
              <span className="order-conf-step-desc">تم حفظ البيانات في النظام</span>
            </div>

            <div className="order-conf-step in-progress">
              <span className="order-conf-step-num">المرحلة 2 • جاري الآن</span>
              <p className="order-conf-step-name">تأكيد الرسايل وفحص القطع</p>
              <span className="order-conf-step-desc">مراجعة المقاس وتجهيز الشحنة</span>
            </div>

            <div className="order-conf-step upcoming">
              <span className="order-conf-step-num">المرحلة 3 • قريباً</span>
              <p className="order-conf-step-name">تسليم لشركة الشحن</p>
              <span className="order-conf-step-desc">إرسال رقم التتبع مع المندوب</span>
            </div>

            <div className="order-conf-step upcoming">
              <span className="order-conf-step-num">المرحلة 4 • قريباً</span>
              <p className="order-conf-step-name">الاستلام عند باب المنزل</p>
              <span className="order-conf-step-desc">تسليم ودفع المتبقي كاش</span>
            </div>
          </div>
        </div>

        {/* Return Links */}
        <div className="order-conf-footer-links">
          <Link href="/shop" className="btn btn-pill-white">
            متابعة تصفح المتجر →
          </Link>
          <Link href="/" className="btn btn-pill-outline">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
