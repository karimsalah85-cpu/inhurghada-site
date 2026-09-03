import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, ShieldCheck, Star } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import ImageWatermark from "@/components/media/ImageWatermark";
import ShareTripButton from "@/components/share/ShareTripButton";
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
  description: string;
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
  en: { fallback: "Red Sea experience", pickup: "Pickup", inquiry: "Price and pickup on request", clear: "Clear price · pickup confirmed", quotation: "Quotation", request: "Request price", from: "From", perPerson: "per person", entrance: "entrance from", person: "person", inquire: "View & inquire", book: "View & book", newTour: "New tour", reviews: "reviews" },
  ar: { fallback: "تجربة على البحر الأحمر", pickup: "الاستلام", inquiry: "السعر والاستلام عند الطلب", clear: "سعر واضح · تأكيد الاستلام", quotation: "عرض سعر", request: "اطلب السعر", from: "ابتداءً من", perPerson: "للشخص", entrance: "رسوم الدخول من", person: "للشخص", inquire: "التفاصيل والاستفسار", book: "التفاصيل والحجز", newTour: "رحلة جديدة", reviews: "تقييمات" },
  de: { fallback: "Erlebnis am Roten Meer", pickup: "Abholung", inquiry: "Preis und Abholung auf Anfrage", clear: "Klarer Preis · Abholung bestätigt", quotation: "Angebot", request: "Preis anfragen", from: "Ab", perPerson: "pro Person", entrance: "Eintritt ab", person: "Person", inquire: "Ansehen & anfragen", book: "Ansehen & buchen", newTour: "Neue Tour", reviews: "Bewertungen" },
  ru: { fallback: "Экскурсия на Красном море", pickup: "Трансфер", inquiry: "Цена и трансфер по запросу", clear: "Понятная цена · трансфер подтверждается", quotation: "Расчёт", request: "Запросить цену", from: "От", perPerson: "за человека", entrance: "вход от", person: "чел.", inquire: "Подробнее и запрос", book: "Подробнее и бронирование", newTour: "Новый тур", reviews: "отзывов" },
  pl: { fallback: "Atrakcja nad Morzem Czerwonym", pickup: "Odbiór", inquiry: "Cena i odbiór na zapytanie", clear: "Jasna cena · potwierdzony odbiór", quotation: "Wycena", request: "Zapytaj o cenę", from: "Od", perPerson: "za osobę", entrance: "wstęp od", person: "osoba", inquire: "Zobacz i zapytaj", book: "Zobacz i zarezerwuj", newTour: "Nowa wycieczka", reviews: "opinii" },
  zh: { fallback: "红海体验", pickup: "接送", inquiry: "价格和接送需咨询", clear: "价格透明 · 接送已确认", quotation: "报价", request: "咨询价格", from: "起价", perPerson: "每人", entrance: "门票起价", person: "每人", inquire: "查看并咨询", book: "查看并预订", newTour: "新行程", reviews: "条评价" },
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
  const { formatPrice, t, language } = useSiteSettings();
  const copy = cardCopy[language];
  const reviewCount = Number(reviews);
  const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0;
  const hasDiscount = Boolean(originalPrice) && Number(originalPrice) > Number(price);
  const discountPct = hasDiscount ? Math.round((1 - Number(price) / Number(originalPrice)) * 100) : 0;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition duration-300 has-[a:focus-visible]:ring-4 has-[a:focus-visible]:ring-cyan-300 md:hover:-translate-y-2 md:hover:shadow-2xl">
      <div className="absolute end-4 top-4 z-20 flex items-center gap-2">
        <ShareTripButton locale={language} tourSlug={tourSlug} tourTitle={title} destination={destination} compact />
        <FavouriteButton item={{ slug: tourSlug, title, image, location, price, originalPrice, rating, reviews, duration, description, priceUnit, availableTime, bookingMode, entrancePrice, currency, destination, badge, category }} compact />
      </div>
      <Link href={link} className="group flex flex-1 flex-col outline-none">
        <div className="relative h-44 overflow-hidden sm:h-64">
          <Image src={image} alt={title} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
          <ImageWatermark />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          {hasReviews ? <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white px-3 py-2 text-sm shadow"><Star size={16} className="fill-yellow-400 text-yellow-400" /><span className="font-semibold">{rating} · {reviewCount}</span></div> : null}
          <div className="absolute bottom-4 start-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-navy px-4 py-2 text-sm font-semibold text-white">{localizeProductBadge(language, badge ?? "Best Seller")}</span>
            {category ? <span className="rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-slate-800">{category}</span> : null}
            {hasDiscount ? <span className="rounded-full bg-slate-900 px-3 py-2 text-sm font-bold text-white">-{discountPct}%</span> : null}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">{category || copy.fallback}</p>
          <h3 className="mt-1.5 line-clamp-2 text-xl font-bold leading-tight text-slate-900 sm:mt-2 sm:text-2xl">{title}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 sm:mt-3 sm:text-base"><MapPin size={17} /><span>{location}</span></div>
          <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-slate-600 sm:mt-4 sm:line-clamp-3 sm:text-base sm:leading-relaxed">{description}</p>
          <p className="mt-3 min-h-[1.25rem] text-sm font-semibold sm:mt-4">
            {hasReviews
              ? <span className="inline-flex items-center gap-1.5 text-slate-700"><Star size={15} className="fill-yellow-400 text-yellow-400" />{rating} · {reviewCount} {copy.reviews}</span>
              : <span className="text-brand-orange-cta">{copy.newTour}</span>}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 sm:text-base"><Clock size={17} /><span>{t("everyDay")} · {duration}</span></div>
          {availableTime ? <p className="mt-2 text-xs text-slate-600 sm:text-sm">{copy.pickup}: {availableTime}</p> : null}
          <p className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-700 sm:text-sm"><ShieldCheck size={16} />{bookingMode === "inquiry" ? copy.inquiry : copy.clear}</p>
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-200 pt-4 sm:mt-6 sm:gap-4">
            <div>{bookingMode === "inquiry" ? <><p className="text-sm text-slate-500">{copy.quotation}</p><p className="text-xl font-bold text-blue-700">{copy.request}</p></> : <><p className="text-sm text-slate-500">{copy.from}</p>{hasDiscount ? <p className="text-sm font-semibold text-slate-500 line-through">{formatPrice(originalPrice as string, currency)}</p> : null}<p className="text-3xl font-bold text-blue-700">{formatPrice(price, currency)}</p><p className="mt-1 text-xs text-slate-500">{priceUnit || copy.perPerson}</p>{entrancePrice !== undefined ? <p className="mt-2 text-xs font-bold text-amber-700">+ {copy.entrance} {formatPrice(String(entrancePrice), currency)}/{copy.person}</p> : null}</>}</div>
            <span className={`rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition sm:px-4 sm:py-3 sm:text-base ${bookingMode === "inquiry" ? "bg-blue-700 group-hover:bg-blue-800" : "bg-brand-orange-cta group-hover:brightness-90"}`}>{bookingMode === "inquiry" ? copy.inquire : copy.book}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
