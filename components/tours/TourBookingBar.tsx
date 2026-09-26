"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/contact";
import type { Tour } from "@/data/tours";

/**
 * Compact, conversion-focused bottom bar for tour/experience detail pages: real price, a direct Book Now CTA, and WhatsApp,
 * in place of the generic nav so the two never overlap. Rendered by TourPageShell with the live (CMS-merged) tour so the
 * "From" price always matches the booking form; never read prices from the static data/tours.ts catalog here.
 */
export default function TourBookingBar({ slug, title, price, currency }: { slug: string; title: string; price: string; currency?: Tour["currency"] }) {
  const pathname = usePathname();
  const { t, formatPrice } = useSiteSettings();

  return (
    <nav
      aria-label={t("booking")}
      className="
      fixed inset-x-0 bottom-0 z-50 xl:hidden
      mobile-glass-nav
      pb-[env(safe-area-inset-bottom)]
      "
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex shrink-0 flex-col leading-tight">
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted">{t("from")}</span>
          <span className="text-lg font-black text-ink">{formatPrice(price, currency)}</span>
        </div>
        <Link
          href={`${pathname}#book`}
          onClick={() => trackEvent("booking_start", { placement: "bottom_nav", tour_slug: slug })}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-orange-cta px-4 font-bold text-white shadow-lg shadow-brand-orange-cta/30 transition active:scale-[0.97]"
        >
          <Calendar size={18} aria-hidden="true" />
          {t("bookThisTrip")}
        </Link>
        <a
          href={whatsappUrl(`Hi! I'm interested in booking ${title}.`)}
          onClick={() => trackEvent("whatsapp_click", { placement: "tour_booking_bar" })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-white shadow-md shadow-green-600/30 transition active:scale-95"
        >
          <MessageCircle size={22} aria-hidden="true" />
        </a>
      </div>
    </nav>
  );
}
