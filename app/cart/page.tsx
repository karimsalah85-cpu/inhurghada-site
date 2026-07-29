import type { Metadata } from "next";
import CartCheckout from "@/components/cart/CartCheckout";

export const metadata: Metadata = {
  title: "Trip cart",
  description: "Combine several Daily Red Sea trips into one booking request.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <main className="min-h-screen bg-slate-50"><CartCheckout/></main>;
}
