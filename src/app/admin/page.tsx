"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, ProductCategory, ProductAvailability } from "../../types/product";
import type { Order, OrderStatus } from "../../types/order";

const CATEGORIES: ProductCategory[] = ["tops", "bottoms", "outerwear", "accessories", "footwear"];
const AVAILABILITIES: { value: ProductAvailability; label: string; labelAr: string; color: string }[] = [
  { value: "in-stock", label: "In Stock", labelAr: "متوفر", color: "#10b981" },
  { value: "low-stock", label: "Low Stock", labelAr: "كمية محدودة", color: "#f59e0b" },
  { value: "out-of-stock", label: "Sold Out", labelAr: "نفد / خلص", color: "#ef4444" },
  { value: "coming-soon", label: "Coming Soon", labelAr: "قريباً (بدون سعر)", color: "#c9a96e" },
];

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  category: ProductCategory;
  collection: string;
  price: string;
  availability: ProductAvailability;
  description: string;
  longDescription: string;
  sizes: string[];
  colors: string[];
  isBlurred: boolean;
  images: { src: string; alt: string }[];
  featured: boolean;
}

const INITIAL_FORM: ProductFormData = {
  name: "",
  slug: "",
  category: "tops",
  collection: "core",
  price: "120",
  availability: "coming-soon",
  description: "",
  longDescription: "",
  sizes: ["S", "M", "L", "XL"],
  colors: ["#0a0a0a", "#4a7c9d", "#c9a96e"],
  isBlurred: true,
  images: [{ src: "/hero.jpg", alt: "Product Preview" }],
  featured: false,
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Admin Auth State
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Active View Tab: 'products' | 'orders'
  const [activeTab, setActiveTab] = useState<"products" | "orders">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Verify Auth on mount
  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setIsAuthenticated(true);
          fetchProducts();
          fetchOrders();
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setLoading(false);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setLoginError("يرجى إدخال اسم المستخدم وكلمة المرور.");
      return;
    }
    setLoginSubmitting(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        fetchProducts();
        fetchOrders();
      } else {
        setLoginError(data.error || "اسم المستخدم أو كلمة المرور غير صحيحة.");
      }
    } catch (err) {
      setLoginError("فشل الاتصال بالخادم، يرجى إعادة المحاولة.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      setAdminUsername("");
      setAdminPassword("");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: products.length,
      inStock: products.filter((p) => p.availability === "in-stock").length,
      lowStock: products.filter((p) => p.availability === "low-stock").length,
      outOfStock: products.filter((p) => p.availability === "out-of-stock").length,
      comingSoon: products.filter((p) => p.availability === "coming-soon").length,
    };
  }, [products]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === "all" || p.category === filterCategory;
      const matchStatus = filterStatus === "all" || p.availability === filterStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, filterCategory, filterStatus]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setCustomImageUrl("");
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (product: Product) => {
    setFormData({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      collection: product.collection || "core",
      price: product.price !== undefined ? String(product.price) : "",
      availability: product.availability,
      description: product.description,
      longDescription: product.longDescription || "",
      sizes: product.sizes || [],
      colors: product.colors && product.colors.length > 0 ? product.colors : ["#0a0a0a", "#4a7c9d", "#c9a96e"],
      isBlurred: Boolean(product.isBlurred || product.availability === "coming-soon"),
      images: product.images && product.images.length > 0 ? product.images : [{ src: "/hero.jpg", alt: product.name }],
      featured: Boolean(product.featured),
    });
    setIsEditing(true);
    setCustomImageUrl("");
    setModalOpen(true);
  };

  // Quick Status Change from table
  const handleQuickStatusChange = async (productId: string, newStatus: ProductAvailability) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: newStatus }),
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Delete
  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Image Upload handler
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
        alert("Upload failed. Please try a different image.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  // Add custom URL image
  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, { src: customImageUrl.trim(), alt: prev.name || "Product Image" }],
    }));
    setCustomImageUrl("");
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Toggle size
  const handleToggleSize = (size: string) => {
    setFormData((prev) => {
      const exists = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: exists ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
      };
    });
  };

  // Save product (POST or PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a product name.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        price: formData.availability === "coming-soon" ? undefined : Number(formData.price) || 0,
      };

      const url = isEditing && formData.id ? `/api/products/${formData.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchProducts();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save product.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving product.");
    } finally {
      setSaving(false);
    }
  };

  // 1. Loading Auth Check
  if (authChecking) {
    return (
      <div className="admin-page" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--clr-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem" }}>Checking studio authorization...</p>
      </div>
    );
  }

  // 2. Unauthenticated Gatekeeper Screen
  if (!isAuthenticated) {
    return (
      <div className="admin-page" style={{ minHeight: "88vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2.5rem 1rem" }}>
        <div style={{ maxWidth: 460, width: "100%", background: "#111419", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: 14, padding: "2.75rem 2.25rem", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85)" }}>
          {/* Logo & Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <Image
              src="/brand-logo.webp"
              alt="Triple Z"
              width={150}
              height={50}
              style={{ height: 40, width: "auto", objectFit: "contain", margin: "0 auto 1.25rem" }}
            />
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.85rem", borderRadius: 100, background: "rgba(201, 169, 110, 0.1)", border: "1px solid rgba(201, 169, 110, 0.3)", marginBottom: "0.85rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-accent)" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", color: "var(--clr-accent)", textTransform: "uppercase" }}>STUDIO SECURITY GATE</span>
            </div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#fafafa" }}>لوحة تحكم الأدمن (Admin Studio)</h1>
            <p style={{ fontSize: "0.85rem", color: "var(--clr-text-secondary)", margin: 0, lineHeight: 1.5 }}>
              منطقة إدارة المنتجات والمخزون — يرجى إدخال كلمة المرور للمتابعة
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label htmlFor="admin-user-input" style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--clr-text-muted)", marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Username / اسم المستخدم:
              </label>
              <input
                id="admin-user-input"
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم..."
                autoFocus
                required
                autoComplete="username"
                style={{ width: "100%", height: 46, background: "#0a0c10", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: 6, color: "#fff", padding: "0 1rem", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label htmlFor="admin-pass-input" style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--clr-text-muted)", marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Password / كلمة المرور:
              </label>
              <input
                id="admin-pass-input"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="أدخل كلمة المرور..."
                required
                autoComplete="current-password"
                style={{ width: "100%", height: 46, background: "#0a0c10", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: 6, color: "#fff", padding: "0 1rem", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {loginError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 6, padding: "0.75rem 1rem", color: "#ef4444", fontSize: "0.82rem" }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginSubmitting}
              className="btn btn-primary"
              style={{ height: 48, fontSize: "0.92rem", fontWeight: 800, letterSpacing: "0.06em", borderRadius: 6, width: "100%", marginTop: "0.5rem" }}
            >
              {loginSubmitting ? "جاري التحقق..." : "دخول الاستوديو (ENTER STUDIO) →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="site-container">
        {/* Header Bar */}
        <div className="admin-header-bar">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--clr-accent)", fontWeight: 700 }}>
                Triple Z Studio
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>•</span>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", textTransform: "uppercase" }}>لوحة تحكم المنتجات</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
              Product Inventory & Studio
            </h1>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/shop" className="btn btn-outline" style={{ padding: "0.6rem 1.15rem", fontSize: "0.85rem" }}>
              Storefront ↗
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ padding: "0.6rem 1rem", fontSize: "0.82rem", borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}
              title="خروج من لوحة الأدمن"
            >
              خروج (Sign Out)
            </button>
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary"
              style={{ padding: "0.65rem 1.35rem", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>+</span>
              <span>إضافة منتج جديد (Add Product)</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Orders vs Products */}
        <div style={{ display: "flex", gap: "1rem", marginBlock: "2rem 1.5rem", borderBottom: "1px solid var(--clr-border)", paddingBottom: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            style={{
              padding: "0.75rem 1.75rem",
              borderRadius: "var(--radius-pill)",
              border: "none",
              background: activeTab === "orders" ? "var(--clr-accent)" : "rgba(255, 255, 255, 0.05)",
              color: activeTab === "orders" ? "#000" : "#fff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>📦 طلبات العملاء (Orders)</span>
            <span style={{ background: activeTab === "orders" ? "#000" : "rgba(255,255,255,0.2)", color: activeTab === "orders" ? "#fff" : "#fff", padding: "2px 8px", borderRadius: "100px", fontSize: "0.75rem" }}>
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("products")}
            style={{
              padding: "0.75rem 1.75rem",
              borderRadius: "var(--radius-pill)",
              border: "none",
              background: activeTab === "products" ? "var(--clr-accent)" : "rgba(255, 255, 255, 0.05)",
              color: activeTab === "products" ? "#000" : "#fff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>👕 مخزون المنتجات (Products)</span>
            <span style={{ background: activeTab === "products" ? "#000" : "rgba(255,255,255,0.2)", color: activeTab === "products" ? "#fff" : "#fff", padding: "2px 8px", borderRadius: "100px", fontSize: "0.75rem" }}>
              {products.length}
            </span>
          </button>
        </div>

        {activeTab === "products" ? (
          <>
            {/* Stats Row */}
            <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <p className="admin-stat-label">Total Products (الإجمالي)</p>
            <p className="admin-stat-value">{stats.total}</p>
          </div>
          <div className="admin-stat-card" style={{ borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <p className="admin-stat-label" style={{ color: "#10b981" }}>In Stock (متوفر)</p>
            <p className="admin-stat-value" style={{ color: "#10b981" }}>{stats.inStock}</p>
          </div>
          <div className="admin-stat-card" style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}>
            <p className="admin-stat-label" style={{ color: "#f59e0b" }}>Low Stock (كمية محدودة)</p>
            <p className="admin-stat-value" style={{ color: "#f59e0b" }}>{stats.lowStock}</p>
          </div>
          <div className="admin-stat-card" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
            <p className="admin-stat-label" style={{ color: "#ef4444" }}>Sold Out (نفد)</p>
            <p className="admin-stat-value" style={{ color: "#ef4444" }}>{stats.outOfStock}</p>
          </div>
          <div className="admin-stat-card" style={{ borderColor: "rgba(201, 169, 110, 0.4)" }}>
            <p className="admin-stat-label" style={{ color: "var(--clr-accent)" }}>Coming Soon (قريباً — بلا سعر)</p>
            <p className="admin-stat-value" style={{ color: "var(--clr-accent)" }}>{stats.comingSoon}</p>
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="admin-toolbar">
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="search"
              placeholder="البحث بالاسم أو القسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="admin-status-select"
              style={{ padding: "0.65rem 1rem", fontSize: "0.85rem" }}
            >
              <option value="all">All Categories (جميع الأقسام)</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-status-select"
              style={{ padding: "0.65rem 1rem", fontSize: "0.85rem" }}
            >
              <option value="all">All Statuses (جميع الحالات)</option>
              {AVAILABILITIES.map((a) => (
                <option key={a.value} value={a.value}>{a.label} ({a.labelAr})</option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--clr-text-muted)" }}>
            Showing {filteredProducts.length} of {products.length} items
          </p>
        </div>

        {/* Products Table */}
        <div className="admin-table-wrapper">
          {loading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--clr-text-muted)" }}>
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center" }}>
              <p style={{ color: "var(--clr-text-muted)", marginBottom: "1rem" }}>لا توجد منتجات مطابقة لخيارات البحث.</p>
              <button onClick={() => { setSearch(""); setFilterCategory("all"); setFilterStatus("all"); }} className="btn btn-outline" style={{ fontSize: "0.8rem" }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Piece (المنتج)</th>
                  <th>Category</th>
                  <th>Collection</th>
                  <th>Price (السعر)</th>
                  <th>Sizes (المقاسات)</th>
                  <th>Status (الحالة)</th>
                  <th style={{ textAlign: "right" }}>Actions (إجراءات)</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isComingSoon = p.availability === "coming-soon";
                  const primaryImg = p.images?.[0]?.src || "/hero.jpg";

                  return (
                    <tr key={p.id}>
                      {/* Product Info & Thumb */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div className="admin-product-thumb">
                            <Image src={primaryImg} alt={p.name} fill sizes="52px" style={{ objectFit: "cover" }} />
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontWeight: 700, color: "var(--clr-white)" }}>{p.name}</span>
                              {p.featured && (
                                <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "3px", background: "rgba(201,169,110,0.2)", color: "var(--clr-accent)", textTransform: "uppercase", fontWeight: 700 }}>
                                  Featured
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>ID: {p.id}</span>
                              {p.colors && p.colors.length > 0 && (
                                <div style={{ display: "inline-flex", gap: "3px" }}>
                                  {p.colors.map((c, i) => (
                                    <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c, border: "1px solid rgba(255,255,255,0.3)", display: "inline-block" }} />
                                  ))}
                                </div>
                              )}
                              {p.isBlurred && (
                                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: "3px", background: "rgba(106,183,234,0.15)", color: "#6ab7ea", fontWeight: 700 }}>
                                  BLURRED TEASER
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span style={{ textTransform: "capitalize", color: "var(--clr-text-secondary)" }}>
                          {p.category}
                        </span>
                      </td>

                      {/* Collection */}
                      <td>
                        <span style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--clr-text-muted)" }}>
                          {p.collection || "Core"}
                        </span>
                      </td>

                      {/* Price */}
                      <td>
                        {isComingSoon ? (
                          <span style={{ color: "var(--clr-accent)", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(201,169,110,0.15)", padding: "0.3rem 0.6rem", borderRadius: "4px" }}>
                            قريباً (بدون سعر)
                          </span>
                        ) : (
                          <span style={{ fontWeight: 700, color: "var(--clr-white)", fontSize: "0.95rem" }}>
                            ${p.price ?? 0}
                          </span>
                        )}
                      </td>

                      {/* Sizes */}
                      <td>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", maxWidth: "160px" }}>
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

                      {/* Quick Status Dropdown */}
                      <td>
                        <select
                          value={p.availability}
                          onChange={(e) => handleQuickStatusChange(p.id, e.target.value as ProductAvailability)}
                          className="admin-status-select"
                          style={{
                            color:
                              p.availability === "in-stock"
                                ? "#10b981"
                                : p.availability === "low-stock"
                                ? "#f59e0b"
                                : p.availability === "out-of-stock"
                                ? "#ef4444"
                                : "var(--clr-accent)",
                          }}
                        >
                          {AVAILABILITIES.map((a) => (
                            <option key={a.value} value={a.value}>
                              {a.label} — {a.labelAr}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            className="admin-action-btn"
                            title="Preview on site"
                          >
                            👁️
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="admin-action-btn"
                            title="Edit Piece"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="admin-action-btn danger"
                            title="Delete"
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
          )}
        </div>
      </>
    ) : (
      /* Orders Management View */
      <div style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
              طلبات العملاء (Customer Orders)
            </h2>
            <p style={{ color: "var(--clr-text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              متابعة تفاصيل الشحن داخل مصر، إثباتات الدفع (ديبوزيت 30% / كاش)، وتحديث حالة الطلب.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="btn btn-outline"
            style={{ fontSize: "0.85rem", padding: "0.5rem 1.25rem" }}
          >
            تحديث الطلبات ⟳
          </button>
        </div>

        <div className="admin-table-wrapper">
          {ordersLoading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--clr-text-muted)" }}>
              جاري تحميل الطلبات...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--clr-text-muted)" }}>
              لا توجد طلبات مسجلة بعد. عند إتمام أول عميل لطلبه ستظهر كامل بياناته هنا فوراً.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>رقم الطلب والتاريخ</th>
                  <th>بيانات العميل</th>
                  <th>العنوان (مصر)</th>
                  <th>القطع والكمية</th>
                  <th>طريقة الدفع والعربون</th>
                  <th>إجمالي الفاتورة</th>
                  <th>حالة الطلب</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong style={{ color: "var(--clr-accent)", fontSize: "0.95rem", display: "block" }}>#{o.id}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>
                        {new Date(o.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#fff", display: "block" }}>{o.customerName}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}>
                        📞 {o.phone}
                      </div>
                      {o.whatsapp && (
                        <div style={{ fontSize: "0.8rem", color: "#10b981" }}>
                          💬 {o.whatsapp}
                        </div>
                      )}
                      <div style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>
                        ✉️ {o.email}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: "0.85rem", color: "var(--clr-text-primary)", display: "block" }}>
                        {o.governorate}
                      </strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}>
                        {o.city}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", maxWidth: "200px", lineHeight: "1.3" }}>
                        {o.address}
                      </div>
                      {o.notes && (
                        <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.25rem" }}>
                          📝 {o.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxWidth: "200px" }}>
                        {o.items.map((it, idx) => (
                          <div key={idx} style={{ fontSize: "0.8rem" }}>
                            <span>{it.quantity}× {it.productName}</span>
                            {it.selectedSize && <span style={{ color: "var(--clr-accent)", marginLeft: "4px" }}>({it.selectedSize})</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, display: "block" }}>
                        {o.paymentMethod === "instapay" ? "⚡ انستاباي" : o.paymentMethod === "vodafone_cash" ? "📱 فودافون كاش" : o.paymentMethod === "paypal" ? "🌐 PayPal" : "💵 الدفع عند الاستلام"}
                      </span>
                      {o.paymentType === "deposit" ? (
                        <div style={{ fontSize: "0.78rem", color: "var(--clr-accent)", marginTop: "0.2rem" }}>
                          ديبوزيت (30%): <strong>{o.depositAmount} ج.م</strong>
                          <div style={{ color: "var(--clr-text-muted)" }}>متبقي: {o.remainingAmount} ج.م</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#10b981" }}>مدفوع بالكامل (100%)</span>
                      )}
                      {o.paymentReference && (
                        <div style={{ fontSize: "0.72rem", color: "var(--clr-text-secondary)", marginTop: "0.25rem" }}>
                          مرجع: {o.paymentReference}
                        </div>
                      )}
                      {o.paymentProofUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedProof(o.paymentProofUrl || null)}
                          style={{
                            marginTop: "0.35rem",
                            padding: "2px 8px",
                            fontSize: "0.72rem",
                            borderRadius: "4px",
                            border: "1px solid #10b981",
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#10b981",
                            cursor: "pointer",
                          }}
                        >
                          👁️ عرض إثبات التحويل
                        </button>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: "var(--clr-accent)", fontSize: "1.05rem" }}>
                        {o.total} ج.م
                      </strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--clr-text-muted)" }}>
                        (شحن: {o.shippingFee} ج.م)
                      </div>
                    </td>
                    <td>
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="admin-status-select"
                        style={{
                          fontSize: "0.8rem",
                          padding: "0.35rem 0.6rem",
                          borderColor:
                            o.status === "delivered" ? "#10b981" :
                            o.status === "confirmed" ? "#3b82f6" :
                            o.status === "preparing" ? "#8b5cf6" :
                            o.status === "shipped" ? "#06b6d4" :
                            o.status === "cancelled" ? "#ef4444" : "#f59e0b",
                        }}
                      >
                        <option value="pending">قيد المراجعة (Pending)</option>
                        <option value="confirmed">تم التأكيد (Confirmed)</option>
                        <option value="preparing">جاري التجهيز (Preparing)</option>
                        <option value="shipped">تم الشحن (Shipped)</option>
                        <option value="delivered">تم التسليم (Delivered)</option>
                        <option value="cancelled">ملغي (Cancelled)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )}
  </div>

  {/* Modal: View Payment Proof Screenshot */}
  {selectedProof && (
    <div className="admin-modal-backdrop" onClick={() => setSelectedProof(null)}>
      <div style={{ background: "#0a0c10", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--clr-border)", maxWidth: "500px", width: "90%", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>إثبات التحويل (Payment Screenshot)</h3>
        <div style={{ position: "relative", width: "100%", height: "400px", marginBottom: "1rem" }}>
          <Image src={selectedProof} alt="Proof" fill style={{ objectFit: "contain" }} unoptimized />
        </div>
        <button onClick={() => setSelectedProof(null)} className="btn btn-pill-white" style={{ padding: "0.5rem 1.5rem" }}>
          إغلاق
        </button>
      </div>
    </div>
  )}

      {/* Modal: Add / Edit Product */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="admin-modal-container">
            <div className="admin-modal-header">
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>
                  {isEditing ? `Edit Product: ${formData.name}` : "إضافة منتج جديد (New Product)"}
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", marginTop: "0.25rem" }}>
                  تحكم كامل في الاسم، السعر، الصور، المقاسات، وحالة التوفر.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="admin-modal-close" aria-label="Close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label">Product Name (اسم المنتج) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pitch Black Hoodie"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Slug (رابط المنتج)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-if-empty"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Status & Price Rule */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label">Availability (حالة التوفر) *</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value as ProductAvailability })}
                    className="form-input"
                    style={{ fontWeight: 600 }}
                  >
                    {AVAILABILITIES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label} — {a.labelAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (السعر بالدولار $)</label>
                  {formData.availability === "coming-soon" ? (
                    <div className="admin-notice-box" style={{ margin: 0, padding: "0.75rem 0.9rem" }}>
                      <span>🔒 <strong>Coming Soon:</strong> لن يتم عرض سعر على الموقع</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 149"
                      className="form-input"
                    />
                  )}
                </div>
              </div>

              {/* Coming Soon Teaser Drop Settings */}
              {(formData.availability === "coming-soon" || formData.isBlurred) && (
                <div style={{ background: "rgba(201, 169, 110, 0.08)", border: "1px solid rgba(201, 169, 110, 0.35)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>🔒</span>
                      <span style={{ fontWeight: 700, color: "var(--clr-accent)", fontSize: "0.88rem" }}>
                        وضع التشويق (Coming Soon Teaser Drop)
                      </span>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem", color: "var(--clr-white)" }}>
                      <input
                        type="checkbox"
                        checked={formData.isBlurred}
                        onChange={(e) => setFormData({ ...formData, isBlurred: e.target.checked })}
                      />
                      <span>تطبيق بلور على الصورة (Blur Image)</span>
                    </label>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)", margin: "0 0 1rem 0", lineHeight: 1.5 }}>
                    ✨ في هذا الوضع: يتم تعتيم/بلور صورة المنتج وإظهار شارة <strong>COMING SOON</strong>، وإخفاء الاسم والسعر من الكارت تماماً، مع عرض ألوان التشويق الثلاثة فقط بالأسفل لجذب الجمهور.
                  </p>

                  {/* 3 Teaser Colors */}
                  <div>
                    <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                      ألوان التشويق الثلاثة (3 Teaser Colors):
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                      {[0, 1, 2].map((idx) => {
                        const currentColor = formData.colors?.[idx] || (idx === 0 ? "#0a0a0a" : idx === 1 ? "#4a7c9d" : "#c9a96e");
                        return (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--clr-surface-3)", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--clr-border)" }}>
                            <input
                              type="color"
                              value={currentColor}
                              onChange={(e) => {
                                const newColors = [...(formData.colors || ["#0a0a0a", "#4a7c9d", "#c9a96e"])];
                                newColors[idx] = e.target.value;
                                setFormData({ ...formData, colors: newColors });
                              }}
                              style={{ width: "28px", height: "28px", padding: 0, border: "none", borderRadius: "50%", cursor: "pointer", background: "transparent" }}
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
                              className="form-input"
                              style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem", fontFamily: "monospace" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Category & Collection */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label">Category (القسم)</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="form-input"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Collection (المجموعة)</label>
                  <input
                    type="text"
                    value={formData.collection}
                    onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                    placeholder="core / stadium / capsule"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Sizes Selection */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                  Available Sizes (المقاسات المتاحة)
                </label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {STANDARD_SIZES.map((sz) => {
                    const active = formData.sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        style={{
                          padding: "0.45rem 0.85rem",
                          borderRadius: "var(--radius-sm)",
                          border: active ? "1px solid var(--clr-accent)" : "1px solid var(--clr-border)",
                          background: active ? "var(--clr-accent)" : "var(--clr-surface-3)",
                          color: active ? "var(--clr-black)" : "var(--clr-text-primary)",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          transition: "all var(--transition-fast)",
                        }}
                      >
                        {sz} {active ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Management */}
              <div style={{ marginBottom: "1.5rem", background: "var(--clr-surface-2)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--clr-border)" }}>
                <label className="form-label" style={{ marginBottom: "0.75rem", display: "block" }}>
                  Product Images (صور المنتج)
                </label>

                {/* Upload or Add URL */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", display: "block", marginBottom: "0.35rem" }}>
                      Upload Image from device (رفع صورة من جهازك):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      style={{ fontSize: "0.8rem", color: "var(--clr-text-secondary)" }}
                    />
                    {uploading && <span style={{ fontSize: "0.75rem", color: "var(--clr-accent)", display: "block", marginTop: "0.25rem" }}>Uploading...</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", display: "block", marginBottom: "0.35rem" }}>
                      Or Image URL / Path (رابط صورة):
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="text"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        placeholder="/hero.jpg or https://..."
                        className="form-input"
                        style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem" }}
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="btn btn-outline"
                        style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem", flexShrink: 0 }}
                      >
                        Add URL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Image Previews */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  {formData.images.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: 72,
                        height: 72,
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                        border: "1px solid var(--clr-border)",
                        background: "var(--clr-surface-3)",
                      }}
                    >
                      <Image src={img.src} alt={img.alt || "preview"} fill sizes="72px" style={{ objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          background: "rgba(0,0,0,0.75)",
                          color: "#ef4444",
                          border: "none",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {formData.images.length === 0 && (
                    <p style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>
                      No images added yet. Default campaign hero will be used.
                    </p>
                  )}
                </div>
              </div>

              {/* Descriptions */}
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Short Description (الوصف المختصر)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Heavyweight cotton tee with tonal embroidery..."
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Detailed Story & Fabric (تفاصيل الخامات والقصّة)</label>
                <textarea
                  rows={3}
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  placeholder="Crafted from 500gsm loopback fleece. Dropped shoulders, relaxed unisex fit..."
                  className="form-input"
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Featured toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
                <input
                  type="checkbox"
                  id="featured-toggle"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--clr-accent)" }}
                />
                <label htmlFor="featured-toggle" style={{ fontSize: "0.875rem", color: "var(--clr-text-primary)", cursor: "pointer" }}>
                  إبراز المنتج في الصفحة الرئيسية (Featured Piece on Homepage)
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", borderTop: "1px solid var(--clr-border)", paddingTop: "1.25rem" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : isEditing ? "Save Changes (حفظ التعديلات)" : "Create Product (نشر المنتج)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
