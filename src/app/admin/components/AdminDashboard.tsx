"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "../../../types/order";
import type { Product } from "../../../types/product";

interface Props {
  orders: Order[];
  products: Product[];
  onOpenCreateProduct: () => void;
  onNavigateToOrders: (filterStatus?: string) => void;
  onNavigateToProducts: () => void;
  onViewProof: (url: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export default function AdminDashboard({
  orders,
  products,
  onOpenCreateProduct,
  onNavigateToOrders,
  onNavigateToProducts,
  onViewProof,
}: Props) {
  // Financial & Order calculations
  const metrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "cancelled");
    const totalGrossRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const collectedDeposits = validOrders.reduce((sum, o) => {
      if (o.paymentMethod === "cod") {
        return sum + (o.status === "delivered" ? (o.total || 0) : 0);
      }
      if (o.paymentType === "deposit") {
        return sum + (o.depositAmount || 0);
      }
      return sum + (o.total || 0);
    }, 0);

    const pendingCollection = validOrders
      .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
      .reduce((sum, o) => {
        if (o.paymentMethod === "cod") {
          return sum + (o.total || 0);
        }
        return sum + (o.remainingAmount || 0);
      }, 0);

    const aov = validOrders.length > 0 ? Math.round(totalGrossRevenue / validOrders.length) : 0;

    // Status counts
    const statusCounts = {
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };

    // Inventory counts
    const stockCounts = {
      total: products.length,
      inStock: products.filter((p) => p.availability === "in-stock").length,
      lowStock: products.filter((p) => p.availability === "low-stock").length,
      outOfStock: products.filter((p) => p.availability === "out-of-stock").length,
      comingSoon: products.filter((p) => p.availability === "coming-soon").length,
    };

    return {
      totalOrders: orders.length,
      totalGrossRevenue,
      collectedDeposits,
      pendingCollection,
      aov,
      statusCounts,
      stockCounts,
    };
  }, [orders, products]);

  // Recent 5 orders
  const recentOrders = useMemo(() => {
    return [...orders].slice(0, 5);
  }, [orders]);

  return (
    <div className="admin-dashboard-wrapper">
      {/* 1. Top Highlights: Revenue & Money */}
      <section className="admin-dash-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">المؤشرات المالية والمبيعات</h2>
            <p className="admin-section-subtitle">إجمالي الإيرادات والعربونات المجمعة بالجنيه المصري</p>
          </div>
          <span className="admin-currency-tag">EGP • ج.م</span>
        </div>

        <div className="admin-kpi-grid">
          {/* Gross Revenue */}
          <div className="admin-kpi-card highlight-gold">
            <div className="admin-kpi-top">
              <span className="admin-kpi-icon">💰</span>
              <span className="admin-kpi-badge">إجمالي المبيعات</span>
            </div>
            <div className="admin-kpi-num">
              {metrics.totalGrossRevenue.toLocaleString("ar-EG")} <small>ج.م</small>
            </div>
            <div className="admin-kpi-foot">
              من إجمالي {metrics.totalOrders} طلبات مسجلة
            </div>
          </div>

          {/* Collected Deposits */}
          <div className="admin-kpi-card highlight-green">
            <div className="admin-kpi-top">
              <span className="admin-kpi-icon">⚡</span>
              <span className="admin-kpi-badge">العربونات المحصلة</span>
            </div>
            <div className="admin-kpi-num" style={{ color: "#10b981" }}>
              {metrics.collectedDeposits.toLocaleString("ar-EG")} <small>ج.م</small>
            </div>
            <div className="admin-kpi-foot">
              ديبوزيت (30%) + مدفوع بالكامل (100%)
            </div>
          </div>

          {/* Pending Delivery Balance */}
          <div className="admin-kpi-card highlight-amber">
            <div className="admin-kpi-top">
              <span className="admin-kpi-icon">💵</span>
              <span className="admin-kpi-badge">متبقي قيد التحصيل</span>
            </div>
            <div className="admin-kpi-num" style={{ color: "#f59e0b" }}>
              {metrics.pendingCollection.toLocaleString("ar-EG")} <small>ج.م</small>
            </div>
            <div className="admin-kpi-foot">
              مبالغ مستحقة للتحصيل عند التسليم كاش
            </div>
          </div>

          {/* AOV */}
          <div className="admin-kpi-card highlight-blue">
            <div className="admin-kpi-top">
              <span className="admin-kpi-icon">📈</span>
              <span className="admin-kpi-badge">متوسط الطلب (AOV)</span>
            </div>
            <div className="admin-kpi-num" style={{ color: "#6ab7ea" }}>
              {metrics.aov.toLocaleString("ar-EG")} <small>ج.م</small>
            </div>
            <div className="admin-kpi-foot">
              متوسط قيمة السلة الشرائية للعميل
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Mobile Actions */}
      <section className="admin-dash-section">
        <h2 className="admin-section-title">إجراءات سريعة من الهاتف</h2>
        <div className="admin-quick-actions-grid">
          <button
            type="button"
            onClick={onOpenCreateProduct}
            className="admin-quick-action-btn primary"
          >
            <span className="admin-quick-action-icon">✨</span>
            <div className="admin-quick-action-text">
              <strong>إضافة قطعة جديدة</strong>
              <small>رفع صور، مقاسات، تسعير، أو دروب تشويقي</small>
            </div>
            <span className="admin-quick-action-arrow">→</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToOrders("pending")}
            className="admin-quick-action-btn warning"
          >
            <span className="admin-quick-action-icon">⏳</span>
            <div className="admin-quick-action-text">
              <strong>طلبات قيد المراجعة ({metrics.statusCounts.pending})</strong>
              <small>متابعة العملاء عبر واتساب وتأكيد العربون</small>
            </div>
            <span className="admin-quick-action-arrow">→</span>
          </button>

          <Link
            href="/shop"
            target="_blank"
            className="admin-quick-action-btn secondary"
          >
            <span className="admin-quick-action-icon">👁️</span>
            <div className="admin-quick-action-text">
              <strong>معاينة المتجر لايف</strong>
              <small>تصفح تجربة العميل والواجهة الحية</small>
            </div>
            <span className="admin-quick-action-arrow">↗</span>
          </Link>
        </div>
      </section>

      {/* 3. Orders Pipeline */}
      <section className="admin-dash-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">مسار وحالات الطلبات</h2>
            <p className="admin-section-subtitle">انقر على أي مرحلة للانتقال وتصفية الطلبات فوراً</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToOrders("all")}
            className="btn btn-outline"
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
          >
            عرض كافة الطلبات ↗
          </button>
        </div>

        <div className="admin-status-pipeline-grid">
          <button
            type="button"
            onClick={() => onNavigateToOrders("pending")}
            className={`admin-pipeline-card ${metrics.statusCounts.pending > 0 ? "has-alert" : ""}`}
            style={{ borderColor: "rgba(245, 158, 11, 0.4)" }}
          >
            <span className="admin-pipeline-dot" style={{ background: "#f59e0b" }} />
            <div className="admin-pipeline-title">قيد المراجعة</div>
            <div className="admin-pipeline-count" style={{ color: "#f59e0b" }}>
              {metrics.statusCounts.pending}
            </div>
            <span className="admin-pipeline-label">تحتاج مراجعة</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToOrders("confirmed")}
            className="admin-pipeline-card"
            style={{ borderColor: "rgba(59, 130, 246, 0.35)" }}
          >
            <span className="admin-pipeline-dot" style={{ background: "#3b82f6" }} />
            <div className="admin-pipeline-title">تم التأكيد</div>
            <div className="admin-pipeline-count" style={{ color: "#3b82f6" }}>
              {metrics.statusCounts.confirmed}
            </div>
            <span className="admin-pipeline-label">جاهز للتجهيز</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToOrders("preparing")}
            className="admin-pipeline-card"
            style={{ borderColor: "rgba(139, 92, 246, 0.35)" }}
          >
            <span className="admin-pipeline-dot" style={{ background: "#8b5cf6" }} />
            <div className="admin-pipeline-title">جاري التجهيز</div>
            <div className="admin-pipeline-count" style={{ color: "#8b5cf6" }}>
              {metrics.statusCounts.preparing}
            </div>
            <span className="admin-pipeline-label">في المخزن</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToOrders("shipped")}
            className="admin-pipeline-card"
            style={{ borderColor: "rgba(6, 182, 212, 0.35)" }}
          >
            <span className="admin-pipeline-dot" style={{ background: "#06b6d4" }} />
            <div className="admin-pipeline-title">تم الشحن</div>
            <div className="admin-pipeline-count" style={{ color: "#06b6d4" }}>
              {metrics.statusCounts.shipped}
            </div>
            <span className="admin-pipeline-label">مع المندوب</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToOrders("delivered")}
            className="admin-pipeline-card"
            style={{ borderColor: "rgba(16, 185, 129, 0.35)" }}
          >
            <span className="admin-pipeline-dot" style={{ background: "#10b981" }} />
            <div className="admin-pipeline-title">تم التسليم</div>
            <div className="admin-pipeline-count" style={{ color: "#10b981" }}>
              {metrics.statusCounts.delivered}
            </div>
            <span className="admin-pipeline-label">مكتمل بنجاح</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToOrders("cancelled")}
            className="admin-pipeline-card"
            style={{ borderColor: "rgba(239, 68, 68, 0.25)" }}
          >
            <span className="admin-pipeline-dot" style={{ background: "#ef4444" }} />
            <div className="admin-pipeline-title">ملغي</div>
            <div className="admin-pipeline-count" style={{ color: "#ef4444" }}>
              {metrics.statusCounts.cancelled}
            </div>
            <span className="admin-pipeline-label">غير مكتمل</span>
          </button>
        </div>
      </section>

      {/* 4. Inventory Health Summary */}
      <section className="admin-dash-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">حالة مخزون المنتجات</h2>
            <p className="admin-section-subtitle">نظرة عامة على القطع المعروضة والمتوفرة في المتجر</p>
          </div>
          <button
            type="button"
            onClick={onNavigateToProducts}
            className="btn btn-outline"
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
          >
            إدارة المخزون ↗
          </button>
        </div>

        <div className="admin-inventory-grid">
          <div className="admin-inv-stat">
            <span className="admin-inv-label">إجمالي القطع</span>
            <span className="admin-inv-value">{metrics.stockCounts.total}</span>
          </div>
          <div className="admin-inv-stat in-stock">
            <span className="admin-inv-label">متوفر (In Stock)</span>
            <span className="admin-inv-value">{metrics.stockCounts.inStock}</span>
          </div>
          <div className="admin-inv-stat low-stock">
            <span className="admin-inv-label">كمية محدودة (Low Stock)</span>
            <span className="admin-inv-value">{metrics.stockCounts.lowStock}</span>
          </div>
          <div className="admin-inv-stat out-of-stock">
            <span className="admin-inv-label">نفد (Sold Out)</span>
            <span className="admin-inv-value">{metrics.stockCounts.outOfStock}</span>
          </div>
          <div className="admin-inv-stat coming-soon">
            <span className="admin-inv-label">قريباً (Coming Soon Drop)</span>
            <span className="admin-inv-value">{metrics.stockCounts.comingSoon}</span>
          </div>
        </div>
      </section>

      {/* 5. Recent Orders Feed */}
      <section className="admin-dash-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">أحدث الطلبات الواردة</h2>
            <p className="admin-section-subtitle">آخر 5 طلبات تم تسجيلها من العملاء</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToOrders("all")}
            className="btn btn-outline"
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
          >
            عرض الكل ({orders.length})
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="admin-empty-state">
            <p>لا توجد طلبات مسجلة حتى الآن.</p>
          </div>
        ) : (
          <div className="admin-recent-orders-list">
            {recentOrders.map((o) => {
              const cleanPhone = (o.whatsapp || o.phone || "").replace(/\D/g, "");
              const waNumber = cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone;
              const waMessage = encodeURIComponent(
                `مرحباً ${o.customerName}، معك خدمة عملاء Triple Z بخصوص طلبك رقم #${o.id}. هل تود تأكيد تفاصيل الشحن؟`
              );

              return (
                <div key={o.id} className="admin-recent-order-item">
                  <div className="admin-recent-order-main">
                    <div className="admin-recent-order-top">
                      <strong className="admin-order-id-badge">#{o.id}</strong>
                      <span className={`admin-status-pill status-${o.status}`}>
                        {o.status === "pending"
                          ? "قيد المراجعة"
                          : o.status === "confirmed"
                          ? "تم التأكيد"
                          : o.status === "preparing"
                          ? "جاري التجهيز"
                          : o.status === "shipped"
                          ? "تم الشحن"
                          : o.status === "delivered"
                          ? "تم التسليم"
                          : "ملغي"}
                      </span>
                    </div>

                    <div className="admin-recent-order-customer">
                      <span className="admin-recent-name">{o.customerName}</span>
                      <span className="admin-recent-meta">
                        📍 {o.governorate} — {o.city}
                      </span>
                      <span className="admin-recent-items">
                        {o.items.map((it) => `${it.quantity}× ${it.productName}`).join(" • ")}
                      </span>
                    </div>
                  </div>

                  <div className="admin-recent-order-side">
                    <div className="admin-recent-price">
                      <strong>{o.total} ج.م</strong>
                      {o.paymentType === "deposit" && (
                        <small className="admin-deposit-tag">عربون: {o.depositAmount} ج.م</small>
                      )}
                    </div>

                    <div className="admin-recent-actions">
                      {o.paymentProofUrl && (
                        <button
                          type="button"
                          onClick={() => onViewProof(o.paymentProofUrl!)}
                          className="admin-mini-btn proof"
                          title="عرض إثبات التحويل"
                        >
                          👁️ إيصال
                        </button>
                      )}

                      {waNumber && (
                        <a
                          href={`https://wa.me/${waNumber}?text=${waMessage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-mini-btn whatsapp"
                          title="محادثة واتساب"
                        >
                          💬 واتساب
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
