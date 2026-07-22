import { Suspense } from "react";
import type { Metadata } from "next";
import CheckoutExperience from "@/components/booking/CheckoutExperience";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Checkout",
  description: "Securely review and confirm a Daily Red Sea booking.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutExperience />
    </Suspense>
  );
}
