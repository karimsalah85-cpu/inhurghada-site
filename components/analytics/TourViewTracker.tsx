"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function TourViewTracker({ title, price }: { title: string; price?: string }) {
  useEffect(() => { trackEvent("tour_view", { item_name: title, value: Number(price || 0), currency: "USD" }); }, [title, price]);
  return null;
}
