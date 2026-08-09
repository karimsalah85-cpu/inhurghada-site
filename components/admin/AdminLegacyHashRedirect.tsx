"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLegacyHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (window.location.hash === "#operations") router.replace("/admin/operations");
  }, [router]);
  return null;
}
