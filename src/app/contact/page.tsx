"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DEFAULT_STORE_SETTINGS, type ContactSettings } from "../../types/settings";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_STORE_SETTINGS.contact);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.contact) setContact(data.contact);
      })
      .catch(() => {});
  }, []);

  const canSend = Boolean(contact.whatsapp || contact.email);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required.";
    if (!form.message.trim() || form.message.length < 10) e.message = "Message must be at least 10 characters.";
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    // No mail backend: hand the message to WhatsApp (preferred) or the visitor's email app
    const text = `${form.message.trim()}\n\n— ${form.name.trim()} (${form.email.trim()})`;
    const url = contact.whatsapp
      ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`
      : `mailto:${contact.email}?subject=${encodeURIComponent("Triple Z — " + form.name.trim())}&body=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus("done");
  };

  return (
    <div className="contact-page page-padding">
      <div className="site-container">
        <div className="contact-grid">
          <div className="contact-info">
            <p className="section-eyebrow">Get in Touch</p>
            <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>Contact Us</h1>
            {contact.intro && <p>{contact.intro}</p>}

            {contact.email && (
              <div className="contact-detail">
                <span className="contact-detail-icon">📧</span>
                <div>
                  <p className="contact-detail-label">Email</p>
                  <p className="contact-detail-val"><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="contact-detail">
                <span className="contact-detail-icon">📞</span>
                <div>
                  <p className="contact-detail-label">Phone</p>
                  <p className="contact-detail-val"><a href={`tel:${contact.phone}`} dir="ltr">{contact.phone}</a></p>
                </div>
              </div>
            )}
            {contact.whatsapp && (
              <div className="contact-detail">
                <span className="contact-detail-icon">💬</span>
                <div>
                  <p className="contact-detail-label">WhatsApp</p>
                  <p className="contact-detail-val"><a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" dir="ltr">+{contact.whatsapp}</a></p>
                </div>
              </div>
            )}
            {contact.address && (
              <div className="contact-detail">
                <span className="contact-detail-icon">📍</span>
                <div>
                  <p className="contact-detail-label">Location</p>
                  <p className="contact-detail-val">{contact.address}</p>
                </div>
              </div>
            )}
            {contact.workingHours && (
              <div className="contact-detail">
                <span className="contact-detail-icon">🕒</span>
                <div>
                  <p className="contact-detail-label">Working Hours</p>
                  <p className="contact-detail-val">{contact.workingHours}</p>
                </div>
              </div>
            )}
            {contact.responseTime && (
              <div className="contact-detail">
                <span className="contact-detail-icon">⏱</span>
                <div>
                  <p className="contact-detail-label">Response Time</p>
                  <p className="contact-detail-val">{contact.responseTime}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            {status === "done" ? (
              <div style={{ background: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-md)", padding: "2.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>✓</p>
                <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Almost there</h2>
                <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                  Your message opened in {contact.whatsapp ? "WhatsApp" : "your email app"}. Press send there and we&apos;ll get back to you soon.
                </p>
                <button type="button" className="btn btn-pill-outline-sm" onClick={() => setStatus("idle")}>
                  Edit message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">Full Name</label>
                  <input id="contact-name" name="name" type="text" className={"form-input" + (errors.name ? " error" : "")} value={form.name} onChange={handleChange} autoComplete="name" aria-invalid={!!errors.name} />
                  {errors.name && <span className="form-error" role="alert">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">Email Address</label>
                  <input id="contact-email" name="email" type="email" className={"form-input" + (errors.email ? " error" : "")} value={form.email} onChange={handleChange} autoComplete="email" aria-invalid={!!errors.email} />
                  {errors.email && <span className="form-error" role="alert">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className={"form-input" + (errors.message ? " error" : "")}
                    style={{ minHeight: "140px", resize: "vertical" }}
                    value={form.message}
                    onChange={handleChange}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && <span className="form-error" role="alert">{errors.message}</span>}
                </div>
                <button type="submit" className="btn btn-primary" disabled={!canSend}>
                  {contact.whatsapp ? "Send on WhatsApp" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}