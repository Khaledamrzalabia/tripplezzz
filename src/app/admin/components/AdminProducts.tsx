"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, ProductCategory, ProductAvailability } from "../../../types/product";

interface Props {
  products: Product[];
  loading: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (product: Product) => void;
  onDelete: (productId: string, productName: string) => void;
  onQuickFeaturedToggle: (productId: string, currentFeatured: boolean) => void;
  onQuickStatusChange: (productId: string, newStatus: ProductAvailability) => void;
}

const CATEGORIES: ProductCategory[] = ["tops", "bottoms", "outerwear", "accessories", "footwear"];

const AVAILABILITIES: { value: ProductAvailability; label: string; labelAr: string; color: string }[] = [
  { value: "in-stock", label: "In Stock", labelAr: "متوفر", color: "#10b981" },
  { value: "low-stock", label: "Low Stock", labelAr: "كمية محدودة", color: "#f59e0b" },
  { value: "out-of-stock", label: "Sold Out", labelAr: "نفد / خلص", color: "#ef4444" },
  { value: "coming-soon", label: "Coming Soon", labelAr: "دروب قريباً", color: "#c9a96e" },
];

export default function AdminProducts({
  products,
  loading,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onQuickFeaturedToggle,
  onQuickStatusChange,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.collection && p.collection.toLowerCase().includes(q));

      const matchCategory = filterCategory === "all" || p.category === filterCategory;
      const matchStatus = filterStatus === "all" || p.availability === filterStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, filterCategory, filterStatus]);

  return (
    <div className="admin-products-container">
      {/* Toolbar: Search, Filters, Add Product */}
      <div className="admin-orders-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <span className="admin-search-icon">🔍</span>
            <input
              type="search"
              placeholder="البحث بالاسم، القسم، أو الرابط..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-field"
            />
          </div>

          <div className="admin-filter-group">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="admin-select-filter"
            >
              <option value="all">جميع الأقسام</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-select-filter"
            >
              <option value="all">جميع الحالات</option>
              {AVAILABILITIES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label} ({a.labelAr})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-toolbar-right">
          <span className="admin-count-label">
            عرض {filteredProducts.length} من {products.length} قطعة
          </span>
          <button
            type="button"
            onClick={onOpenCreate}
            className="btn btn-primary"
            style={{ padding: "0.55rem 1.15rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <span>+</span>
            <span>إضافة قطعة جديدة</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <div className="admin-spinner" />
          <p>جاري تحميل المنتجات...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="admin-empty-state">
          <p>لا توجد منتجات مطابقة لخيارات البحث.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilterCategory("all");
              setFilterStatus("all");
            }}
            className="btn btn-outline"
            style={{ marginTop: "1rem" }}
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <>
          {/* ========================================================
              1. MOBILE CARDS VIEW (Ergonomic for phones)
             ======================================================== */}
          <div className="admin-products-mobile-grid">
            {filteredProducts.map((p) => {
              const primaryImg = p.images?.[0]?.src || "/hero.jpg";
              const isComingSoon = p.availability === "coming-soon";

              return (
                <article key={p.id} className="admin-product-card-mobile">
                  <div className="admin-prod-card-top">
                    {/* Thumbnail */}
                    <div className="admin-prod-card-thumb">
                      <Image
                        src={primaryImg}
                        alt={p.name}
                        fill
                        sizes="90px"
                        style={{ objectFit: "cover" }}
                      />
                      {p.isBlurred && (
                        <span className="admin-prod-badge-teaser">BLUR</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="admin-prod-card-details">
                      <div className="admin-prod-card-title-row">
                        <strong className="admin-prod-card-name">{p.name}</strong>
                      </div>

                      <div className="admin-prod-card-meta">
                        <span className="admin-prod-cat">{p.category}</span>
                        <span className="admin-prod-dot">•</span>
                        <span className="admin-prod-col">{p.collection || "Core"}</span>
                      </div>

                      <div className="admin-prod-price-row">
                        {isComingSoon ? (
                          <span className="admin-prod-coming-soon-badge">
                            قريباً (بدون سعر)
                          </span>
                        ) : (
                          <span className="admin-prod-price-val">
                            ${p.price ?? 0}
                          </span>
                        )}
                      </div>

                      {/* Teaser / Variant Colors */}
                      {p.colors && p.colors.length > 0 && (
                        <div className="admin-prod-colors-row">
                          {p.colors.map((c, i) => (
                            <span
                              key={i}
                              style={{ backgroundColor: c }}
                              className="admin-prod-color-dot"
                              title={c}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sizes */}
                  {p.sizes && p.sizes.length > 0 && (
                    <div className="admin-prod-card-sizes">
                      {p.sizes.map((sz) => (
                        <span key={sz} className="admin-prod-size-chip">
                          {sz}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mobile Controls: Quick Status + Featured */}
                  <div className="admin-prod-quick-controls">
                    <select
                      value={p.availability}
                      onChange={(e) => onQuickStatusChange(p.id, e.target.value as ProductAvailability)}
                      className={`admin-prod-status-select status-${p.availability}`}
                    >
                      {AVAILABILITIES.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label} — {a.labelAr}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => onQuickFeaturedToggle(p.id, Boolean(p.featured))}
                      className={`admin-prod-featured-btn ${p.featured ? "featured" : ""}`}
                      title="تبديل الحالة المميزة"
                    >
                      <span>{p.featured ? "★" : "☆"}</span>
                      <span>{p.featured ? "مميز" : "عادي"}</span>
                    </button>
                  </div>

                  {/* Actions Bar */}
                  <div className="admin-prod-card-actions">
                    <Link
                      href={`/products/${p.slug}`}
                      target="_blank"
                      className="admin-prod-action-btn view"
                    >
                      <span>👁️</span>
                      <span>معاينة</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => onOpenEdit(p)}
                      className="admin-prod-action-btn edit"
                    >
                      <span>✏️</span>
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(p.id, p.name)}
                      className="admin-prod-action-btn delete"
                    >
                      <span>🗑️</span>
                      <span>حذف</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ========================================================
              2. DESKTOP TABLE VIEW (Wide screens)
             ======================================================== */}
          <div className="admin-products-desktop-table">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>القطعة (Piece)</th>
                    <th>القسم</th>
                    <th>المجموعة</th>
                    <th>السعر</th>
                    <th>مميز (Featured)</th>
                    <th>المقاسات</th>
                    <th>الحالة</th>
                    <th style={{ textAlign: "right" }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const primaryImg = p.images?.[0]?.src || "/hero.jpg";
                    const isComingSoon = p.availability === "coming-soon";

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                            <div className="admin-product-thumb">
                              <Image
                                src={primaryImg}
                                alt={p.name}
                                fill
                                sizes="52px"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                            <div>
                              <strong style={{ color: "var(--clr-white)", display: "block" }}>
                                {p.name}
                              </strong>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
                                <span style={{ fontSize: "0.72rem", color: "var(--clr-text-muted)" }}>
                                  ID: {p.id}
                                </span>
                                {p.colors && p.colors.length > 0 && (
                                  <div style={{ display: "inline-flex", gap: "3px" }}>
                                    {p.colors.map((c, i) => (
                                      <span
                                        key={i}
                                        style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c, border: "1px solid rgba(255,255,255,0.3)" }}
                                      />
                                    ))}
                                  </div>
                                )}
                                {p.isBlurred && (
                                  <span style={{ fontSize: "0.65rem", padding: "1px 4px", borderRadius: "3px", background: "rgba(106,183,234,0.15)", color: "#6ab7ea", fontWeight: 700 }}>
                                    BLURRED
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{ textTransform: "capitalize", color: "var(--clr-text-secondary)" }}>
                            {p.category}
                          </span>
                        </td>

                        <td>
                          <span style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--clr-text-muted)" }}>
                            {p.collection || "Core"}
                          </span>
                        </td>

                        <td>
                          {isComingSoon ? (
                            <span style={{ color: "var(--clr-accent)", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", background: "rgba(201,169,110,0.15)", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                              قريباً (بلا سعر)
                            </span>
                          ) : (
                            <strong style={{ color: "var(--clr-white)", fontSize: "0.95rem" }}>
                              ${p.price ?? 0}
                            </strong>
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() => onQuickFeaturedToggle(p.id, Boolean(p.featured))}
                            className={`admin-prod-featured-btn ${p.featured ? "featured" : ""}`}
                            style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem" }}
                          >
                            <span>{p.featured ? "★" : "☆"}</span>
                            <span>{p.featured ? "Featured" : "Regular"}</span>
                          </button>
                        </td>

                        <td>
                          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", maxWidth: "150px" }}>
                            {p.sizes && p.sizes.length > 0 ? (
                              p.sizes.map((s) => (
                                <span key={s} style={{ fontSize: "0.7rem", background: "var(--clr-surface-3)", padding: "0.15rem 0.4rem", borderRadius: "3px", color: "var(--clr-text-secondary)" }}>
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>—</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <select
                            value={p.availability}
                            onChange={(e) => onQuickStatusChange(p.id, e.target.value as ProductAvailability)}
                            className={`admin-status-select status-${p.availability}`}
                          >
                            {AVAILABILITIES.map((a) => (
                              <option key={a.value} value={a.value}>
                                {a.label} — {a.labelAr}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              className="admin-action-btn"
                              title="معاينة في المتجر"
                            >
                              👁️
                            </Link>
                            <button
                              type="button"
                              onClick={() => onOpenEdit(p)}
                              className="admin-action-btn"
                              title="تعديل القطعة"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(p.id, p.name)}
                              className="admin-action-btn danger"
                              title="حذف القطعة"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
