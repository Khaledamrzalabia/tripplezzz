"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { CartState } from "../types/cart";
import type { Product } from "../types/product";
import { isProductComingSoon } from "../types/product";

type CartAction =
  | { type: "ADD"; product: Product; quantity: number; selectedSize?: string; selectedColor?: string }
  | { type: "REMOVE"; productId: string; selectedSize?: string; selectedColor?: string }
  | { type: "UPDATE_QTY"; productId: string; selectedSize?: string; selectedColor?: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; payload: CartState };

function matchesCartItem(
  item: { product: { id: string }; selectedSize?: string; selectedColor?: string },
  productId: string,
  selectedSize?: string,
  selectedColor?: string
) {
  return (
    item.product.id === productId &&
    (item.selectedSize ?? "") === (selectedSize ?? "") &&
    (item.selectedColor ?? "") === (selectedColor ?? "")
  );
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;
    case "ADD": {
      const existing = state.items.findIndex((i) =>
        matchesCartItem(i, action.product.id, action.selectedSize, action.selectedColor)
      );
      if (existing > -1) {
        const items = [...state.items];
        items[existing] = { ...items[existing], quantity: items[existing].quantity + action.quantity };
        return { items };
      }
      return {
        items: [
          ...state.items,
          { product: action.product, quantity: action.quantity, selectedSize: action.selectedSize, selectedColor: action.selectedColor },
        ],
      };
    }
    case "REMOVE": {
      return {
        items: state.items.filter(
          (i) => !matchesCartItem(i, action.productId, action.selectedSize, action.selectedColor)
        ),
      };
    }
    case "UPDATE_QTY": {
      if (action.quantity < 1) {
        return {
          items: state.items.filter(
            (i) => !matchesCartItem(i, action.productId, action.selectedSize, action.selectedColor)
          ),
        };
      }
      return {
        items: state.items.map((i) =>
          matchesCartItem(i, action.productId, action.selectedSize, action.selectedColor)
            ? { ...i, quantity: action.quantity }
            : i
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export interface CartToastItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartContextValue {
  state: CartState;
  addItem: (product: Product, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (productId: string, selectedSize?: string, selectedColor?: string) => void;
  updateQty: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  lastAddedItem: CartToastItem | null;
  clearLastAddedItem: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "tz_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartToastItem | null>(null);
  const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const isHydratedRef = React.useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartState;
        if (parsed?.items?.length) {
          dispatch({ type: "HYDRATE", payload: parsed });
        }
      }
    } catch {
      // ignore parsing error
    }
    isHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (isHydratedRef.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const clearLastAddedItem = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setLastAddedItem(null);
  };

  const addItem = (product: Product, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (isProductComingSoon(product) || product.availability === "out-of-stock") return;
    dispatch({ type: "ADD", product, quantity, selectedSize, selectedColor });
    // Trigger lightweight toast notification without hijacking the viewport
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setLastAddedItem({ product, quantity, selectedSize, selectedColor });
    toastTimeoutRef.current = setTimeout(() => {
      setLastAddedItem(null);
    }, 4000);
  };

  const removeItem = (productId: string, selectedSize?: string, selectedColor?: string) =>
    dispatch({ type: "REMOVE", productId, selectedSize, selectedColor });

  const updateQty = (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) =>
    dispatch({ type: "UPDATE_QTY", productId, selectedSize, selectedColor, quantity });

  const clearCart = () => dispatch({ type: "CLEAR" });

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + (i.product.price ?? 0) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalItems,
        totalPrice,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        lastAddedItem,
        clearLastAddedItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
