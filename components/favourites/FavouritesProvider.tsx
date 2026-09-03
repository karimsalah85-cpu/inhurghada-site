"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

/** Everything the saved-trips panel needs to render a card without re-fetching tour data. */
export type FavouriteItem = {
  slug: string;
  title: string;
  image: string;
  location: string;
  price: string;
  priceUnit?: string;
  bookingMode?: "direct" | "inquiry";
  badge?: string;
  category?: string;
};

type FavouritesContextValue = {
  items: FavouriteItem[];
  count: number;
  isFavourite: (slug: string) => boolean;
  toggle: (item: FavouriteItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
};

const storageKey = "daily-red-sea-favourites";
const maxItems = 60;
const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export default function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavouriteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    let saved: FavouriteItem[] = [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(parsed)) saved = parsed.filter((entry) => entry && typeof entry.slug === "string").slice(0, maxItems);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    const update = window.setTimeout(() => {
      setItems(saved);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(update);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items]);

  useEffect(() => {
    if (!panelOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [panelOpen]);

  const value = useMemo<FavouritesContextValue>(() => ({
    items,
    count: items.length,
    isFavourite: (slug) => items.some((entry) => entry.slug === slug),
    toggle: (item) => setItems((current) => current.some((entry) => entry.slug === item.slug)
      ? current.filter((entry) => entry.slug !== item.slug)
      : [{ ...item }, ...current].slice(0, maxItems)),
    remove: (slug) => setItems((current) => current.filter((entry) => entry.slug !== slug)),
    clear: () => setItems([]),
    panelOpen,
    openPanel: () => setPanelOpen(true),
    closePanel: () => setPanelOpen(false),
  }), [items, panelOpen]);

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const context = useContext(FavouritesContext);
  if (!context) throw new Error("useFavourites must be used within FavouritesProvider");
  return context;
}
