import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue, Outfit } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import { CustomerAuthProvider } from "../context/CustomerAuthContext";
import { SiteMediaProvider } from "../context/SiteMediaContext";
import { getCachedStoreSettings } from "../lib/settings.server";
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

const SITE_URL =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://triplezzz.vercel.app");

const baseMetadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Triple Z",
  },
  metadataBase: new URL(SITE_URL),
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
    "winter collection",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Triple Z — Football Streetwear",
    description: "Premium football streetwear inspired by football culture. Football, worn differently.",
    creator: "@triplez",
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

// Logo, tab icon and share image come from the admin "Content & Media" tab
export async function generateMetadata(): Promise<Metadata> {
  const { media } = await getCachedStoreSettings();
  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      images: [{ url: media.shareImage, alt: "Triple Z Football Streetwear Campaign" }],
    },
    twitter: {
      ...baseMetadata.twitter,
      images: [media.shareImage],
    },
    icons: {
      icon: [{ url: media.favicon }],
      apple: [{ url: media.logo }],
    },
  };
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "Triple Z",
  url: "https://triplezzz.vercel.app",

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { media } = await getCachedStoreSettings();
  const jsonLd = { ...organizationJsonLd, logo: new URL(media.logo, SITE_URL).toString() };

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${bebasNeue.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <SiteMediaProvider media={media}>
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
        </SiteMediaProvider>
      </body>
    </html>
  );
}
