"use client";

import { useState, type FormEvent } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStatus("loading");
    // TODO: Connect to form backend (e.g. Resend, Formspree, custom API route).
    await new Promise((r) => setTimeout(r, 800));
    setStatus("done");
  };

  return (
    <div className="contact-page page-padding">
      <div className="site-container">
        <div className="contact-grid">
          <div className="contact-info">
            <p className="section-eyebrow">Get in Touch</p>
            <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>Contact Us</h1>
            <p>Have a question about an order, a collaboration inquiry, or just want to connect? Drop us a message.</p>

            <div className="contact-detail">
              <span className="contact-detail-icon">📧</span>
              <div>
                <p className="contact-detail-label">Email</p>
                <p className="contact-detail-val">hello@triplezstore.com <span style={{ color: "var(--clr-text-muted)", fontSize: "0.75rem" }}>(placeholder)</span></p>
              </div>
            </div>
            <div className="contact-detail">
              <span className="contact-detail-icon">📍</span>
              <div>
                <p className="contact-detail-label">Location</p>
                <p className="contact-detail-val">Location details to be confirmed.</p>
              </div>
            </div>
            <div className="contact-detail">
              <span className="contact-detail-icon">⏱</span>
              <div>
                <p className="contact-detail-label">Response Time</p>
                <p className="contact-detail-val">We aim to respond within 1–2 business days.</p>
              </div>
            </div>
          </div>

          <div>
            {status === "done" ? (
              <div style={{ background: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-md)", padding: "2.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>✓</p>
                <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Message Sent</h2>
                <p style={{ color: "var(--clr-text-secondary)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                  We received your message and will be in touch soon.
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", fontStyle: "italic" }}>
                  Note: Form backend is not yet connected. No message was actually delivered.
                </p>
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
                <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
                  {status === "loading" ? "Sending…" : "Send Message"}
                </button>
                <p style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)", fontStyle: "italic" }}>
                  Note: Form backend is not yet configured. Message delivery requires a server-side integration.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}