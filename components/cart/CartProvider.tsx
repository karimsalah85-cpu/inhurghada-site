"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  tourSlug: string;
  tourName: string;
  date: string;
  time: string;
  adults: number;
  youth: number;
  infants: number;
  extras: string[];
  selectedBoatOption?: string;
  extraQuantities?: Record<string, number>;
  transferRequired?: boolean;
  transferArea?: string;
  subtotal: number;
  requiresDivingLicense: boolean;
  requiresQuadMinimumAge: boolean;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
};

const storageKey = "daily-red-sea-trip-cart";
const CartContext = createContext<CartContextValue | null>(null);

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let savedItems: CartItem[] = [];
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) savedItems = saved.slice(0, 6);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    const update = window.setTimeout(() => {
      setItems(savedItems);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(update);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    addItem: (item) => setItems((current) => [...current, { ...item, id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${item.tourSlug}` }].slice(-6)),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clearCart: () => setItems([]),
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
