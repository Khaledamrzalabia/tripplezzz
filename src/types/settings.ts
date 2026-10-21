export interface PaymentSettings {
  vodafoneCash: {
    number: string;
    accountName: string;
    enabled: boolean;
  };
  instapay: {
    ipa: string;
    link: string;
    accountName: string;
    enabled: boolean;
  };
  paypal: {
    email: string;
    link: string;
    enabled: boolean;
  };
}

export interface SocialSettings {
  instagram: string;
  instagramDm: string;
  tiktok: string;
  whatsapp: string;
  facebook: string;
  x: string;
  youtube: string;
}

/** Every site image (and the homepage texts) editable from the admin "Content & Media" tab */
export interface SiteMediaSettings {
  /** Brand logo in the header, mobile menus, admin login and app icon */
  logo: string;
  /** Browser tab icon */
  favicon: string;
  /** Preview image when a link to the store is shared (WhatsApp, Facebook, X...) */
  shareImage: string;
  heroImage: string;
  heroEyebrow: string;
  heroSubtitle: string;
  productsTitle: string;
  productsSubtitle: string;
  cultureImage: string;
  /** Exactly 3 images for the craft detail cards */
  craftImages: string[];
  /** Exactly 5 images for the community gallery */
  communityImages: string[];
  aboutImage: string;
  /** Exactly 6 images, one per Lookbook story, in page order */
  lookbookImages: string[];
}

/** Store contact details shown on the Contact page */
export interface ContactSettings {
  email: string;
  phone: string;
  /** WhatsApp number in international format without "+", e.g. 201012345678 */
  whatsapp: string;
  address: string;
  workingHours: string;
  responseTime: string;
  intro: string;
}

export interface StoreSettings {
  payment: PaymentSettings;
  social: SocialSettings;
  media: SiteMediaSettings;
  contact: ContactSettings;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  payment: {
    vodafoneCash: {
      number: "01044463717",
      accountName: "محفظة فودافون كاش المعتمدة",
      enabled: true,
    },
    instapay: {
      ipa: "migohlmy@instapay",
      link: "https://ipn.eg/S/migohlmy/instapay/2BdKeD",
      accountName: "Triple Z Official",
      enabled: true,
    },
    paypal: {
      email: "payments@triple-z.com",
      link: "",
      enabled: true,
    },
  },
  social: {
    instagram: "https://www.instagram.com/triplez1606/",
    instagramDm: "https://ig.me/m/triplez1606",
    tiktok: "https://tiktok.com",
    whatsapp: "https://wa.me/201044463717",
    facebook: "",
    x: "https://x.com",
    youtube: "https://youtube.com",
  },
  media: {
    logo: "/brand-logo.webp",
    favicon: "/icon.svg",
    shareImage: "/hero-hoodies-pair.jpg",
    heroImage: "/hero-hoodies-pair.webp",
    heroEyebrow: "TRIPLE Z — WINTER COLLECTION",
    heroSubtitle: "Premium streetwear inspired by football culture.\nDesigned for those who play by their own rules.",
    productsTitle: "THE WINTER COLLECTION",
    productsSubtitle: "Every piece in the drop.",
    cultureImage: "/campaign/culture-seated-model.webp",
    craftImages: ["/craft/craft-embroidery.webp", "/craft/craft-crest.webp", "/craft/craft-stripe.webp"],
    communityImages: [
      "/products/product-messi-back-pedestal.webp",
      "/campaign/banner-argentina.webp",
      "/craft/craft-stripe.webp",
      "/campaign/banner-portugal.webp",
      "/campaign/culture-seated-model.webp",
    ],
    aboutImage: "/campaign/culture-seated-model.webp",
    lookbookImages: [
      "/campaign/banner-argentina.webp",
      "/campaign/banner-portugal.webp",
      "/campaign/culture-seated-model.webp",
      "/craft/craft-embroidery.webp",
      "/craft/craft-crest.webp",
      "/products/stadium-track-jacket.webp",
    ],
  },
  contact: {
    email: "",
    phone: "01044463717",
    whatsapp: "201044463717",
    address: "",
    workingHours: "",
    responseTime: "We aim to respond within 1–2 business days.",
    intro: "Have a question about an order, a collaboration inquiry, or just want to connect? Drop us a message.",
  },
};
