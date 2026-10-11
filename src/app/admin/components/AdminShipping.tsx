"use client";

import { useState, useMemo, useEffect } from "react";
import type { GovernorateShipping } from "../../../types/order";

const GOVERNORATE_REGIONS: Record<string, string[]> = {
  greater_cairo: ["Cairo", "Giza", "Qalyubia"],
  delta: ["Sharqia", "Dakahlia", "Gharbia", "Monufia", "Kafr El Sheikh", "Damietta", "Beheira"],
  canal_sinai: ["Port Said", "Ismailia", "Suez", "Red Sea", "South Sinai", "North Sinai"],
  north_upper: ["Fayoum", "Beni Suef", "Minya"],
  south_upper: ["Asyut", "Sohag", "Qena", "Luxor", "Aswan", "New Valley"],
  coastal: ["Alexandria", "Matrouh"],
};

export default function AdminShipping() {
  const [rates, setRates] = useState<GovernorateShipping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [bulkPrice, setBulkPrice] = useState("");
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchRates = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch("/api/shipping");
      if (res.ok) {
        const data = await res.json();
        setRates(data);
      } else {
        throw new Error("فشل جلب أسعار الشحن");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء تحميل الأسعار");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handlePriceChange = (enName: string, newText: string) => {
    setInputValues((prev) => ({ ...prev, [enName]: newText }));
    if (newText.trim() !== "") {
      const val = Number(newText);
      if (!isNaN(val) && val >= 0) {
        setRates((prev) =>
          prev.map((r) => (r.en === enName ? { ...r, shipping: val } : r))
        );
      }
    }
    setSaveSuccessMsg("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccessMsg("");
      setErrorMsg("");

      const finalRates = rates.map((r) => {
        const raw = inputValues[r.en];
        if (raw !== undefined && raw.trim() !== "") {
          const val = Number(raw);
          return { ...r, shipping: isNaN(val) ? r.shipping : Math.max(0, val) };
        }
        return r;
      });

      const res = await fetch("/api/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates: finalRates }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل حفظ أسعار الشحن");
      }

      setRates(data.rates || finalRates);
      setInputValues({});
      setSaveSuccessMsg("✓ تم حفظ جميع أسعار الشحن بنجاح وسيتعامل بها المتجر فوراً!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء حفظ أسعار الشحن");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("هل أنت متأكد من استعادة أسعار الشحن الافتراضية لجميع المحافظات؟")) return;

    try {
      setSaving(true);
      setSaveSuccessMsg("");
      setErrorMsg("");

      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل استعادة الأسعار");
      }

      setRates(data.rates);
      setSaveSuccessMsg("✓ تمت استعادة أسعار الشحن الافتراضية بنجاح!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء استعادة الأسعار");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyBulk = () => {
    const price = Number(bulkPrice);
    if (isNaN(price) || price < 0 || bulkPrice.trim() === "") {
      alert("يرجى إدخال سعر صحيح لتطبيقه.");
      return;
    }

    const filteredEnNames = new Set(filteredRates.map((r) => r.en));
    setRates((prev) =>
      prev.map((r) => (filteredEnNames.has(r.en) ? { ...r, shipping: price } : r))
    );
    const updatedInputs = { ...inputValues };
    filteredEnNames.forEach((name) => {
      updatedInputs[name] = String(price);
    });
    setInputValues(updatedInputs);
    setBulkPrice("");
    setSaveSuccessMsg(`✓ تم تطبيق ${price} ج.م على ${filteredRates.length} محافظة. تذكر الضغط على "حفظ التغييرات" لتثبيتها.`);
  };

  // Filtered List
  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || r.ar.toLowerCase().includes(q) || r.en.toLowerCase().includes(q);

      let matchRegion = true;
      if (regionFilter !== "all") {
        const allowed = GOVERNORATE_REGIONS[regionFilter] || [];
        matchRegion = allowed.includes(r.en);
      }

      return matchSearch && matchRegion;
    });
  }, [rates, search, regionFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (rates.length === 0) return { avg: 0, min: 0, max: 0 };
    const prices = rates.map((r) => Number(r.shipping) || 0);
    const sum = prices.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(sum / prices.length),
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [rates]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--clr-text-secondary)" }}>
        <span style={{ fontSize: "2rem", display: "block", marginBottom: "1rem" }}>⏳</span>
        جاري تحميل أسعار الشحن للمحافظات...
      </div>
    );
  }

  return (
    <div className="admin-shipping-container" style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header Info Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(226, 255, 76, 0.08) 0%, rgba(20, 24, 34, 0.95) 100%)",
          border: "1px solid rgba(226, 255, 76, 0.25)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🚚</span>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: 0 }}>
              التحكم في أسعار الشحن لكل محافظة
            </h2>
          </div>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>
            يمكنك تحديد وتعديل تكلفة الشحن يدوياً لكل محافظة في مصر، وستظهر الأسعار الجديدة للعميل فوراً في صفحة الدفع (Checkout).
          </p>
        </div>

        {/* Quick Stats Chips */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "0.6rem 1rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", display: "block" }}>المتوسط</span>
            <strong style={{ color: "var(--clr-accent)", fontSize: "1.1rem" }}>{stats.avg} ج.م</strong>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "0.6rem 1rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", display: "block" }}>أقل سعر</span>
            <strong style={{ color: "#4ade80", fontSize: "1.1rem" }}>{stats.min} ج.م</strong>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "0.6rem 1rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", display: "block" }}>أعلى سعر</span>
            <strong style={{ color: "#f87171", fontSize: "1.1rem" }}>{stats.max} ج.م</strong>
          </div>
        </div>
      </div>

      {/* Save / Feedback Message */}
      {saveSuccessMsg && (
        <div
          style={{
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid #22c55e",
            color: "#4ade80",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            fontWeight: 700,
            animation: "fadeIn 0.2s ease",
          }}
        >
          {saveSuccessMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            color: "#f87171",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            fontWeight: 700,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Toolbar: Search, Region Filter, Bulk Apply, Save Action */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
          marginBottom: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", flex: 1, minWidth: "280px" }}>
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "200px", flex: 1 }}>
            <input
              type="search"
              placeholder="ابحث باسم المحافظة (مثال: القاهرة، أسوان)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-field"
              style={{ width: "100%", paddingRight: "2.25rem" }}
            />
            <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--clr-text-muted)" }}>
              🔍
            </span>
          </div>

          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="admin-select-filter"
            style={{ minWidth: "160px" }}
          >
            <option value="all">جميع المحافظات (27)</option>
            <option value="greater_cairo">القاهرة الكبرى</option>
            <option value="coastal">الإسكندرية والساحل</option>
            <option value="delta">محافظات الدلتا</option>
            <option value="canal_sinai">مدن القناة وسيناء والبحر الأحمر</option>
            <option value="north_upper">شمال الصعيد</option>
            <option value="south_upper">جنوب الصعيد والوادي</option>
          </select>
        </div>

        {/* Bulk Tool & Top Save Button */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <input
              type="number"
              placeholder="سعر موحد"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              className="form-input"
              style={{ width: "110px", padding: "0.6rem 0.75rem", textAlign: "center" }}
              min="0"
            />
            <button
              type="button"
              onClick={handleApplyBulk}
              className="btn btn-outline"
              style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}
              title="تطبيق هذا السعر على كل المحافظات الظاهرة حالياً في الجدول"
            >
              تطبيق على المعروض
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-pill-white"
            style={{ padding: "0.75rem 1.75rem", fontWeight: 800, fontSize: "0.95rem" }}
          >
            {saving ? "جاري الحفظ..." : "💾 حفظ التغييرات"}
          </button>
        </div>
      </div>

      {/* Governorate Rates Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {filteredRates.map((gov) => (
          <div
            key={gov.en}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "var(--radius-md)",
              padding: "1rem 1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
          >
            <div>
              <strong style={{ fontSize: "1.05rem", color: "#fff", display: "block", marginBottom: "0.15rem" }}>
                {gov.ar}
              </strong>
              <span style={{ fontSize: "0.78rem", color: "var(--clr-text-muted)" }}>
                {gov.en}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="number"
                value={inputValues[gov.en] !== undefined ? inputValues[gov.en] : gov.shipping}
                onChange={(e) => handlePriceChange(gov.en, e.target.value)}
                min="0"
                step="5"
                className="form-input"
                style={{
                  width: "90px",
                  padding: "0.55rem 0.65rem",
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: "1rem",
                  color: "var(--clr-accent)",
                  borderColor: "rgba(226, 255, 76, 0.3)",
                }}
              />
              <span style={{ fontSize: "0.85rem", color: "var(--clr-text-secondary)" }}>ج.م</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div
        style={{
          position: "sticky",
          bottom: "1.5rem",
          background: "rgba(18, 22, 32, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(226, 255, 76, 0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "1rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>💡</span>
          <span style={{ fontSize: "0.88rem", color: "var(--clr-text-secondary)" }}>
            يتم تطبيق الأسعار المحفوظة على جميع طلبات الشراء تلقائياً.
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            className="btn btn-outline"
            style={{ padding: "0.75rem 1.25rem", fontSize: "0.85rem", borderColor: "rgba(255, 255, 255, 0.2)" }}
          >
            استعادة الأسعار الافتراضية
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-pill-white"
            style={{ padding: "0.85rem 2.25rem", fontWeight: 800, fontSize: "1rem" }}
          >
            {saving ? "جاري الحفظ..." : "💾 حفظ التغييرات الآن"}
          </button>
        </div>
      </div>
    </div>
  );
}
