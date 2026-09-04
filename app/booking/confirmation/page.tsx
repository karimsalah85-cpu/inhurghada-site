import type { Metadata } from "next";
import { Suspense } from "react";
import BookingConfirmation from "@/components/booking/BookingConfirmation";

export const metadata: Metadata = {
  title: "Booking Confirmation",
  description: "Your Daily Red Sea booking request confirmation.",
  robots: { index: false, follow: false },
};

export default function BookingConfirmationPage() {
  return <Suspense fallback={<main className="min-h-screen bg-surface-muted" />}><BookingConfirmation /></Suspense>;
}
