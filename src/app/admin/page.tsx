"use client";

import { useState, useEffect, useMemo } from "react";
import type { Product, ProductAvailability } from "../../types/product";
import type { Order, OrderStatus } from "../../types/order";

import AdminLogin from "./components/AdminLogin";
import AdminHeader, { type AdminTab } from "./components/AdminHeader";
import AdminDashboard from "./components/AdminDashboard";
import AdminOrders from "./components/AdminOrders";
import AdminProducts from "./components/AdminProducts";
import ProductModal, { type ProductFormData } from "./components/ProductModal";
import PaymentProofModal from "./components/PaymentProofModal";

const INITIAL_FORM: ProductFormData = {
  name: "",
  slug: "",
  category: "tops",
  collection: "core",
  price: "120",
  availability: "coming-soon",
  description: "",
  longDescription: "",
  craftSpecs: "",
  fitSilhouette: "",
  garmentCare: "",
  sizes: ["S", "M", "L", "XL"],
  colors: ["#0a0a0a", "#4a7c9d", "#c9a96e"],
  isBlurred: true,
  images: [{ src: "/hero.jpg", alt: "Product Preview" }],
  featured: false,
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Auth State
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Tab Navigation: 'dashboard' | 'orders' | 'products'
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [ordersInitialFilter, setOrdersInitialFilter] = useState<string>("all");

  // Proof Modal
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  // Product Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

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

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Check Auth on Mount
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
          setProductsLoading(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setProductsLoading(false);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Order status update
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

  // Quick Featured Toggle
  const handleQuickFeaturedToggle = async (productId: string, currentFeatured: boolean) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentFeatured }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, featured: !currentFeatured } : p))
        );
      }
    } catch (err) {
      console.error("Featured toggle error:", err);
    }
  };

  // Quick Status Change
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

  // Delete Product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`هل أنت متأكد من حذف القطعة "${productName}"؟`)) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Open Create
  const handleOpenCreate = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (product: Product) => {
    setFormData({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      collection: product.collection || "core",
      price: product.price !== undefined && product.price !== null ? String(product.price) : "",
      availability: product.availability,
      description: product.description,
      longDescription: product.longDescription || "",
      craftSpecs: Array.isArray(product.craftSpecs) ? product.craftSpecs.join("\n") : "",
      fitSilhouette: product.fitSilhouette || "",
      garmentCare: product.garmentCare || "",
      sizes: product.sizes || [],
      colors: product.colors && product.colors.length > 0 ? product.colors : ["#0a0a0a", "#4a7c9d", "#c9a96e"],
      isBlurred: Boolean(product.isBlurred || product.availability === "coming-soon"),
      images: product.images && product.images.length > 0 ? product.images : [{ src: "/hero.jpg", alt: product.name }],
      featured: Boolean(product.featured),
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  // Submit Product Form
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("يرجى إدخال اسم المنتج.");
      return;
    }

    try {
      setSaving(true);
      const craftSpecsArray = formData.craftSpecs
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedPrice =
        formData.price !== "" && Number(formData.price) > 0 ? Number(formData.price) : undefined;

      const payload = {
        ...formData,
        craftSpecs: craftSpecsArray,
        fitSilhouette: formData.fitSilhouette.trim(),
        garmentCare: formData.garmentCare.trim(),
        price: parsedPrice,
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
        alert(errData.error || "فشل حفظ المنتج.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("حدث خطأ أثناء حفظ المنتج.");
    } finally {
      setSaving(false);
    }
  };

  // Pending orders count for badge
  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "pending").length;
  }, [orders]);

  // Loading Screen
  if (authChecking) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner" />
        <p>جاري التحقق من صلاحيات الأستوديو...</p>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <AdminLogin
        onSuccess={() => {
          setIsAuthenticated(true);
          fetchProducts();
          fetchOrders();
        }}
      />
    );
  }

  return (
    <main className="admin-page-root">
      <div className="site-container">
        {/* Header with Segmented Navigation */}
        <AdminHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          ordersCount={orders.length}
          pendingOrdersCount={pendingOrdersCount}
          productsCount={products.length}
          onLogout={handleLogout}
          onOpenCreate={handleOpenCreate}
        />

        {/* Tab 1: Dashboard View */}
        {activeTab === "dashboard" && (
          <AdminDashboard
            orders={orders}
            products={products}
            onOpenCreateProduct={handleOpenCreate}
            onNavigateToOrders={(status) => {
              setOrdersInitialFilter(status || "all");
              setActiveTab("orders");
            }}
            onNavigateToProducts={() => setActiveTab("products")}
            onViewProof={(url) => setSelectedProof(url)}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {/* Tab 2: Orders View */}
        {activeTab === "orders" && (
          <AdminOrders
            orders={orders}
            loading={ordersLoading}
            onRefresh={fetchOrders}
            onUpdateStatus={handleUpdateOrderStatus}
            onViewProof={(url) => setSelectedProof(url)}
            initialFilterStatus={ordersInitialFilter}
          />
        )}

        {/* Tab 3: Products View */}
        {activeTab === "products" && (
          <AdminProducts
            products={products}
            loading={productsLoading}
            onOpenCreate={handleOpenCreate}
            onOpenEdit={handleOpenEdit}
            onDelete={handleDeleteProduct}
            onQuickFeaturedToggle={handleQuickFeaturedToggle}
            onQuickStatusChange={handleQuickStatusChange}
          />
        )}
      </div>

      {/* Modal: View Payment Proof Screenshot */}
      <PaymentProofModal
        proofUrl={selectedProof}
        onClose={() => setSelectedProof(null)}
      />

      {/* Modal: Add / Edit Product */}
      <ProductModal
        isOpen={modalOpen}
        isEditing={isEditing}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitProduct}
        saving={saving}
      />
    </main>
  );
}
