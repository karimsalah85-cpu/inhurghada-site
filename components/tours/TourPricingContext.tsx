"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const TourPricingContext = createContext<{ price: number | null; setPrice: (price: number) => void } | null>(null);

export function TourPricingProvider({ children }: { children: ReactNode }) {
  const [price, setPrice] = useState<number | null>(null);
  const value = useMemo(() => ({ price, setPrice }), [price]);
  return <TourPricingContext.Provider value={value}>{children}</TourPricingContext.Provider>;
}

export const useTourPricing = () => useContext(TourPricingContext);
