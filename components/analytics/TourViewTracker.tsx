"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function TourViewTracker({ title, price, currency = "USD" }: { title: string; price?: string; currency?: string }) {
  useEffect(() => { trackEvent("tour_view", { item_name: title, value: Number(price || 0), currency }); }, [title, price, currency]);
  return null;
}
