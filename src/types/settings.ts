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

export interface StoreSettings {
  payment: PaymentSettings;
  social: SocialSettings;
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
};
