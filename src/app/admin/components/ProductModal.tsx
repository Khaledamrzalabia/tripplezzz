"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductCategory, ProductAvailability } from "../../../types/product";

const CATEGORIES: ProductCategory[] = ["tops", "bottoms", "outerwear", "accessories", "footwear"];

const AVAILABILITIES: { value: ProductAvailability; label: string; labelAr: string }[] = [
  { value: "in-stock", label: "In Stock", labelAr: "متوفر" },
  { value: "low-stock", label: "Low Stock", labelAr: "كمية محدودة" },
  { value: "out-of-stock", label: "Sold Out", labelAr: "نفد / خلص" },
  { value: "coming-soon", label: "Coming Soon", labelAr: "دروب قريباً (بدون سعر)" },
];

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  category: ProductCategory;
  collection: string;
  price: string;
  availability: ProductAvailability;
  description: string;
  longDescription: string;
  craftSpecs: string;
  fitSilhouette: string;
  garmentCare: string;
  sizes: string[];
  colors: string[];
  isBlurred: boolean;
  images: { src: string; alt: string }[];
  featured: boolean;
}

interface Props {
  isOpen: boolean;
  isEditing: boolean;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export default function ProductModal({
  isOpen,
  isEditing,
  formData,
  setFormData,
  onClose,
  onSubmit,
  saving,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        const result = await res.json();
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, { src: result.url, alt: prev.name || "Product Image" }],
        }));
      } else {
        alert("فشل رفع الصورة، يرجى تجربة صورة أخرى.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("حدث خطأ أثناء رفع الصورة.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, { src: customImageUrl.trim(), alt: prev.name || "Product Image" }],
    }));
    setCustomImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleToggleSize = (size: string) => {
    setFormData((prev) => {
      const exists = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: exists ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
      };
    });
  };

  return (
    <div
      className="admin-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "تعديل المنتج" : "إضافة منتج"}
    >
      <div className="admin-product-modal-dialog">
        {/* Sticky Header */}
        <div className="admin-product-modal-header">
          <div>
            <h2 className="admin-product-modal-title">
              {isEditing ? `تعديل القطعة: ${formData.name}` : "إضافة قطعة جديدة للتشكيلة"}
            </h2>
            <p className="admin-product-modal-subtitle">
              تحكم كامل في الاسم، التسعير، الصور، المقاسات، ووضع التشويق.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-modal-close"
            aria-label="إغلاق النافذة"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="admin-product-modal-form">
          <div className="admin-product-modal-body">
            {/* 1. Basic Info Section */}
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">
                <span>🏷️</span>
                <span>البيانات الأساسية</span>
              </h3>

              <div className="admin-form-grid-2">
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    اسم المنتج (Product Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pitch Black Heavyweight Hoodie"
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    رابط المنتج (Slug)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="pitch-black-hoodie (تلقائي إن ترك فارغاً)"
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div className="admin-form-grid-2">
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    القسم (Category) *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="admin-form-input"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    المجموعة (Collection)
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select
                      value={["core", "portugal", "argentina"].includes(formData.collection?.toLowerCase() || "") ? formData.collection.toLowerCase() : "custom"}
                      onChange={(e) => {
                        if (e.target.value !== "custom") {
                          setFormData({ ...formData, collection: e.target.value });
                        }
                      }}
                      className="admin-form-input"
                      style={{ flex: "1" }}
                    >
                      <option value="core">Core Collection</option>
                      <option value="portugal">Portugal (CR7 / Lusitânia)</option>
                      <option value="argentina">Argentina (Albiceleste)</option>
                      <option value="custom">مجموعة مخصصة (Custom)...</option>
                    </select>
                    {!["core", "portugal", "argentina"].includes(formData.collection?.toLowerCase() || "") && (
                      <input
                        type="text"
                        value={formData.collection}
                        onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                        placeholder="اسم الكولكشن..."
                        className="admin-form-input"
                        style={{ flex: "1" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Availability & Price */}
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">
                <span>💰</span>
                <span>التسعير وحالة التوفر</span>
              </h3>

              <div className="admin-form-grid-2">
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    حالة التوفر (Availability) *
                  </label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value as ProductAvailability })}
                    className="admin-form-input"
                  >
                    {AVAILABILITIES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label} — {a.labelAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">
                    السعر بالجنيه المصري (ج.م / EGP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="900"
                    className="admin-form-input"
                  />
                  {formData.availability === "coming-soon" && (
                    <span className="admin-form-hint gold">
                      🔒 وضع <strong>Coming Soon:</strong> يتم إخفاء السعر وقفل زر الإضافة للحقيبة تلقائياً حتى إطلاق الدروب.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Teaser Drop Mode */}
            {(formData.availability === "coming-soon" || formData.isBlurred) && (
              <div className="admin-teaser-settings-box">
                <div className="admin-teaser-header">
                  <div className="admin-teaser-title">
                    <span>🔒</span>
                    <strong>إعدادات دروب التشويق (Coming Soon Teaser Drop)</strong>
                  </div>
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isBlurred}
                      onChange={(e) => setFormData({ ...formData, isBlurred: e.target.checked })}
                    />
                    <span>تطبيق بلور تشويقي على الصورة (Blur Image)</span>
                  </label>
                </div>

                <p className="admin-teaser-desc">
                  يتم تعتيم صورة المنتج وإظهار شارة <strong>COMING SOON</strong> مع عرض ألوان التشويق الثلاثة لجذب جمهور إنستغرام وتيك توك قبل موعد الطرح.
                </p>

                <div>
                  <label className="admin-form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                    ألوان التشويق الثلاثة (3 Teaser Colors):
                  </label>
                  <div className="admin-teaser-colors-grid">
                    {[0, 1, 2].map((idx) => {
                      const currentColor =
                        formData.colors?.[idx] || (idx === 0 ? "#0a0a0a" : idx === 1 ? "#4a7c9d" : "#c9a96e");
                      return (
                        <div key={idx} className="admin-color-picker-item">
                          <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => {
                              const newColors = [...(formData.colors || ["#0a0a0a", "#4a7c9d", "#c9a96e"])];
                              newColors[idx] = e.target.value;
                              setFormData({ ...formData, colors: newColors });
                            }}
                            className="admin-native-color-picker"
                            title={`اختر اللون ${idx + 1}`}
                          />
                          <input
                            type="text"
                            value={currentColor}
                            onChange={(e) => {
                              const newColors = [...(formData.colors || ["#0a0a0a", "#4a7c9d", "#c9a96e"])];
                              newColors[idx] = e.target.value;
                              setFormData({ ...formData, colors: newColors });
                            }}
                            className="admin-color-hex-input"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Sizes */}
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">
                <span>📏</span>
                <span>المقاسات المتاحة (Sizes)</span>
              </h3>

              <div className="admin-sizes-pill-grid">
                {STANDARD_SIZES.map((sz) => {
                  const active = formData.sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleToggleSize(sz)}
                      className={`admin-size-toggle-btn ${active ? "active" : ""}`}
                    >
                      <span>{sz}</span>
                      {active && <span className="admin-size-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Images */}
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">
                <span>📸</span>
                <span>صور المنتج (Images)</span>
              </h3>

              <div className="admin-form-grid-2">
                <div>
                  <label className="admin-form-label">
                    رفع صورة من جهازك (موبايل / كاميرا):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="admin-file-input"
                  />
                  {uploading && (
                    <span className="admin-form-hint gold">جاري رفع الصورة إلى التخزين السحابي...</span>
                  )}
                </div>

                <div>
                  <label className="admin-form-label">
                    أو إضافة رابط صورة خارجي:
                  </label>
                  <div className="admin-image-url-row">
                    <input
                      type="text"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="/hero.jpg or https://..."
                      className="admin-form-input"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="btn btn-outline"
                      style={{ flexShrink: 0, padding: "0.55rem 0.85rem" }}
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Previews */}
              <div className="admin-image-previews-grid">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="admin-image-preview-card">
                    <Image
                      src={img.src}
                      alt={img.alt || "preview"}
                      fill
                      sizes="80px"
                      style={{ objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="admin-image-remove-btn"
                      title="حذف الصورة"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {formData.images.length === 0 && (
                  <p className="admin-form-hint" style={{ gridColumn: "1 / -1" }}>
                    لم تتم إضافة صور بعد. سيتم استخدام صورة الحملة التلقائية.
                  </p>
                )}
              </div>
            </div>

            {/* 6. Descriptions & Story */}
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">
                <span>📝</span>
                <span>الوصف وقصة المنتج</span>
              </h3>

              <div className="admin-form-group">
                <label className="admin-form-label">الوصف القصير (Short Description)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Heavyweight cotton tee with tonal embroidery..."
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">القصة والتفاصيل الموسعة (Story & Fabric)</label>
                <textarea
                  rows={3}
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  placeholder="Crafted from 500gsm loopback fleece. Dropped shoulders, relaxed unisex fit..."
                  className="admin-form-input"
                />
              </div>
            </div>

            {/* 7. Craft Specs, Fit & Care */}
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">
                <span>✂️</span>
                <span>المواصفات، المقاس، والغسيل (Craft, Fit & Care)</span>
              </h3>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  المواصفات الفاخرة (Craft Specs — سطر لكل ميزة)
                </label>
                <textarea
                  rows={3}
                  value={formData.craftSpecs}
                  onChange={(e) => setFormData({ ...formData, craftSpecs: e.target.value })}
                  placeholder="500gsm custom-milled loopback cotton fleece.&#10;Over 45,000 stitches of high-density 3D embroidery.&#10;Tonal custom drawstrings with engraved aglets."
                  className="admin-form-input monospace"
                />
                <span className="admin-form-hint">
                  اكتب كل ميزة في سطر منفصل لتظهر كنقاط في صفحة تفاصيل المنتج.
                </span>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">تفاصيل المقاس والقصّة (Fit & Silhouette)</label>
                <textarea
                  rows={2}
                  value={formData.fitSilhouette}
                  onChange={(e) => setFormData({ ...formData, fitSilhouette: e.target.value })}
                  placeholder="Cut with our signature dropped shoulder and relaxed boxy drape..."
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">تعليمات الغسيل والعناية (Garment Care)</label>
                <textarea
                  rows={2}
                  value={formData.garmentCare}
                  onChange={(e) => setFormData({ ...formData, garmentCare: e.target.value })}
                  placeholder="Machine wash cold inside-out with like colours. Air dry flat in shade..."
                  className="admin-form-input"
                />
              </div>
            </div>

            {/* 8. Featured Toggle */}
            <div className="admin-featured-toggle-box">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <div>
                  <strong>إبراز القطعة في الصفحة الرئيسية (Featured Piece)</strong>
                  <p>عرض القطعة في مقدمة المتجر وسيكشن الـ Featured</p>
                </div>
              </label>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="admin-product-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline admin-modal-btn"
              disabled={saving}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary admin-modal-btn submit"
              disabled={saving}
            >
              {saving ? "جاري الحفظ..." : isEditing ? "حفظ التعديلات ✓" : "نشر القطعة بالمتجر →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
