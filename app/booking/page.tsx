import BookingPortal from "@/components/booking/BookingPortal";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Booking Portal",
  description: "View a Daily Red Sea reservation, booking details, and confirmation document.",
  path: "/booking",
  noIndex: true,
});

export default function BookingPage() {
  return <BookingPortal />;
}
