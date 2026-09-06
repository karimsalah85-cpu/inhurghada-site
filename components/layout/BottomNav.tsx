"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, Calendar, Car, Compass, MapPin, MessageCircle, Search, Ticket, Users, X } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/contact";
import { localePath, type Locale } from "@/lib/i18n";
import { tours } from "@/data/tours";

const tourBrowsingRoots = ["/tours", "/destinations", "/hurghada", "/marsa-alam", "/jeddah"];

/** The tour slug when the current page is a tour's own detail page, so Plan can become a direct booking CTA. */
function currentTourSlug(pathname: string, language: Locale) {
  const withoutLocale = language === "en" ? pathname : pathname.replace(new RegExp(`^/${language}(?=/|$)`), "");
  return withoutLocale.match(/^\/tours\/([^/]+)\/?$/)?.[1] ?? null;
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t, formatPrice } = useSiteSettings();
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  const homeHref = localePath(language);
  const toursHref = localePath(language, "/tours");
  const bookingHref = localePath(language, "/booking");
  const transfersHref = localePath(language, "/transfers");

  const isExplore = pathname === homeHref || tourBrowsingRoots.some((root) => pathname.startsWith(localePath(language, root)));
  const isTransfers = pathname.startsWith(transfersHref);
  const isMyTrips = pathname.startsWith(bookingHref);

  const focusedTourSlug = currentTourSlug(pathname, language);
  const focusedTour = focusedTourSlug ? tours.find((tour) => tour.slug === focusedTourSlug) : null;

  const navLabel = t("quickNavigation");

  return (
    <>
      <nav
        aria-label={navLabel}
        className="
        fixed inset-x-0 bottom-0 z-50
        border-t border-line/80 bg-white/75 backdrop-blur-xl
        pb-[env(safe-area-inset-bottom)]
        shadow-[0_-10px_40px_-20px_rgba(15,23,42,0.45)]
        xl:hidden
        "
      >
        <div className="grid grid-cols-5 items-end px-1 pb-1.5 pt-2">
          <BottomNavLink href={toursHref} active={isExplore} icon={<Compass size={22} />} label={t("explore")} />
          <BottomNavLink href={transfersHref} active={isTransfers} icon={<Car size={22} />} label={t("transfers")} />

          <div className="flex flex-col items-center">
            <div className="relative -mt-8 h-14 w-14">
              {focusedTour ? (
                <Link
                  href={`${pathname}#book`}
                  onClick={() => trackEvent("booking_start", { placement: "bottom_nav", tour_slug: focusedTourSlug || undefined })}
                  aria-label={`${t("bookThisTrip")} · ${t("from")} ${formatPrice(focusedTour.price, focusedTour.currency)}`}
                  className="
                  relative flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full
                  bg-brand-orange-cta
                  text-white shadow-lg shadow-brand-orange-cta/30
                  ring-4 ring-white
                  transition active:scale-95
                  "
                >
                  <Calendar size={18} aria-hidden="true" />
                  <span className="text-[10px] font-black leading-none">{formatPrice(focusedTour.price, focusedTour.currency)}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPlanOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={isPlanOpen}
                  aria-label={t("planYourTrip")}
                  className="
                  relative flex h-14 w-14 items-center justify-center rounded-full
                  bg-brand-orange-cta
                  text-white shadow-lg shadow-brand-orange-cta/30
                  ring-4 ring-white
                  transition active:scale-95
                  "
                >
                  <Search size={24} aria-hidden="true" />
                </button>
              )}
            </div>
            <span className="mt-1 text-[11px] font-semibold text-muted">{t("plan")}</span>
          </div>

          <BottomNavLink href={bookingHref} active={isMyTrips} icon={<Ticket size={22} />} label={t("myTrips")} />

          <a
            href={whatsappUrl()}
            onClick={() => trackEvent("whatsapp_click", { placement: "bottom_navigation" })}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-semibold text-green-600"
          >
            <MessageCircle size={20} aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        </div>
      </nav>

      <PlanSheet open={isPlanOpen} onClose={() => setIsPlanOpen(false)} onSearch={(params) => router.push(`${toursHref}?${params.toString()}`)} />
    </>
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
      className={`flex flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-semibold transition ${active ? "text-brand-navy" : "text-muted"}`}
    >
      {icon}
      {active ? <span aria-hidden="true" className="-mb-1 h-1 w-1 rounded-full bg-brand-navy" /> : null}
      <span>{label}</span>
    </Link>
  );
}

function PlanSheet({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: (params: URLSearchParams) => void;
}) {
  const { t } = useSiteSettings();
  const headingId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("1");

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function submit() {
    const selectedDestination = destination.trim();
    if (!selectedDestination) return;
    const params = new URLSearchParams({ destination: selectedDestination });
    if (date) params.set("date", date);
    if (guests) params.set("guests", guests);
    onSearch(params);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end xl:hidden" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full rounded-t-3xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id={headingId} className="text-lg font-black text-ink">{t("planYourTrip")}</h2>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-line p-2 text-muted transition hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <PlanField icon={MapPin} label={t("destination")}>
            <select value={destination} onChange={(event) => setDestination(event.target.value)} aria-label={t("destination")} className="w-full bg-transparent text-sm font-semibold text-ink outline-none">
              <option value="">{t("searchPlaceholder")}</option>
              <option value="hurghada">Hurghada</option>
              <option value="marsa-alam">Marsa Alam</option>
              <option value="jeddah">Jeddah</option>
            </select>
          </PlanField>
          <PlanField icon={Calendar} label={t("travelDate")}>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label={t("travelDate")} className="w-full bg-transparent text-sm font-semibold text-ink outline-none" />
          </PlanField>
          <PlanField icon={Users} label={t("guests")}>
            <input type="number" min="1" value={guests} onChange={(event) => setGuests(event.target.value)} aria-label={t("guests")} className="w-full bg-transparent text-sm font-semibold text-ink outline-none" />
          </PlanField>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!destination.trim()}
          className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-orange-cta px-6 font-bold text-white shadow-lg shadow-brand-orange-cta/30 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("searchTours")} <ArrowRight size={19} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PlanField({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface-muted px-4">
      <Icon className="shrink-0 text-ocean-dark" size={18} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{label}</span>
        <span className="mt-0.5 block">{children}</span>
      </span>
    </label>
  );
}
