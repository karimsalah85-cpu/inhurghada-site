"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Search, ArrowRight } from "lucide-react";
import type { Tour } from "@/data/tours";
import { destinations } from "@/lib/destinations";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath, type Locale } from "@/lib/i18n";
import { filterTours } from "@/lib/tour-search";
import { trackEvent } from "@/lib/analytics";

const copy: Record<Locale, { placeholder: string; button: string; destinations: string; thingsToDo: string; popular: string; seeAll: (query: string) => string; noMatch: string; tours: string; from: string; label: string }> = {
  en: { placeholder: "Find places and things to do", button: "Search", destinations: "Destinations", thingsToDo: "Things to do", popular: "Popular right now", seeAll: (q) => `See all results for “${q}”`, noMatch: "No exact match. Browse all tours", tours: "tours", from: "from", label: "Search tours and destinations" },
  de: { placeholder: "Orte und Aktivitäten finden", button: "Suchen", destinations: "Reiseziele", thingsToDo: "Aktivitäten", popular: "Gerade beliebt", seeAll: (q) => `Alle Ergebnisse für „${q}“`, noMatch: "Kein genauer Treffer. Alle Ausflüge ansehen", tours: "Ausflüge", from: "ab", label: "Ausflüge und Reiseziele suchen" },
  ru: { placeholder: "Найдите места и развлечения", button: "Найти", destinations: "Направления", thingsToDo: "Экскурсии", popular: "Популярно сейчас", seeAll: (q) => `Все результаты по запросу «${q}»`, noMatch: "Точных совпадений нет. Смотреть все экскурсии", tours: "экскурсий", from: "от", label: "Поиск экскурсий и направлений" },
  ar: { placeholder: "ابحث عن أماكن وأنشطة", button: "بحث", destinations: "الوجهات", thingsToDo: "الأنشطة", popular: "الأكثر طلبًا الآن", seeAll: (q) => `عرض كل النتائج لـ «${q}»`, noMatch: "لا توجد نتيجة مطابقة. تصفح كل الرحلات", tours: "رحلات", from: "من", label: "ابحث عن الرحلات والوجهات" },
  pl: { placeholder: "Znajdź miejsca i atrakcje", button: "Szukaj", destinations: "Kierunki", thingsToDo: "Atrakcje", popular: "Teraz popularne", seeAll: (q) => `Wszystkie wyniki dla „${q}”`, noMatch: "Brak dokładnych wyników. Zobacz wszystkie wycieczki", tours: "wycieczek", from: "od", label: "Szukaj wycieczek i kierunków" },
  zh: { placeholder: "搜索地点和活动", button: "搜索", destinations: "目的地", thingsToDo: "活动", popular: "当前热门", seeAll: (q) => `查看“${q}”的全部结果`, noMatch: "没有完全匹配的结果，浏览全部行程", tours: "个行程", from: "起", label: "搜索行程和目的地" },
};

const popularSlugs = ["orange-bay", "orange-bay-half-day-speedboat", "horse-riding-el-gouna", "hurghada-airport-transfer", "full-day-diving", "quad-safari-sunset"];

type Option =
  | { kind: "destination"; key: string; href: string; name: string; meta: string }
  | { kind: "tour"; key: string; href: string; tour: Tour }
  | { kind: "all"; key: string; href: string; label: string };

function normalize(value: string) {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase().trim();
}

