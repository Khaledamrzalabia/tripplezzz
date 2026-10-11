import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue, Outfit } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import { CustomerAuthProvider } from "../context/CustomerAuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Triple Z",
  },
  metadataBase: new URL(
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://triplezzz.vercel.app")
  ),
  title: {
    template: "%s | Triple Z",
    default: "Triple Z — Football Streetwear",
  },
  description:
    "Premium football streetwear. Football, worn differently. Explore luxury hoodies, jackets, tees, and tracksuits inspired by football culture.",
  keywords: [
    "Triple Z",
    "football streetwear",
    "luxury sportswear",
    "Messi hoodie",
    "Argentina collection",
    "Portugal heritage",
    "premium apparel",
  ],
  authors: [{ name: "Triple Z" }],
  creator: "Triple Z",
  publisher: "Triple Z",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    siteName: "Triple Z",
    type: "website",
    locale: "en_US",
    url: "https://triple-z.com",
    title: "Triple Z — Football Streetwear",
    description: "Premium football streetwear inspired by football culture. Football, worn differently.",
    images: [
      {
        url: "/hero-hoodies-pair.jpg",
        width: 1200,
        height: 800,
        alt: "Triple Z Football Streetwear Campaign",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Triple Z — Football Streetwear",
    description: "Premium football streetwear inspired by football culture. Football, worn differently.",
    images: ["/hero-hoodies-pair.jpg"],
    creator: "@triplez",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/brand-logo.png", sizes: "180x180" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "Triple Z",
  url: "https://triplezzz.vercel.app",
  logo: "https://triplezzz.vercel.app/brand-logo.png",
  description: "Premium football streetwear inspired by football culture.",
  priceRange: "$$$",
  sameAs: [
    "https://instagram.com/triplez",
    "https://tiktok.com/@triplez",
    "https://youtube.com/@triplez",
    "https://x.com/triplez",
  ],
  potentialAction: {
    "@type": "SearchAction",
    target: "https://triplezzz.vercel.app/shop?query={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

function HeaderFallback() {
  return (
    <header className="site-header site-header-skeleton" aria-hidden="true" style={{ pointerEvents: "none" }}>
      <div className="header-inner">
        <div style={{ height: "48px", width: "140px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "4px" }} />
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${bebasNeue.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <CurrencyProvider>
          <CartProvider>
            <CustomerAuthProvider>
              <Suspense fallback={<HeaderFallback />}>
                <Header />
              </Suspense>
              <main id="main-content">{children}</main>
              <Footer />
            </CustomerAuthProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
