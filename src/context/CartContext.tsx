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
  | { type: "HYDRATE"; payload: CartState }
  | { type: "SYNC"; products: Product[] };

function isPurchasable(product: Product): boolean {
  return !isProductComingSoon(product) && product.availability !== "out-of-stock";
}

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
    case "SYNC": {
      // Replace saved product snapshots with the live catalogue; drop what can't be bought anymore
      const byId = new Map(action.products.map((p) => [p.id, p]));
      return {
        items: state.items.flatMap((i) => {
          const fresh = byId.get(i.product.id);
          return fresh && isPurchasable(fresh) ? [{ ...i, product: fresh }] : [];
        }),
      };
    }
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
  /** Re-reads live prices/availability; returns true when the cart changed */
  refreshCart: () => Promise<boolean>;
  /** Message about items removed or re-priced by the last refresh */
  cartNotice: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "tz_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartToastItem | null>(null);
  const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const isHydratedRef = React.useRef(false);
  const stateRef = React.useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  const refreshCart = React.useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) return false;
      const products: Product[] = await res.json();
      if (!Array.isArray(products)) return false;

      const byId = new Map(products.map((p) => [p.id, p]));
      const removed: string[] = [];
      let repriced = false;
      for (const item of stateRef.current.items) {
        const fresh = byId.get(item.product.id);
        if (!fresh || !isPurchasable(fresh)) removed.push(item.product.name);
        else if ((fresh.price ?? 0) !== (item.product.price ?? 0)) repriced = true;
      }

      dispatch({ type: "SYNC", products });
      const notes: string[] = [];
      if (removed.length) notes.push(`اتشال من السلة لأنه مبقاش متاح: ${removed.join("، ")}.`);
      if (repriced) notes.push("أسعار بعض القطع اتحدثت، راجع الإجمالي.");
      setCartNotice(notes.length ? notes.join(" ") : null);
      return removed.length > 0 || repriced;
    } catch {
      return false;
    }
  }, []);

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
    // Saved carts keep old prices: sync them with the live catalogue right away.
    // State is only set after the network call resolves, not synchronously in this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCart();
  }, [refreshCart]);

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
    if (!isPurchasable(product)) return;
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
        refreshCart,
        cartNotice,
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
