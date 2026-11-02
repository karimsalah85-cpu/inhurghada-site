import type { Metadata } from "next";
import TransfersPage from "@/components/pages/TransfersPage";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/i18n";
import { transferCopy } from "@/lib/transfer-copy";

export const metadata: Metadata = {
  ...pageMetadata({
    title: transferCopy.en.title,
    description: transferCopy.en.description,
    path: "/transfers",
    image: "/images/owned/hurghada-transfer-road-sunset.jpg",
  }),
  alternates: { canonical: "/transfers", languages: { ...languageAlternates("/transfers"), "x-default": "/transfers" } },
};

export default function Page() {
  return <TransfersPage />;
}
