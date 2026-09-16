import type { Metadata } from "next";
import { getLiveTours } from "@/lib/live-content";

export const dynamic = "force-dynamic";

import CartCheckout from "@/components/cart/CartCheckout";

export const metadata: Metadata = {
  title: "Trip cart",
  description: "Combine several Daily Red Sea trips into one booking request.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  return <main className="min-h-screen bg-surface-muted"><CartCheckout tours={await getLiveTours()}/></main>;
}
