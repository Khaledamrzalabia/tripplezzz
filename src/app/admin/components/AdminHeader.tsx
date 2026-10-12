"use client";

import Link from "next/link";

export type AdminTab = "dashboard" | "orders" | "products" | "shipping" | "settings";

interface Props {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  ordersCount: number;
  pendingOrdersCount: number;
  productsCount: number;
  onLogout: () => void;
  onOpenCreate: () => void;
  onOpenChangePassword: () => void;
}

export default function AdminHeader({
  activeTab,
  setActiveTab,
  ordersCount,
  pendingOrdersCount,
  productsCount,
  onLogout,
  onOpenCreate,
  onOpenChangePassword,
}: Props) {
  return (
    <header className="admin-header-apple">
      {/* Top Bar: Brand, Status, Actions */}
      <div className="admin-header-top">
        <div className="admin-header-brand">
          <div className="admin-brand-pill">
            <span className="admin-live-dot" />
            <span className="admin-brand-tag">TRIPLE Z STUDIO</span>
          </div>
          <h1 className="admin-main-title">
            لوحة الإدارة والتحكم
          </h1>
          <p className="admin-main-subtitle">
            إدارة متجر Triple Z، مراقبة المبيعات وتحديث المخزون
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={onOpenCreate}
            className="btn btn-primary admin-add-product-btn"
          >
            <span>+</span>
            <span>إضافة قطعة جديدة</span>
          </button>

          <button
            type="button"
            onClick={onOpenChangePassword}
            className="btn btn-outline admin-header-btn"
            title="تغيير كلمة المرور"
          >
            <span>🔑</span>
            <span>تغيير الباسورد</span>
          </button>

          <Link
            href="/shop"
            target="_blank"
            className="btn btn-outline admin-header-btn"
            title="عرض المتجر الحي"
          >
            <span>المتجر</span>
            <span style={{ fontSize: "0.85rem" }}>↗</span>
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="btn btn-outline admin-logout-btn"
            title="تسجيل الخروج من لوحة التحكم"
          >
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Segmented Navigation (Apple Pills) */}
      <nav className="admin-segmented-nav" aria-label="أقسام لوحة الإدارة">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`admin-segment-btn ${activeTab === "dashboard" ? "active" : ""}`}
        >
          <span className="admin-segment-icon">📊</span>
          <span>الداشبورد</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`admin-segment-btn ${activeTab === "orders" ? "active" : ""}`}
        >
          <span className="admin-segment-icon">📦</span>
          <span>الطلبات</span>
          <span className="admin-segment-badge">
            {ordersCount}
          </span>
          {pendingOrdersCount > 0 && (
            <span className="admin-segment-pending-dot" title={`${pendingOrdersCount} طلبات قيد المراجعة`}>
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`admin-segment-btn ${activeTab === "products" ? "active" : ""}`}
        >
          <span className="admin-segment-icon">👕</span>
          <span>المنتجات</span>
          <span className="admin-segment-badge">
            {productsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shipping")}
          className={`admin-segment-btn ${activeTab === "shipping" ? "active" : ""}`}
        >
          <span className="admin-segment-icon">🚚</span>
          <span>أسعار الشحن</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`admin-segment-btn ${activeTab === "settings" ? "active" : ""}`}
        >
          <span className="admin-segment-icon">⚙️</span>
          <span>الدفع والسوشيال</span>
        </button>
      </nav>
    </header>
  );
}
