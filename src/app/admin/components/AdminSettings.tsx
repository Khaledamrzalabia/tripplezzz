"use client";

import { useState, useEffect } from "react";
import type { StoreSettings } from "../../../types/settings";
import { DEFAULT_STORE_SETTINGS } from "../../../types/settings";

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch("/api/settings?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        throw new Error("فشل جلب الإعدادات من السيرفر");
      }
    } catch (err: any) {
      console.error("Fetch settings error:", err);
      setErrorMsg(err.message || "حدث خطأ أثناء تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccessMsg("");
      setErrorMsg("");

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaveSuccessMsg("تم حفظ كافة التعديلات وتحديث المتجر بنجاح! ✓");
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      } else {
        throw new Error(data.error || "فشل حفظ الإعدادات");
      }
    } catch (err: any) {
      console.error("Save settings error:", err);
      setErrorMsg(err.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("هل أنت متأكد من استعادة إعدادات الدفع والسوشيال الافتراضية؟")) return;
    try {
      setSaving(true);
      setSaveSuccessMsg("");
      setErrorMsg("");

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSettings(data.settings);
        setSaveSuccessMsg("تمت استعادة الإعدادات الافتراضية بنجاح! ✓");
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      } else {
        throw new Error(data.error || "فشل استعادة الإعدادات");
      }
    } catch (err: any) {
      console.error("Reset error:", err);
      setErrorMsg(err.message || "فشلت الاستعادة");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-state" style={{ padding: "4rem 0" }}>
        <div className="admin-spinner" />
        <p>جاري تحميل إعدادات الدفع والروابط...</p>
      </div>
    );
  }

  return (
    <div className="admin-settings-container" style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Banner & Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚙️</span>
            <span>إعدادات الدفع والسوشيال ميديا</span>
          </h2>
          <p style={{ color: "var(--clr-text-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
            تحكم كامل في أرقام محافظ الدفع الإلكتروني (فودافون كاش، إنستاباي، باي بال) وروابط التواصل الاجتماعي التي تظهر للعملاء في المتجر وصفحة الدفع.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="btn btn-outline"
            style={{ fontSize: "0.85rem", padding: "0.55rem 1rem" }}
          >
            استعادة الافتراضي ↺
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="btn btn-primary"
            style={{ fontSize: "0.85rem", padding: "0.55rem 1.4rem" }}
          >
            {saving ? "جاري الحفظ..." : "حفظ التعديلات ✓"}
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="admin-alert-banner success" style={{ marginBottom: "1.5rem" }}>
          <span>✓</span>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="admin-alert-banner error" style={{ marginBottom: "1.5rem" }}>
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* =========================================================
            SECTION 1: PAYMENT CHANNELS & NUMBERS
           ========================================================= */}
        <div
          style={{
            background: "rgba(16, 20, 28, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "1.3rem" }}>💳</span>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>وسائل وحسابات الدفع (Payment Methods)</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--clr-text-muted)", margin: "0.2rem 0 0" }}>
                هذه البيانات تظهر مباشرة للمشتري في صفحة الدفع (Checkout) لتحويل العربون أو الدفع الكامل.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* 1. Vodafone Cash */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>📱</span>
                  <strong style={{ fontSize: "1rem", color: "#fff" }}>فودافون كاش (Vodafone Cash)</strong>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={settings.payment.vodafoneCash.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          vodafoneCash: {
                            ...settings.payment.vodafoneCash,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                  <span>مفعل في المتجر</span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">رقم محفظة فودافون كاش (Wallet Number) *</label>
                  <input
                    type="tel"
                    required
                    value={settings.payment.vodafoneCash.number}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          vodafoneCash: {
                            ...settings.payment.vodafoneCash,
                            number: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="010XXXXXXXX"
                    className="admin-form-input"
                    dir="ltr"
                    style={{ fontWeight: 700, letterSpacing: "0.08em" }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">اسم الحساب / التسمية التوضيحية (Label)</label>
                  <input
                    type="text"
                    value={settings.payment.vodafoneCash.accountName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          vodafoneCash: {
                            ...settings.payment.vodafoneCash,
                            accountName: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="مثال: محفظة فودافون كاش المعتمدة"
                    className="admin-form-input"
                  />
                </div>
              </div>
            </div>

            {/* 2. InstaPay */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>⚡</span>
                  <strong style={{ fontSize: "1rem", color: "#fff" }}>إنستا باي (InstaPay)</strong>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={settings.payment.instapay.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          instapay: {
                            ...settings.payment.instapay,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                  <span>مفعل في المتجر</span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">عنوان الدفع اللحظي (IPA) *</label>
                  <input
                    type="text"
                    required
                    value={settings.payment.instapay.ipa}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          instapay: {
                            ...settings.payment.instapay,
                            ipa: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="username@instapay"
                    className="admin-form-input"
                    dir="ltr"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">رابط الدفع المباشر إنستاباي (Direct Payment URL)</label>
                  <input
                    type="url"
                    value={settings.payment.instapay.link}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          instapay: {
                            ...settings.payment.instapay,
                            link: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="https://ipn.eg/S/..."
                    className="admin-form-input"
                    dir="ltr"
                  />
                </div>

                <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="admin-form-label">اسم المستلم في إنستاباي (Account Display Name)</label>
                  <input
                    type="text"
                    value={settings.payment.instapay.accountName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          instapay: {
                            ...settings.payment.instapay,
                            accountName: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Triple Z Official"
                    className="admin-form-input"
                  />
                </div>
              </div>
            </div>

            {/* 3. PayPal */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🌐</span>
                  <strong style={{ fontSize: "1rem", color: "#fff" }}>باي بال (PayPal)</strong>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={settings.payment.paypal.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          paypal: {
                            ...settings.payment.paypal,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                  <span>مفعل في المتجر</span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">بريد PayPal المعتمد (Email) *</label>
                  <input
                    type="email"
                    required
                    value={settings.payment.paypal.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          paypal: {
                            ...settings.payment.paypal,
                            email: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="payments@triple-z.com"
                    className="admin-form-input"
                    dir="ltr"
                    style={{ fontWeight: 600 }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">رابط PayPal.me مباشر (اختياري)</label>
                  <input
                    type="url"
                    value={settings.payment.paypal.link}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          paypal: {
                            ...settings.payment.paypal,
                            link: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="https://paypal.me/..."
                    className="admin-form-input"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            SECTION 2: SOCIAL MEDIA & COMMUNICATION CHANNELS
           ========================================================= */}
        <div
          style={{
            background: "rgba(16, 20, 28, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "1.3rem" }}>🔗</span>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>روابط السوشيال ميديا والتواصل (Social Links)</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--clr-text-muted)", margin: "0.2rem 0 0" }}>
                تتحكم هذه الروابط في أيقونات الفوتر، زر التحويل التلقائي لإنستاجرام بعد الطلب، وبانرات التواصل.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {/* Instagram Profile */}
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>📸</span>
                <span>رابط حساب إنستجرام (Instagram Profile)</span>
              </label>
              <input
                type="url"
                value={settings.social.instagram}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, instagram: e.target.value },
                  })
                }
                placeholder="https://www.instagram.com/triplez1606/"
                className="admin-form-input"
                dir="ltr"
              />
            </div>

            {/* Instagram Direct Message */}
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>💬</span>
                <span>رابط رسائل إنستجرام المباشرة (Instagram DM Link)</span>
              </label>
              <input
                type="url"
                value={settings.social.instagramDm}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, instagramDm: e.target.value },
                  })
                }
                placeholder="https://ig.me/m/triplez1606"
                className="admin-form-input"
                dir="ltr"
              />
              <span style={{ fontSize: "0.72rem", color: "var(--clr-accent)", marginTop: "4px", display: "block" }}>
                * يستخدم هذا الرابط للتحويل المباشر للعميل بعد إتمام الأوردر لتأكيد الطلب
              </span>
            </div>

            {/* TikTok */}
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>🎵</span>
                <span>رابط تيك توك (TikTok URL)</span>
              </label>
              <input
                type="url"
                value={settings.social.tiktok}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, tiktok: e.target.value },
                  })
                }
                placeholder="https://tiktok.com/@..."
                className="admin-form-input"
                dir="ltr"
              />
            </div>

            {/* WhatsApp */}
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>🟢</span>
                <span>رابط أو رقم واتساب (WhatsApp URL / Number)</span>
              </label>
              <input
                type="text"
                value={settings.social.whatsapp}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, whatsapp: e.target.value },
                  })
                }
                placeholder="https://wa.me/201044463717"
                className="admin-form-input"
                dir="ltr"
              />
            </div>

            {/* X (Twitter) */}
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>✖️</span>
                <span>رابط منصة إكس / تويتر (X / Twitter URL)</span>
              </label>
              <input
                type="url"
                value={settings.social.x}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, x: e.target.value },
                  })
                }
                placeholder="https://x.com/..."
                className="admin-form-input"
                dir="ltr"
              />
            </div>

            {/* YouTube */}
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>▶️</span>
                <span>رابط يوتيوب (YouTube Channel)</span>
              </label>
              <input
                type="url"
                value={settings.social.youtube}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, youtube: e.target.value },
                  })
                }
                placeholder="https://youtube.com/..."
                className="admin-form-input"
                dir="ltr"
              />
            </div>

            {/* Facebook */}
            <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>📘</span>
                <span>رابط صفحة فيسبوك (Facebook Page URL - اختياري)</span>
              </label>
              <input
                type="url"
                value={settings.social.facebook}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, facebook: e.target.value },
                  })
                }
                placeholder="https://facebook.com/..."
                className="admin-form-input"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: "0.85rem 2.5rem", fontSize: "1rem", fontWeight: 800 }}
          >
            {saving ? "جاري الحفظ والتحديث..." : "حفظ كافة الإعدادات الحالية ✓"}
          </button>
        </div>
      </form>
    </div>
  );
}
