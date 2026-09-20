import type { Metadata } from "next";
import ReferralDashboard from "@/components/referral/ReferralDashboard";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Refer friends — Give 5%, Get 5%",
  description: "Share your Daily Red Sea referral link, give friends 5% off their first booking, and earn 5% off a future trip once they travel.",
  path: "/referrals",
  noIndex: true,
});

export default function ReferralsPage() {
  return <ReferralDashboard locale="en" />;
}
