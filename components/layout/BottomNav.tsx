"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Compass, Home, MessageCircle } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/contact";
import { localePath, type Locale } from "@/lib/i18n";

const tourBrowsingRoots = ["/tours", "/destinations", "/hurghada", "/marsa-alam", "/jeddah"];

/** The tour slug when the current page is a tour's own detail page, so Book can jump straight to its booking form. */
function currentTourSlug(pathname: string, language: Locale) {
  const withoutLocale = language === "en" ? pathname : pathname.replace(new RegExp(`^/${language}(?=/|$)`), "");
  return withoutLocale.match(/^\/tours\/([^/]+)\/?$/)?.[1] ?? null;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { language, t } = useSiteSettings();
  const { items } = useCart();

  const homeHref = localePath(language);
  const toursHref = localePath(language, "/tours");
  const bookingHref = localePath(language, "/booking");
  const transfersHref = localePath(language, "/transfers");

  const isHome = pathname === homeHref;
  const isTours = tourBrowsingRoots.some((root) => pathname.startsWith(localePath(language, root)));
  const isTransfers = pathname.startsWith(transfersHref);

  // Book always targets whatever trip the visitor is currently focused on: the tour
  // page they're viewing, otherwise the trip already waiting in their cart.
  const focusedTourSlug = currentTourSlug(pathname, language);
  const bookHref = focusedTourSlug ? `${pathname}#book` : items.length ? localePath(language, "/checkout") : bookingHref;

  const navLabel = language === "ar" ? "التنقل السريع" : language === "de" ? "Schnellnavigation" : language === "ru" ? "Быстрая навигация" : language === "pl" ? "Szybka nawigacja" : language === "zh" ? "快速导航" : "Quick navigation";
  const bookLabel = language === "ar" ? "احجز" : language === "de" ? "Buchen" : language === "ru" ? "Бронь" : language === "pl" ? "Rezerwuj" : language === "zh" ? "预订" : "Book";

  return (
    <nav
      aria-label={navLabel}
      className="
      fixed inset-x-0 bottom-0 z-50
      border-t border-slate-200/80 bg-white/95 backdrop-blur-xl
      pb-[env(safe-area-inset-bottom)]
      shadow-[0_-10px_40px_-20px_rgba(15,23,42,0.45)]
      xl:hidden
      "
    >
      <div className="grid grid-cols-5 items-end px-1 pb-1.5 pt-2">
        <BottomNavLink href={toursHref} active={isTours} icon={<Compass size={22} />} label={t("tours")} />
        <BottomNavLink href={homeHref} active={isHome} icon={<Home size={22} />} label={t("home")} />

        <div className="flex flex-col items-center">
          <div className="relative -mt-8 h-14 w-14">
            <span aria-hidden="true" className="bottom-nav-ring absolute inset-0 rounded-full bg-orange-500/50" style={{ animationDelay: "0s" }} />
            <span aria-hidden="true" className="bottom-nav-ring absolute inset-0 rounded-full bg-orange-500/50" style={{ animationDelay: "0.7s" }} />
            <span aria-hidden="true" className="bottom-nav-ring absolute inset-0 rounded-full bg-orange-500/50" style={{ animationDelay: "1.4s" }} />
            <Link
              href={bookHref}
              onClick={() => trackEvent("booking_start", { placement: "bottom_nav", tour_slug: focusedTourSlug || undefined })}
              aria-label={t("booking")}
              className="
              relative flex h-14 w-14 items-center justify-center rounded-full
              bg-gradient-to-r from-orange-500 to-orange-600
              font-bold text-white shadow-lg shadow-orange-500/30
              ring-4 ring-white
              transition active:scale-95
              "
            >
              {bookLabel}
            </Link>
          </div>
        </div>

        <BottomNavLink href={transfersHref} active={isTransfers} icon={<Car size={22} />} label={t("transfers")} />

        <a
          href={whatsappUrl()}
          onClick={() => trackEvent("whatsapp_click", { placement: "bottom_navigation" })}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-semibold text-green-600"
        >
          <MessageCircle size={22} />
          <span>WhatsApp</span>
        </a>
      </div>
    </nav>
  );
}

function BottomNavLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-semibold transition ${active ? "text-blue-700" : "text-slate-600"}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
