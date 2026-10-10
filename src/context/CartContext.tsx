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

type CartAction =
  | { type: "ADD"; product: Product; quantity: number; selectedSize?: string; selectedColor?: string }
  | { type: "REMOVE"; productId: string; selectedSize?: string }
  | { type: "UPDATE_QTY"; productId: string; selectedSize?: string; quantity: number }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.findIndex(
        (i) => i.product.id === action.product.id && i.selectedSize === action.selectedSize
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
          (i) => !(i.product.id === action.productId && i.selectedSize === action.selectedSize)
        ),
      };
    }
    case "UPDATE_QTY": {
      if (action.quantity < 1) {
        return {
          items: state.items.filter(
            (i) => !(i.product.id === action.productId && i.selectedSize === action.selectedSize)
          ),
        };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId && i.selectedSize === action.selectedSize
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

interface CartContextValue {
  state: CartState;
  addItem: (product: Product, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (productId: string, selectedSize?: string) => void;
  updateQty: (productId: string, quantity: number, selectedSize?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "tz_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, (initial) => {
    if (typeof window === "undefined") return initial;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartState) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = (product: Product, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (product.availability === "coming-soon" || product.availability === "out-of-stock") return;
    dispatch({ type: "ADD", product, quantity, selectedSize, selectedColor });
    setIsDrawerOpen(true); // Automatically open slide-out mini-cart for instant feedback
  };

  const removeItem = (productId: string, selectedSize?: string) =>
    dispatch({ type: "REMOVE", productId, selectedSize });

  const updateQty = (productId: string, quantity: number, selectedSize?: string) =>
    dispatch({ type: "UPDATE_QTY", productId, selectedSize, quantity });

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
