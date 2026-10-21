import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers regarding orders, payment, sizing, delivery across Egypt, and returns.",
};

const FAQS = [
  {
    category: "ORDERS & PAYMENTS",
    items: [
      {
        q: "What payment methods are supported?",
        a: "Cash on delivery, InstaPay, Vodafone Cash, and PayPal. With online transfers you can pay the full amount or a 30% deposit and the rest on delivery. Upload the transfer screenshot at checkout so we can confirm your order.",
      },
      {
        q: "Which currency are prices in?",
        a: "All prices are in Egyptian Pounds (EGP).",
      },
      {
        q: "Can I cancel or modify an order after placing it?",
        a: "While your order is still pending review, you can cancel it from your account page. Once we confirm it, reach us through the Contact page with your order number.",
      },
    ],
  },
  {
    category: "SHIPPING & DELIVERY",
    items: [
      {
        q: "Where do you ship and how fast?",
        a: "We ship to every governorate in Egypt and aim to dispatch orders within 2–5 business days.",
      },
      {
        q: "How much is shipping?",
        a: "Shipping depends on your governorate and is shown at checkout before you confirm. You pay one shipping fee per order.",
      },
    ],
  },
  {
    category: "PRODUCT, MATERIALS & SIZING",
    items: [
      {
        q: "What is the quality of the fabrics?",
        a: "Every hoodie is built from 500gsm custom-milled loopback fleece with reinforced seams, high-density 3D embroidery, and custom hardware. Our tees are made of 240gsm combed organic cotton.",
      },
      {
        q: "How does the sizing run?",
        a: "Triple Z garments are designed with a relaxed, dropped-shoulder streetwear fit. If you prefer a tighter or standard tailored look, we recommend sizing down one size. Please consult our detailed Size Guide.",
      },
      {
        q: "How should I wash and care for embroidered pieces?",
        a: "Always wash inside-out on a delicate cold cycle (max 30°C). Air dry only. Do not tumble dry or iron directly over the embroidery and crest badges.",
      },
    ],
  },
  {
    category: "RETURNS & EXCHANGES",
    items: [
      {
        q: "What is your return policy?",
        a: "We offer a 14-day return and exchange window from the date of delivery. Items must be unworn, unwashed, and in their original packaging with all security tags attached.",
      },
      {
        q: "How do I initiate a return?",
        a: "Reach us through the Contact page (WhatsApp or email) with your order number and tell us whether you want an exchange or a refund.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="page-padding">
      <div className="site-container" style={{ maxWidth: "880px" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div className="mockup-eyebrow" style={{ justifyContent: "center" }}>
            <span className="mockup-gold-dash" />
            <span>SUPPORT & SERVICE</span>
          </div>
          <h1 className="section-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p style={{ color: "var(--clr-text-secondary)", fontSize: "1rem", marginTop: "1rem" }}>
            Everything you need to know about shopping, sizing, drops, and our delivery process.
          </p>
        </div>

        {/* FAQ Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
          {FAQS.map((cat) => (
            <section key={cat.category}>
              <h2 style={{ fontSize: "1.2rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--clr-accent)", marginBottom: "1.5rem" }}>
                {cat.category}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {cat.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--clr-bg-surface)",
                      border: "1px solid var(--clr-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "1.75rem",
                    }}
                  >
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--clr-text-primary)" }}>
                      {item.q}
                    </h3>
                    <p style={{ color: "var(--clr-text-secondary)", lineHeight: 1.65, fontSize: "0.95rem" }}>
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Still Need Help Box */}
        <div
          style={{
            marginTop: "5rem",
            textAlign: "center",
            background: "linear-gradient(180deg, rgba(201,169,110,0.08), rgba(201,169,110,0.02))",
            border: "1px solid rgba(201,169,110,0.25)",
            borderRadius: "var(--radius-lg)",
            padding: "3rem 2rem",
          }}
        >
          <h3 style={{ fontSize: "1.4rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            STILL HAVE QUESTIONS?
          </h3>
          <p style={{ color: "var(--clr-text-secondary)", marginBottom: "2rem", maxWidth: "480px", marginInline: "auto" }}>
            Our concierge team is available 7 days a week to help with sizing, orders, and inquiries.
          </p>
          <Link href="/contact" className="btn btn-pill-white">
            CONTACT CONCIERGE →
          </Link>
        </div>
      </div>
    </div>
  );
}
