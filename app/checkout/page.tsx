import { Suspense } from "react";
import CheckoutExperience from "@/components/booking/CheckoutExperience";

export const metadata = {
  title: "Checkout | Daily Red Sea",
  description: "A polished checkout experience for booking tours, transfers, and excursions in Hurghada.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutExperience />
    </Suspense>
  );
}
