"use client";

import { useState, useMemo } from "react";
import type { Order, OrderStatus } from "../../../types/order";

interface Props {
  orders: Order[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onViewProof: (url: string) => void;
  initialFilterStatus?: string;
}

const STATUS_OPTIONS: { value: OrderStatus; labelAr: string; color: string }[] = [
  { value: "pending", labelAr: "قيد المراجعة", color: "#f59e0b" },
  { value: "confirmed", labelAr: "تم التأكيد", color: "#3b82f6" },
  { value: "preparing", labelAr: "جاري التجهيز", color: "#8b5cf6" },
  { value: "shipped", labelAr: "تم الشحن", color: "#06b6d4" },
  { value: "delivered", labelAr: "تم التسليم", color: "#10b981" },
  { value: "cancelled", labelAr: "ملغي", color: "#ef4444" },
];

export default function AdminOrders({
  orders,
  loading,
  onRefresh,
  onUpdateStatus,
  onViewProof,
  initialFilterStatus = "all",
}: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(initialFilterStatus);
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        (o.whatsapp && o.whatsapp.toLowerCase().includes(q)) ||
        o.governorate.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q);

      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const matchPayment = filterPayment === "all" || o.paymentMethod === filterPayment;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, search, filterStatus, filterPayment]);

  const handleCopyAddress = (order: Order) => {
    let amountText = "";
    if (order.paymentMethod === "cod") {
      amountText = `${order.total} ج.م (تحصيل كاش كامل عند الاستلام)`;
    } else if (order.paymentType === "deposit") {
      amountText = `${order.remainingAmount} ج.م (متبقي بعد دفع العربون)`;
    } else {
      amountText = "0 ج.م (مدفوع بالكامل أونلاين - لا يُحصل أي مبلغ)";
    }

    const text = `العميل: ${order.customerName}\nالهاتف: ${order.phone}\nالمحافظة: ${order.governorate} - ${order.city}\nالعنوان: ${order.address}\nملاحظات: ${order.notes || "لا يوجد"}\nالمطلوب تحصيله: ${amountText}`;
    navigator.clipboard.writeText(text);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="admin-orders-container">
      {/* Top Header & Search Bar */}
      <div className="admin-orders-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <span className="admin-search-icon">🔍</span>
            <input
              type="search"
              placeholder="البحث بالاسم، الهاتف، المحافظة، أو رقم الطلب..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-field"
            />
          </div>

          <div className="admin-filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-select-filter"
            >
              <option value="all">جميع الحالات ({orders.length})</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.labelAr} ({orders.filter((o) => o.status === st.value).length})
                </option>
              ))}
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="admin-select-filter"
            >
              <option value="all">جميع طرق الدفع</option>
              <option value="instapay">انستاباي (InstaPay)</option>
              <option value="vodafone_cash">فودافون كاش</option>
              <option value="cod">الدفع عند الاستلام</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
        </div>

        <div className="admin-toolbar-right">
          <span className="admin-count-label">
            عرض {filteredOrders.length} من {orders.length} طلب
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="btn btn-outline admin-refresh-btn"
            disabled={loading}
          >
            {loading ? "جاري التحديث..." : "تحديث ⟳"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-state">
          <div className="admin-spinner" />
          <p>جاري تحميل الطلبات...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-empty-state">
          <p>لا توجد طلبات مطابقة لخيارات البحث أو الفلتر.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilterStatus("all");
              setFilterPayment("all");
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
              1. MOBILE CARDS VIEW (Clean, Ergonomic, Touch-First)
             ======================================================== */}
          <div className="admin-orders-mobile-cards">
            {filteredOrders.map((order) => {
              const cleanPhone = (order.whatsapp || order.phone || "").replace(/\D/g, "");
              const waNumber = cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone;
              const waMessage = encodeURIComponent(
                `مرحباً ${order.customerName}، معك خدمة عملاء Triple Z بخصوص طلبك رقم #${order.id}. إجمالي الطلب: ${order.total} ج.م. هل تود تأكيد الشحن؟`
              );

              return (
                <article key={order.id} className="admin-order-card">
                  {/* Card Header: Order ID + Date + Status Badge */}
                  <div className="admin-order-card-header">
                    <div>
                      <div className="admin-order-id-wrap">
                        <span className="admin-order-hash">#</span>
                        <strong className="admin-order-id">{order.id}</strong>
                      </div>
                      <span className="admin-order-date">
                        {new Date(order.createdAt).toLocaleString("ar-EG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <div className="admin-order-status-badge-wrap">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className={`admin-order-status-select status-${order.status}`}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.labelAr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Customer Info & Direct Communication */}
                  <div className="admin-order-section customer-box">
                    <div className="admin-order-section-title">بيانات العميل</div>
                    <div className="admin-customer-name-row">
                      <strong className="admin-customer-name">{order.customerName}</strong>
                      <span className="admin-customer-email">{order.email}</span>
                    </div>

                    <div className="admin-customer-comm-btns">
                      {order.phone && (
                        <a
                          href={`tel:${order.phone}`}
                          className="admin-comm-btn call"
                        >
                          <span>📞</span>
                          <span>اتصال ({order.phone})</span>
                        </a>
                      )}

                      {waNumber && (
                        <a
                          href={`https://wa.me/${waNumber}?text=${waMessage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-comm-btn whatsapp"
                        >
                          <span>💬</span>
                          <span>واتساب</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="admin-order-section address-box">
                    <div className="admin-address-header">
                      <span className="admin-order-section-title">عنوان الشحن (مصر)</span>
                      <button
                        type="button"
                        onClick={() => handleCopyAddress(order)}
                        className="admin-copy-address-btn"
                        title="نسخ العنوان لشركة الشحن"
                      >
                        {copiedId === order.id ? "تم النسخ ✓" : "📋 نسخ العنوان"}
                      </button>
                    </div>
                    <div className="admin-address-details">
                      <strong>{order.governorate} — {order.city}</strong>
                      <p>{order.address}</p>
                      {order.notes && (
                        <div className="admin-order-note">
                          <span>ملاحظة:</span> {order.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ordered Items */}
                  <div className="admin-order-section items-box">
                    <span className="admin-order-section-title">
                      القطع المطلوبة ({order.items.reduce((s, it) => s + it.quantity, 0)})
                    </span>
                    <div className="admin-order-items-list">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="admin-order-item-row">
                          <div className="admin-item-info">
                            <span className="admin-item-qty">{it.quantity}×</span>
                            <span className="admin-item-name">{it.productName}</span>
                            {it.selectedSize && (
                              <span className="admin-item-size-pill">
                                {it.selectedSize}
                              </span>
                            )}
                          </div>
                          <span className="admin-item-price">
                            {(it.price * it.quantity).toLocaleString("ar-EG")} ج.م
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Deposit Summary */}
                  <div className="admin-order-section payment-box">
                    <div className="admin-payment-row">
                      <div className="admin-payment-method">
                        <span className="admin-payment-icon">
                          {order.paymentMethod === "instapay"
                            ? "⚡"
                            : order.paymentMethod === "vodafone_cash"
                            ? "📱"
                            : order.paymentMethod === "paypal"
                            ? "🌐"
                            : "💵"}
                        </span>
                        <span>
                          {order.paymentMethod === "instapay"
                            ? "انستاباي (InstaPay)"
                            : order.paymentMethod === "vodafone_cash"
                            ? "فودافون كاش"
                            : order.paymentMethod === "paypal"
                            ? "PayPal"
                            : "الدفع عند الاستلام (كاش)"}
                        </span>
                      </div>

                      {order.paymentType === "deposit" ? (
                        <span className="admin-payment-type-badge deposit">عربون 30%</span>
                      ) : (
                        <span className="admin-payment-type-badge full">100% مدفوع</span>
                      )}
                    </div>

                    {order.paymentType === "deposit" && (
                      <div className="admin-deposit-details-grid">
                        <div className="admin-deposit-col">
                          <span>العربون (30%):</span>
                          <strong style={{ color: "var(--clr-accent)" }}>
                            {order.depositAmount} ج.م
                          </strong>
                        </div>
                        <div className="admin-deposit-col">
                          <span>متبقي عند الاستلام:</span>
                          <strong style={{ color: "#f59e0b" }}>
                            {order.remainingAmount} ج.م
                          </strong>
                        </div>
                      </div>
                    )}

                    {order.paymentReference && (
                      <div className="admin-payment-ref">
                        <span>الرقم المرجعي:</span> <strong>{order.paymentReference}</strong>
                      </div>
                    )}

                    {order.paymentProofUrl && (
                      <button
                        type="button"
                        onClick={() => onViewProof(order.paymentProofUrl!)}
                        className="admin-view-proof-btn"
                      >
                        <span>👁️</span>
                        <span>عرض صورة إثبات التحويل</span>
                      </button>
                    )}
                  </div>

                  {/* Total Bar */}
                  <div className="admin-order-card-footer">
                    <div className="admin-order-shipping-note">
                      شحن: {order.shippingFee} ج.م
                    </div>
                    <div className="admin-order-total-val">
                      <span>الإجمالي:</span>
                      <strong>{order.total} ج.م</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ========================================================
              2. DESKTOP TABLE VIEW (Wide screens)
             ======================================================== */}
          <div className="admin-orders-desktop-table">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>رقم الطلب والتاريخ</th>
                    <th>بيانات العميل والتواصل</th>
                    <th>العنوان (مصر)</th>
                    <th>القطع والمقاسات</th>
                    <th>طريقة الدفع والعربون</th>
                    <th>الإجمالي</th>
                    <th>تحديث الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => {
                    const cleanPhone = (o.whatsapp || o.phone || "").replace(/\D/g, "");
                    const waNumber = cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone;
                    const waMessage = encodeURIComponent(
                      `مرحباً ${o.customerName}، معك خدمة عملاء Triple Z بخصوص طلبك رقم #${o.id}.`
                    );

                    return (
                      <tr key={o.id}>
                        <td>
                          <strong style={{ color: "var(--clr-accent)", display: "block" }}>
                            #{o.id}
                          </strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>
                            {new Date(o.createdAt).toLocaleString("ar-EG", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </td>

                        <td>
                          <strong style={{ color: "#fff", display: "block" }}>{o.customerName}</strong>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.25rem" }}>
                            <a href={`tel:${o.phone}`} style={{ color: "var(--clr-text-secondary)", fontSize: "0.8rem", textDecoration: "none" }}>
                              📞 {o.phone}
                            </a>
                            {waNumber && (
                              <a
                                href={`https://wa.me/${waNumber}?text=${waMessage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#10b981", fontSize: "0.8rem", textDecoration: "none" }}
                              >
                                💬 واتساب
                              </a>
                            )}
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", display: "block" }}>
                            {o.email}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "0.85rem", color: "var(--clr-text-primary)" }}>
                              {o.governorate} — {o.city}
                            </strong>
                            <button
                              type="button"
                              onClick={() => handleCopyAddress(o)}
                              className="admin-mini-btn"
                              style={{ padding: "1px 6px", fontSize: "0.7rem" }}
                            >
                              {copiedId === o.id ? "✓" : "نسخ"}
                            </button>
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", margin: "0.2rem 0 0", maxWidth: "200px" }}>
                            {o.address}
                          </p>
                          {o.notes && (
                            <span style={{ fontSize: "0.72rem", color: "#f59e0b", display: "block" }}>
                              📝 {o.notes}
                            </span>
                          )}
                        </td>

                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", maxWidth: "200px" }}>
                            {o.items.map((it, idx) => (
                              <div key={idx} style={{ fontSize: "0.8rem" }}>
                                <span>{it.quantity}× {it.productName}</span>
                                {it.selectedSize && (
                                  <span style={{ color: "var(--clr-accent)", marginRight: "4px" }}>
                                    ({it.selectedSize})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, display: "block" }}>
                            {o.paymentMethod === "instapay"
                              ? "⚡ انستاباي"
                              : o.paymentMethod === "vodafone_cash"
                              ? "📱 فودافون كاش"
                              : o.paymentMethod === "paypal"
                              ? "🌐 PayPal"
                              : "💵 كاش عند الاستلام"}
                          </span>

                          {o.paymentMethod === "cod" ? (
                            <span style={{ fontSize: "0.74rem", color: "#f59e0b", display: "block", marginTop: "0.2rem" }}>
                              تحصيل كامل ({o.total} ج.م)
                            </span>
                          ) : o.paymentType === "deposit" ? (
                            <div style={{ fontSize: "0.76rem", color: "var(--clr-accent)", marginTop: "0.2rem" }}>
                              عربون: <strong>{o.depositAmount} ج.م</strong>
                              <div style={{ color: "#f59e0b" }}>متبقي: {o.remainingAmount} ج.م</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.74rem", color: "#10b981", display: "block", marginTop: "0.2rem" }}>
                              مدفوع بالكامل أونلاين (100%)
                            </span>
                          )}

                          {o.paymentProofUrl && (
                            <button
                              type="button"
                              onClick={() => onViewProof(o.paymentProofUrl!)}
                              className="admin-mini-btn proof"
                              style={{ marginTop: "0.35rem" }}
                            >
                              👁️ إثبات التحويل
                            </button>
                          )}
                        </td>

                        <td>
                          <strong style={{ color: "var(--clr-accent)", fontSize: "1rem", display: "block" }}>
                            {o.total} ج.م
                          </strong>
                          <span style={{ fontSize: "0.72rem", color: "var(--clr-text-muted)" }}>
                            (شحن: {o.shippingFee} ج.م)
                          </span>
                        </td>

                        <td>
                          <select
                            value={o.status}
                            onChange={(e) => onUpdateStatus(o.id, e.target.value as OrderStatus)}
                            className={`admin-status-select status-${o.status}`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st.value} value={st.value}>
                                {st.labelAr}
                              </option>
                            ))}
                          </select>
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
