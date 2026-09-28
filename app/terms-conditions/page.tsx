import type { Metadata } from "next";
import TermsConditionsPage from "@/components/pages/TermsConditionsPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Terms and conditions for Daily Red Sea bookings and transfers.",
  path: "/terms-conditions",
});

export default function Page() {
  return <TermsConditionsPage />;
}
