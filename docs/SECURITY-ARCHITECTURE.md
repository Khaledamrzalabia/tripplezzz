# TRIPLE Z — SECURITY ARCHITECTURE & THREAT MODEL
**Last Updated:** October 2026 | **Version:** 2.0.0 Enterprise Ready

---

## 1. System Overview & Technology Stack
- **Frontend / Framework:** Next.js 16.4.0 (App Router, Turbopack, React 19).
- **Hosting / Compute:** Vercel Serverless / Node.js Standalone container.
- **Database Engine:** Supabase PostgreSQL Standard (AWS EU-Central-1).
- **Access Protocol:** Direct Connection Pooler (Port 5432, Transaction/Session pooling, SSL enabled).
- **Authentication Model:**
  - **Admin Studio:** Session Token in HttpOnly, SameSite=Lax cookie with Timing-Safe verification (`crypto.timingSafeEqual`) and Brute-force rate limiting.
  - **Customer Accounts:** PBKDF2 with SHA-512 (100,000 iterations), unique salt, cryptographically signed HMAC-SHA256 session tokens.

---

## 2. Trust Boundaries & Data Flow

```
[ UNTRUSTED INTERNET ]
        │  HTTPS (TLS 1.3)
        ▼
[ NEXT.JS EDGE / NODE RUNTIME (Vercel) ]
  ├── Security Headers: CSP, HSTS, X-Content-Type-Options: nosniff, frame-ancestors: 'none'
  ├── Rate Limiter (Token Bucket per IP)
  ├── Input Sanitization & Server-side Price Lookup
        │
        │  PostgreSQL Pooler over SSL
        ▼
[ SUPABASE POSTGRESQL ]
  ├── Row Level Security (RLS) = ENABLED on all tables
  ├── products   (Public SELECT, service_role write)
  ├── customers  (service_role only access)
  └── orders     (service_role only access)
```

---

## 3. Threat Mitigation Summary
1. **Price Tampering (SEC-01):**
   - Client sends product IDs and desired quantities.
   - Server re-queries verified DB price, calculates total and 30% deposit server-side.
2. **Unauthorized Database Access (SEC-02):**
   - Row Level Security enforced on `products`, `customers`, and `orders`. Public anon PostgREST cannot read customer PII or orders.
3. **Brute Force & Credential Stuffing (SEC-05):**
   - Sliding-window rate limiter prevents automated attacks against `/api/admin/auth` and `/api/customer/auth`.
4. **Timing Attacks (SEC-04):**
   - Constant-time string and hash comparison using `crypto.timingSafeEqual`.
5. **Malicious File Uploads (SEC-06):**
   - 5MB limit, strict MIME type + extension whitelist, random hex filename hashing preventing path traversal.
