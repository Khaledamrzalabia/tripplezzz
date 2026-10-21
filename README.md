# Triple Z — Football Streetwear

> **Football, Worn Differently.**  
> Premium streetwear label combining contemporary fashion with football culture.

---

## ⚡ Production Overview

Triple Z is a high-performance Next.js 16 e-commerce web application engineered with modern luxury design principles, full multi-currency support, dynamic lookbook, live product catalog, and search.

- **Framework**: Next.js 16.4.0 (Turbopack, Partial Prerendering, Cache Components)
- **Runtime**: React 19.3.0
- **Type Safety**: TypeScript 5 (Strict Mode)
- **Code Quality**: ESLint 9 (Zero errors, zero warnings)
- **SEO & Social**: Automated `sitemap.xml`, `robots.txt`, Web App Manifest (`manifest.webmanifest`), Schema.org JSON-LD (Store & Product), OpenGraph & Twitter Cards.
- **Security**: Hardened HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Permissions-Policy`, `poweredByHeader: false`).

---

## 🚀 Getting Started

### 1. Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Linting & Validation
```bash
npm run lint
```

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🐳 Docker Deployment

A multi-stage production Dockerfile is included:

```bash
# Build Docker image
docker build -t triple-z-app .

# Run container on port 3000
docker run -d -p 3000:3000 --name triple-z triple-z-app
```

---

## 🌐 Deploy to Vercel or Cloud

1. Push your repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Set the environment variable:
   ```env
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```
4. Deploy — Next.js will automatically detect settings and build all static routes with instant edge distribution.

---

## 📁 Key Routes

- `/` — Campaign Landing & Mockup Experience (Hero with Messi 10 Pedestal)
- `/shop` — Filterable Storefront by category, availability, and sort
- `/collections` — Argentina & Portugal Curated Campaigns
- `/products/[slug]` — Product detail with craft specifications, fit guide, and reviews
- `/cart` & Slide-Out Bag — Persistent multi-currency drawer with free-shipping tracker
- `/checkout` — Streamlined multi-step checkout
- `/lookbook` — Editorial visual lookbook
- `/size-guide` — Measurement tables with CM/IN toggles
- `/admin` — Product catalog management dashboard
- `/sitemap.xml` — Dynamic search engine index
- `/manifest.webmanifest` — Progressive Web App manifest

---

## 📄 License
All rights reserved © 2026 Triple Z.
