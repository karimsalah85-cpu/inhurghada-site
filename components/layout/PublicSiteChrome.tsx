"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import Navbar from "@/components/layout/Navbar";
import SiteAnnouncement from "@/components/layout/SiteAnnouncement";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

export default function PublicSiteChrome() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return <>
    <SiteAnnouncement />
    <Navbar />
    <WhatsAppButton />
    <BottomNav />
  </>;
}
