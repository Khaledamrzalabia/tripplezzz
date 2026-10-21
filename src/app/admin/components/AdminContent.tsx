"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Product } from "../../../types/product";
import type { SiteMediaSettings, ContactSettings } from "../../../types/settings";
import { DEFAULT_STORE_SETTINGS } from "../../../types/settings";

interface Props {
  products: Product[];
}

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(16, 20, 28, 0.85)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "20px",
  padding: "1.5rem",
  marginBottom: "2rem",
  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
};

const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1rem",
};

function SectionTitle({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
      <span style={{ fontSize: "1.3rem" }}>{icon}</span>
      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>{title}</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--clr-text-muted)", margin: "0.2rem 0 0" }}>{hint}</p>
      </div>
    </div>
  );
}

interface ImagePickerProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  productImages: { src: string; label: string }[];
}

// One editable image slot: preview + upload + pick from product photos + paste a link
function ImagePicker({ label, value, onChange, productImages }: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploading(true);
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json().catch(() => null);
      if (res.ok && result?.url) {
        onChange(result.url);
      } else {
        alert(result?.error || "فشل رفع الصورة، يرجى تجربة صورة أخرى.");
      }
    } catch {
      alert("حدث خطأ أثناء رفع الصورة.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: "rgba(0, 0, 0, 0.35)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <strong style={{ fontSize: "0.9rem" }}>{label}</strong>

      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", borderRadius: "10px", overflow: "hidden", background: "#0b0d11" }}>
        {value && (
          <Image src={value} alt={label} fill unoptimized sizes="300px" style={{ objectFit: "cover" }} />
        )}
      </div>

      <label className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "0.45rem 0.8rem", textAlign: "center", cursor: uploading ? "wait" : "pointer" }}>
        {uploading ? "جاري الرفع..." : "رفع صورة من الجهاز ⬆"}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleUpload} disabled={uploading} hidden />
      </label>

      {productImages.length > 0 && (
        <select
          className="admin-form-input"
          value=""
          onChange={(e) => e.target.value && onChange(e.target.value)}
          style={{ fontSize: "0.8rem" }}
        >
          <option value="">اختار من صور المنتجات...</option>
          {productImages.map((img) => (
            <option key={img.src} value={img.src}>
              {img.label}
            </option>
          ))}
        </select>
      )}

      <input
        type="text"
        dir="ltr"
        className="admin-form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/hero.webp أو https://..."
        style={{ fontSize: "0.75rem" }}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
  dir,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  dir?: "ltr" | "rtl";
  placeholder?: string;
}) {
  return (
    <div className="admin-form-group">
      <label className="admin-form-label">{label}</label>
      {multiline ? (
        <textarea
          className="admin-form-input"
          value={value}
          dir={dir}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ minHeight: "80px", resize: "vertical" }}
        />
      ) : (
        <input
          type="text"
          className="admin-form-input"
          value={value}
          dir={dir}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function AdminContent({ products }: Props) {
  const [media, setMedia] = useState<SiteMediaSettings>(DEFAULT_STORE_SETTINGS.media);
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_STORE_SETTINGS.contact);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings?t=" + Date.now(), { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("فشل جلب الإعدادات من السيرفر"))))
      .then((data) => {
        if (data?.media) setMedia(data.media);
        if (data?.contact) setContact(data.contact);
      })
      .catch((err: Error) => setErrorMsg(err.message || "حدث خطأ أثناء تحميل الإعدادات"))
      .finally(() => setLoading(false));
  }, []);

  const productImages = products.flatMap((p) =>
    (p.images || []).map((img, i) => ({
      src: img.src,
      label: p.images.length > 1 ? `${p.name} (${i + 1})` : p.name,
    }))
  );

  const setMediaField = <K extends keyof SiteMediaSettings>(key: K, value: SiteMediaSettings[K]) =>
    setMedia((m) => ({ ...m, [key]: value }));

  const setListImage = (key: "craftImages" | "communityImages" | "lookbookImages", index: number, url: string) =>
    setMedia((m) => ({ ...m, [key]: m[key].map((v, i) => (i === index ? url : v)) }));

  const setContactField = (key: keyof ContactSettings, value: string) =>
    setContact((c) => ({ ...c, [key]: value }));

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccessMsg("");
      setErrorMsg("");

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media, contact }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        if (data.settings?.media) setMedia(data.settings.media);
        if (data.settings?.contact) setContact(data.settings.contact);
        setSaveSuccessMsg("تم حفظ المحتوى وتحديث المتجر بنجاح! ✓");
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      } else {
        throw new Error(data?.error || "فشل حفظ المحتوى");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-state" style={{ padding: "4rem 0" }}>
        <div className="admin-spinner" />
        <p>جاري تحميل محتوى المتجر...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🖼️</span>
            <span>المحتوى والميديا وبيانات التواصل</span>
          </h2>
          <p style={{ color: "var(--clr-text-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
            غيّر صور ونصوص الصفحة الرئيسية وبيانات صفحة Contact Us. أي تعديل بيظهر في المتجر بعد الحفظ.
          </p>
        </div>
        <button type="button" onClick={() => handleSave()} disabled={saving} className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.55rem 1.4rem" }}>
          {saving ? "جاري الحفظ..." : "حفظ التعديلات ✓"}
        </button>
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
        {/* 0. Brand identity */}
        <div style={CARD_STYLE}>
          <SectionTitle icon="✨" title="هوية الموقع" hint="اللوجو اللي في الهيدر والقوائم، أيقونة تاب المتصفح، والصورة اللي بتظهر لما حد يشير لينك المتجر على واتساب أو فيسبوك." />
          <div style={GRID_STYLE}>
            <ImagePicker label="اللوجو" value={media.logo} onChange={(url) => setMediaField("logo", url)} productImages={productImages} />
            <ImagePicker label="أيقونة تاب المتصفح (يفضل صورة مربعة)" value={media.favicon} onChange={(url) => setMediaField("favicon", url)} productImages={productImages} />
            <ImagePicker label="صورة المشاركة على السوشيال" value={media.shareImage} onChange={(url) => setMediaField("shareImage", url)} productImages={productImages} />
          </div>
        </div>

        {/* 1. Hero */}
        <div style={CARD_STYLE}>
          <SectionTitle icon="🏟️" title="الهيرو (أول حاجة بتظهر في الموقع)" hint="الصورة الكبيرة والنصوص اللي فوقها في أول الصفحة الرئيسية." />
          <div style={GRID_STYLE}>
            <ImagePicker label="صورة الهيرو" value={media.heroImage} onChange={(url) => setMediaField("heroImage", url)} productImages={productImages} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <TextField label="السطر الصغير فوق العنوان" dir="ltr" value={media.heroEyebrow} onChange={(v) => setMediaField("heroEyebrow", v)} />
              <TextField label="الوصف تحت العنوان (كل سطر في سطر لوحده)" dir="ltr" multiline value={media.heroSubtitle} onChange={(v) => setMediaField("heroSubtitle", v)} />
            </div>
          </div>
        </div>

        {/* 2. Products section */}
        <div style={CARD_STYLE}>
          <SectionTitle icon="👕" title="قسم المنتجات" hint="العنوان اللي فوق كل المنتجات تحت الهيرو على طول." />
          <div style={GRID_STYLE}>
            <TextField label="عنوان القسم" dir="ltr" value={media.productsTitle} onChange={(v) => setMediaField("productsTitle", v)} />
            <TextField label="الوصف تحت العنوان" dir="ltr" value={media.productsSubtitle} onChange={(v) => setMediaField("productsSubtitle", v)} />
          </div>
        </div>

        {/* 3. Brand sections */}
        <div style={CARD_STYLE}>
          <SectionTitle icon="📸" title="صور أقسام البراند" hint="صور قسم Football Culture وكروت الـ Craft وجاليري الكوميونيتي في الصفحة الرئيسية." />
          <div style={GRID_STYLE}>
            <ImagePicker label="صورة Football Culture" value={media.cultureImage} onChange={(url) => setMediaField("cultureImage", url)} productImages={productImages} />
            {media.craftImages.map((src, i) => (
              <ImagePicker key={`craft-${i}`} label={`كارت Craft ${i + 1}`} value={src} onChange={(url) => setListImage("craftImages", i, url)} productImages={productImages} />
            ))}
            {media.communityImages.map((src, i) => (
              <ImagePicker key={`community-${i}`} label={`صورة الكوميونيتي ${i + 1}`} value={src} onChange={(url) => setListImage("communityImages", i, url)} productImages={productImages} />
            ))}
          </div>
        </div>

        {/* 4. Other pages */}
        <div style={CARD_STYLE}>
          <SectionTitle icon="📖" title="صور صفحات About و Lookbook" hint="صورة صفحة About، وصور قصص صفحة Lookbook بنفس ترتيبها في الصفحة." />
          <div style={GRID_STYLE}>
            <ImagePicker label="صورة صفحة About" value={media.aboutImage} onChange={(url) => setMediaField("aboutImage", url)} productImages={productImages} />
            {media.lookbookImages.map((src, i) => (
              <ImagePicker key={`lookbook-${i}`} label={`صورة Lookbook ${i + 1}`} value={src} onChange={(url) => setListImage("lookbookImages", i, url)} productImages={productImages} />
            ))}
          </div>
        </div>

        {/* 5. Contact */}
        <div style={CARD_STYLE}>
          <SectionTitle icon="📞" title="بيانات التواصل (Contact Us)" hint="البيانات دي بتظهر في صفحة Contact Us. سيب أي خانة فاضية لو مش عايزها تظهر." />
          <div style={GRID_STYLE}>
            <TextField label="الإيميل" dir="ltr" value={contact.email} onChange={(v) => setContactField("email", v)} placeholder="hello@triplez.com" />
            <TextField label="رقم التليفون" dir="ltr" value={contact.phone} onChange={(v) => setContactField("phone", v)} placeholder="01012345678" />
            <TextField label="رقم الواتساب (بكود الدولة)" dir="ltr" value={contact.whatsapp} onChange={(v) => setContactField("whatsapp", v)} placeholder="201012345678" />
            <TextField label="العنوان" value={contact.address} onChange={(v) => setContactField("address", v)} placeholder="القاهرة، مصر" />
            <TextField label="مواعيد العمل" value={contact.workingHours} onChange={(v) => setContactField("workingHours", v)} placeholder="يومياً من 12 الظهر لـ 10 بالليل" />
            <TextField label="مدة الرد" value={contact.responseTime} onChange={(v) => setContactField("responseTime", v)} />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <TextField label="الجملة التعريفية في أول الصفحة" multiline value={contact.intro} onChange={(v) => setContactField("intro", v)} />
          </div>
        </div>
      </form>
    </div>
  );
}