export default function HeroSearch({ tours, className = "" }: { tours: Tour[]; className?: string }) {
  const router = useRouter();
  const { language, formatPrice } = useSiteSettings();
  const text = copy[language as Locale] ?? copy.en;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const trimmed = query.trim();

  const { destinationOptions, tourOptions, allOption } = useMemo(() => {
    const countFor = (slug: string) => tours.filter((tour) => (tour.destinationSlug || "hurghada") === slug).length;
    const q = normalize(trimmed);
    const destinationMatches = destinations
      .filter((destination) => !q || normalize(`${destination.name} ${destination.country} ${destination.region}`).includes(q))
      .slice(0, q ? 3 : 4)
      .map<Option>((destination) => ({
        kind: "destination",
        key: `d-${destination.slug}`,
        href: localePath(language, `/destinations/${destination.slug}`),
        name: destination.name,
        meta: `${destination.country} · ${countFor(destination.slug)} ${text.tours}`,
      }));
    const tourMatches = q
      ? filterTours(tours, trimmed).slice(0, 6)
      : popularSlugs.map((slug) => tours.find((tour) => tour.slug === slug)).filter((tour): tour is Tour => Boolean(tour)).slice(0, 4);
    const tourOpts = tourMatches.map<Option>((tour) => ({ kind: "tour", key: `t-${tour.slug}`, href: localePath(language, `/tours/${tour.slug}`), tour }));
    const all: Option[] = q
      ? [{ kind: "all", key: "all", href: `${localePath(language, "/tours")}?search=${encodeURIComponent(trimmed)}`, label: tourOpts.length ? text.seeAll(trimmed) : text.noMatch }]
      : [];
    return { destinationOptions: destinationMatches, tourOptions: tourOpts, allOption: all };
  }, [language, text, tours, trimmed]);

  const options = [...destinationOptions, ...tourOptions, ...allOption];

  function go(option: Option | undefined) {
    const target = option ?? (trimmed ? { kind: "all" as const, key: "all", href: `${localePath(language, "/tours")}?search=${encodeURIComponent(trimmed)}`, label: "" } : undefined);
    if (!target) {
      setOpen(true);
      inputRef.current?.focus();
      return;
    }
    trackEvent("search", { search_term: trimmed || target.key, selection: target.kind === "tour" ? target.tour.slug : target.key });
    setOpen(false);
    router.push(target.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % Math.max(options.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? options.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(active >= 0 ? options[active] : undefined);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const activeId = active >= 0 && options[active] ? `${listId}-${options[active].key}` : undefined;
  const positionOf = new Map(options.map((option, position) => [option.key, position]));
  const row = (option: Option, children: React.ReactNode) => {
    const current = positionOf.get(option.key) ?? -1;
    return (
      <li key={option.key} id={`${listId}-${option.key}`} role="option" aria-selected={active === current}>
        <a
          href={option.href}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => { event.preventDefault(); go(option); }}
          onMouseEnter={() => setActive(current)}
          className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-left text-ink transition ${active === current ? "bg-surface-muted" : "hover:bg-surface-muted"}`}
        >
          {children}
        </a>
      </li>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(event) => { event.preventDefault(); go(active >= 0 ? options[active] : undefined); }}
        className="flex items-center gap-2 rounded-full border border-white/40 bg-white p-1.5 pl-4 shadow-[0_20px_60px_-20px_rgba(2,6,23,0.6)] sm:p-2 sm:pl-5"
      >
        <Search className="shrink-0 text-ink" size={20} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={text.placeholder}
          aria-label={text.label}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="submit" className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cta to-cta-dark px-5 text-sm font-bold text-white transition hover:brightness-105 focus-visible:ring-4 focus-visible:ring-cta-soft sm:min-h-12 sm:px-7 sm:text-base">
          {text.button}
        </button>
      </form>

      {open && options.length ? (
        <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-[min(70vh,34rem)] overflow-y-auto rounded-3xl border border-line bg-white p-2 text-ink shadow-2xl">
          <ul id={listId} role="listbox" aria-label={text.label} className="grid gap-0.5">
            {destinationOptions.length ? <li role="presentation" className="px-3 pb-1 pt-2 text-[11px] font-black uppercase tracking-[0.16em] text-muted">{text.destinations}</li> : null}
            {destinationOptions.map((option) => option.kind === "destination" && row(option, (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ocean-soft/40 text-ocean-dark"><MapPin size={18} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate font-bold">{option.name}</span><span className="block truncate text-xs text-muted">{option.meta}</span></span>
              </>
            )))}
            {tourOptions.length ? <li role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-black uppercase tracking-[0.16em] text-muted">{trimmed ? text.thingsToDo : text.popular}</li> : null}
            {tourOptions.map((option) => option.kind === "tour" && row(option, (
              <>
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                  {option.tour.image ? <Image src={option.tour.image} alt="" fill sizes="48px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-bold">{option.tour.title}</span>
                  <span className="block truncate text-xs text-muted">{option.tour.location} · {text.from} <bdi className="font-bold text-ink">{formatPrice(option.tour.price, option.tour.currency)}</bdi></span>
                </span>
              </>
            )))}
            {allOption.map((option) => option.kind === "all" && row(option, (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cta/10 text-cta-dark"><Search size={18} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1 font-bold text-cta-dark">{option.label}</span>
                <ArrowRight size={16} className="shrink-0 text-cta-dark" aria-hidden="true" />
              </>
            )))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
