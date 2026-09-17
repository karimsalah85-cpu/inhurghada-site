import Image from "next/image";
import Link from "next/link";
import { Check, Clock, MapPin, Star } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import ImageWatermark from "@/components/media/ImageWatermark";
import { cardInclusions, cardPriceUnit } from "@/lib/tour-card-details";
import FavouriteButton from "@/components/favourites/FavouriteButton";
import { localizeProductBadge } from "@/lib/public-interface-i18n";
import type { Currency } from "@/components/settings/SiteSettingsContext";
import type { DestinationSlug } from "@/lib/destinations";

type TourCardProps = {
  image: string;
  title: string;
  price: string;
  originalPrice?: string;
  rating: string;
  link: string;
  location: string;
  duration: string;
  description?: string;
  included?: string[];
  badge?: string;
  reviews?: string;
  category?: string;
  availableTime?: string;
  priceUnit?: string;
  bookingMode?: "direct" | "inquiry";
  entrancePrice?: number;
  currency?: Currency;
  tourSlug: string;
  destination?: DestinationSlug;
};

const cardCopy = {
  en: { request: "Request price", from: "From", entrance: "entrance from", person: "person", inquire: "View & inquire", book: "Check availability", newTour: "New tour", reviews: "reviews" },
  ar: { request: "اطلب السعر", from: "ابتداءً من", entrance: "رسوم الدخول من", person: "للشخص", inquire: "التفاصيل والاستفسار", book: "تحقق من التوفر", newTour: "رحلة جديدة", reviews: "تقييمات" },
  de: { request: "Preis anfragen", from: "Ab", entrance: "Eintritt ab", person: "Person", inquire: "Ansehen & anfragen", book: "Verfügbarkeit prüfen", newTour: "Neue Tour", reviews: "Bewertungen" },
  ru: { request: "Запросить цену", from: "От", entrance: "вход от", person: "чел.", inquire: "Подробнее и запрос", book: "Проверить доступность", newTour: "Новый тур", reviews: "отзывов" },
  pl: { request: "Zapytaj o cenę", from: "Od", entrance: "wstęp od", person: "osoba", inquire: "Zobacz i zapytaj", book: "Sprawdź dostępność", newTour: "Nowa wycieczka", reviews: "opinii" },
  zh: { request: "咨询价格", from: "起价", entrance: "门票起价", person: "每人", inquire: "查看并咨询", book: "查看可订情况", newTour: "新行程", reviews: "条评价" },
} as const;

export default function TourCard({
  image,
  title,
  price,
  originalPrice,
  rating,
  link,
  location,
  duration,
  description,
  included,
  badge,
  reviews,
  category,
  availableTime,
  priceUnit,
  bookingMode,
  entrancePrice,
  currency,
  tourSlug,
  destination,
}: TourCardProps) {
  const { formatPrice, language } = useSiteSettings();
  const copy = cardCopy[language];
  const reviewCount = Number(reviews);
  const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0 && Number.isFinite(Number(rating)) && Number(rating) > 0;
  const hasDiscount = Boolean(originalPrice) && Number(originalPrice) > Number(price);
  const { pickup, inclusion } = cardInclusions(included);

  return (
    <article className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-lg transition duration-300 has-[a:focus-visible]:ring-4 has-[a:focus-visible]:ring-ocean-soft md:hover:-translate-y-1 md:hover:shadow-2xl">
      <div className="absolute end-3 top-3 z-20">
        <FavouriteButton item={{ slug: tourSlug, title, image, location, price, originalPrice, rating, reviews, duration, description, priceUnit, availableTime, bookingMode, entrancePrice, currency, destination, badge, category }} compact />
      </div>
      <Link href={link} aria-label={title} className="group flex min-w-0 flex-1 flex-col outline-none">
        <div className="relative aspect-[8/5] w-full shrink-0 overflow-hidden">
          <Image src={image} alt={title} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
          <ImageWatermark />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          {badge ? <span className="absolute bottom-3 start-3 max-w-[calc(100%-1.5rem)] rounded-full bg-brand-navy px-3 py-1.5 text-sm font-semibold text-white">{localizeProductBadge(language, badge)}</span> : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-5">
          {category ? <p className="text-xs font-bold uppercase tracking-[0.2em] text-ocean-dark">{category}</p> : null}
          <h3 className="mt-1.5 line-clamp-2 text-lg font-bold leading-tight text-ink sm:text-2xl">{title}</h3>
          <div className="mt-2 flex items-start gap-2 text-sm text-muted"><MapPin size={16} className="shrink-0" /><span>{location}</span></div>
          <p className="mt-2 text-sm font-semibold">
            {hasReviews
              ? <span className="inline-flex items-center gap-1.5 text-ink"><Star size={15} className="fill-yellow-400 text-yellow-400" />{rating} · {reviewCount} {copy.reviews}</span>
              : <span className="text-brand-orange-cta">{copy.newTour}</span>}
          </p>
          {description?.trim() ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted">{description}</p> : null}
          {duration ? <div className="mt-2 flex items-start gap-2 text-sm text-muted"><Clock size={16} className="shrink-0" /><span>{duration}</span></div> : null}
          {pickup ? <p className="mt-1.5 line-clamp-2 text-sm text-muted">{pickup}</p> : null}
          {inclusion ? <p className="mt-1.5 flex items-start gap-2 text-sm text-muted"><Check size={16} className="shrink-0" /><span className="line-clamp-2">{inclusion}</span></p> : null}
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between gap-2 border-t border-line pt-3 sm:flex-col sm:items-stretch sm:gap-3">
              <div className="min-w-0 flex-1">{bookingMode === "inquiry" ? <p className="text-lg font-bold text-ink">{copy.request}</p> : <>
                {hasDiscount ? <p className="text-xs text-muted line-through">{formatPrice(originalPrice as string, currency)}</p> : null}
                <p className="text-sm leading-6 text-muted"><span>{copy.from}</span>{" "}<strong className="text-xl font-bold text-ink sm:text-2xl"><bdi>{formatPrice(price, currency)}</bdi></strong>{" "}<span>{cardPriceUnit(priceUnit, language)}</span></p>
                {entrancePrice !== undefined ? <p className="mt-1 text-xs font-bold text-ocean-dark">+ {copy.entrance} {formatPrice(String(entrancePrice), currency)}/{copy.person}</p> : null}
              </>}</div>
              <span className={`flex min-h-11 w-1/2 shrink-0 items-center justify-center rounded-xl px-2 sm:w-full sm:px-3 py-2.5 text-center text-sm font-semibold text-white transition ${bookingMode === "inquiry" ? "bg-ocean-dark group-hover:brightness-90" : "bg-brand-orange-cta group-hover:brightness-90"}`}>{bookingMode === "inquiry" ? copy.inquire : copy.book}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
