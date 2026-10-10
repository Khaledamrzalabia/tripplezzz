"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zip: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName.trim()) errors.firstName = "Required";
  if (!data.lastName.trim()) errors.lastName = "Required";
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Valid email required";
  if (!data.address.trim()) errors.address = "Required";
  if (!data.city.trim()) errors.city = "Required";
  if (!data.country.trim()) errors.country = "Required";
  if (!data.zip.trim()) errors.zip = "Required";
  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state, totalPrice, totalItems, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", country: "Egypt", zip: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("success");
    clearCart();
    router.push("/order-confirmation");
  };

  if (state.items.length === 0 && status !== "success") {
    return (
      <div className="checkout-page">
        <div className="site-container" style={{ textAlign: "center", paddingTop: "6rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚽</div>
          <h1 className="display-md" style={{ marginBottom: "1rem" }}>Your cart is empty</h1>
          <p style={{ color: "var(--clr-text-secondary)", marginBottom: "2rem" }}>Add pieces to your bag before checking out.</p>
          <Link href="/shop" className="btn btn-pill-white">Shop the Collection →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="site-container">
        <div className="mockup-eyebrow">
          <span className="mockup-gold-dash" />
          <span>EXPRESS CHECKOUT</span>
        </div>
        <h1 className="display-md" style={{ marginBottom: "2.5rem" }}>CHECKOUT</h1>

        <div className="checkout-grid">
          <form onSubmit={handleSubmit} noValidate>
            {/* Contact */}
            <div className="checkout-form-section">
              <h2 className="checkout-section-title">Contact Information</h2>
              <div className="form-grid">
                <Field id="firstName" label="First Name" value={form.firstName} error={errors.firstName} onChange={handleChange} autoComplete="given-name" />
                <Field id="lastName" label="Last Name" value={form.lastName} error={errors.lastName} onChange={handleChange} autoComplete="family-name" />
                <Field id="email" label="Email Address" type="email" value={form.email} error={errors.email} onChange={handleChange} autoComplete="email" className="full" />
                <Field id="phone" label="Mobile Phone (for delivery courier)" type="tel" value={form.phone} error={errors.phone} onChange={handleChange} autoComplete="tel" className="full" />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="checkout-form-section">
              <h2 className="checkout-section-title">Shipping Address</h2>
              <div className="form-grid">
                <Field id="address" label="Street Address & Apt/Suite" value={form.address} error={errors.address} onChange={handleChange} autoComplete="street-address" className="full" />
                <Field id="city" label="City" value={form.city} error={errors.city} onChange={handleChange} autoComplete="address-level2" />
                <div className="form-group">
                  <label htmlFor="country" className="form-label">Country / Region</label>
                  <select
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="Egypt">Egypt (مصر)</option>
                    <option value="Saudi Arabia">Saudi Arabia (المملكة العربية السعودية)</option>
                    <option value="United Arab Emirates">United Arab Emirates (الإمارات)</option>
                    <option value="Kuwait">Kuwait (الكويت)</option>
                    <option value="Qatar">Qatar (قطر)</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="France">France</option>
                    <option value="Spain">Spain</option>
                  </select>
                </div>
                <Field id="zip" label="Postal / ZIP Code" value={form.zip} error={errors.zip} onChange={handleChange} autoComplete="postal-code" className="full" />
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="checkout-form-section">
              <h2 className="checkout-section-title">Payment Method</h2>
              <div style={{ background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <input type="radio" id="pay-card" name="pay-method" defaultChecked />
                  <label htmlFor="pay-card" style={{ fontWeight: 600, fontSize: "0.95rem" }}>Credit / Debit Card (Visa, Mastercard, Apple Pay, Mada, Meeza)</label>
                </div>
                <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.85rem", paddingLeft: "1.75rem" }}>
                  Card payments are 100% encrypted and secured via standard payment gateways.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-pill-white"
              disabled={status === "loading"}
              style={{ width: "100%", padding: "1.2rem", fontSize: "1rem" }}
            >
              {status === "loading" ? "Processing Order..." : `PLACE ORDER &bull; ${formatPrice(totalPrice)}`}
            </button>
          </form>

          {/* Summary Sidebar */}
          <div className="checkout-summary">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem" }}>
              Order Review ({totalItems} item{totalItems !== 1 ? "s" : ""})
            </h2>
            {state.items.map((item) => (
              <div key={item.product.id + (item.selectedSize ?? "")} className="checkout-item-row">
                <div className="checkout-item-img">
                  <Image
                    src={item.product.images[0]?.src ?? "/hero.jpg"}
                    alt={item.product.name}
                    width={52}
                    height={52}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                </div>
                <div className="checkout-item-info">
                  <p className="checkout-item-name">{item.product.name}</p>
                  <p className="checkout-item-meta">Qty: {item.quantity}{item.selectedSize ? ` / ${item.selectedSize}` : ""}</p>
                </div>
                <p className="checkout-item-price">{formatPrice((item.product.price ?? 0) * item.quantity)}</p>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--clr-border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.1rem" }}>
              <span>Total Amount</span>
              <span style={{ color: "var(--clr-accent)" }}>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, type = "text", value, error, onChange, autoComplete, className,
}: {
  id: string; label: string; type?: string; value: string;
  error?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string; className?: string;
}) {
  return (
    <div className={"form-group" + (className ? " " + className : "")}>
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        className={"form-input" + (error ? " error" : "")}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-describedby={error ? id + "-err" : undefined}
        aria-invalid={!!error}
      />
      {error && <span id={id + "-err"} className="form-error" role="alert">{error}</span>}
    </div>
  );
}