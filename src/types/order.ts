export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  governorate?: string;
  city?: string;
  address?: string;
  createdAt: string;
}

export type PaymentMethod = "cod" | "instapay" | "vodafone_cash" | "paypal";
export type PaymentType = "full" | "deposit";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  depositAmount: number;
  remainingAmount: number;
  paymentProofUrl?: string;
  paymentReference?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GovernorateShipping {
  en: string;
  ar: string;
  shipping: number;
}

export const EGYPT_GOVERNORATES: GovernorateShipping[] = [
  { en: "Cairo", ar: "القاهرة", shipping: 60 },
  { en: "Giza", ar: "الجيزة", shipping: 60 },
  { en: "Alexandria", ar: "الإسكندرية", shipping: 70 },
  { en: "Qalyubia", ar: "القليوبية", shipping: 70 },
  { en: "Sharqia", ar: "الشرقية", shipping: 75 },
  { en: "Dakahlia", ar: "الدقهلية", shipping: 75 },
  { en: "Gharbia", ar: "الغربية", shipping: 75 },
  { en: "Monufia", ar: "المنوفية", shipping: 75 },
  { en: "Beheira", ar: "البحيرة", shipping: 80 },
  { en: "Kafr El Sheikh", ar: "كفر الشيخ", shipping: 80 },
  { en: "Damietta", ar: "دمياط", shipping: 80 },
  { en: "Port Said", ar: "بورسعيد", shipping: 80 },
  { en: "Ismailia", ar: "الإسماعيلية", shipping: 80 },
  { en: "Suez", ar: "السويس", shipping: 80 },
  { en: "Fayoum", ar: "الفيوم", shipping: 85 },
  { en: "Beni Suef", ar: "بني سويف", shipping: 85 },
  { en: "Minya", ar: "المنيا", shipping: 90 },
  { en: "Asyut", ar: "أسيوط", shipping: 95 },
  { en: "Sohag", ar: "سوهاج", shipping: 100 },
  { en: "Qena", ar: "قنا", shipping: 105 },
  { en: "Luxor", ar: "الأقصر", shipping: 110 },
  { en: "Aswan", ar: "أسوان", shipping: 115 },
  { en: "Red Sea", ar: "البحر الأحمر (الغردقة)", shipping: 110 },
  { en: "South Sinai", ar: "جنوب سيناء (شرم الشيخ)", shipping: 110 },
  { en: "North Sinai", ar: "شمال سيناء", shipping: 120 },
  { en: "Matrouh", ar: "مطروح / الساحل", shipping: 110 },
  { en: "New Valley", ar: "الوادي الجديد", shipping: 130 },
];
