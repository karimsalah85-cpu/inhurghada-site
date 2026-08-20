import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, ShieldCheck, Star } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import ImageWatermark from "@/components/media/ImageWatermark";
import { localizeProductBadge } from "@/lib/public-interface-i18n";
import type { Currency } from "@/components/settings/SiteSettingsContext";

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
};

const cardCopy = {
  en: { fallback: "Hurghada experience", pickup: "Pickup", inquiry: "Price and pickup on request", clear: "Clear price · pickup confirmed", quotation: "Quotation", request: "Request price", from: "From", perPerson: "per person", entrance: "entrance from", person: "person", inquire: "View & inquire", book: "View & book" },
  ar: { fallback: "تجربة في الغردقة", pickup: "الاستلام", inquiry: "السعر والاستلام عند الطلب", clear: "سعر واضح · تأكيد الاستلام", quotation: "عرض سعر", request: "اطلب السعر", from: "ابتداءً من", perPerson: "للشخص", entrance: "رسوم الدخول من", person: "للشخص", inquire: "التفاصيل والاستفسار", book: "التفاصيل والحجز" },
  de: { fallback: "Hurghada-Erlebnis", pickup: "Abholung", inquiry: "Preis und Abholung auf Anfrage", clear: "Klarer Preis · Abholung bestätigt", quotation: "Angebot", request: "Preis anfragen", from: "Ab", perPerson: "pro Person", entrance: "Eintritt ab", person: "Person", inquire: "Ansehen & anfragen", book: "Ansehen & buchen" },
  ru: { fallback: "Экскурсия в Хургаде", pickup: "Трансфер", inquiry: "Цена и трансфер по запросу", clear: "Понятная цена · трансфер подтверждается", quotation: "Расчёт", request: "Запросить цену", from: "От", perPerson: "за человека", entrance: "вход от", person: "чел.", inquire: "Подробнее и запрос", book: "Подробнее и бронирование" },
  pl: { fallback: "Atrakcja w Hurghadzie", pickup: "Odbiór", inquiry: "Cena i odbiór na zapytanie", clear: "Jasna cena · potwierdzony odbiór", quotation: "Wycena", request: "Zapytaj o cenę", from: "Od", perPerson: "za osobę", entrance: "wstęp od", person: "osoba", inquire: "Zobacz i zapytaj", book: "Zobacz i zarezerwuj" },
  zh: { fallback: "赫尔格达体验", pickup: "接送", inquiry: "价格和接送需咨询", clear: "价格透明 · 接送已确认", quotation: "报价", request: "咨询价格", from: "起价", perPerson: "每人", entrance: "门票起价", person: "每人", inquire: "查看并咨询", book: "查看并预订" },
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
}: TourCardProps) {
  const { formatPrice, t, language } = useSiteSettings();
  const copy = cardCopy[language];
  const reviewCount = Number(reviews);
  const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition duration-300 md:hover:-translate-y-2 md:hover:shadow-2xl">
      <Link href={link} className="group block">
        <div className="relative h-60 overflow-hidden sm:h-64">
          <Image src={image} alt={title} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
          <ImageWatermark />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          {hasReviews ? <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white px-3 py-2 text-sm shadow"><Star size={16} className="fill-yellow-400 text-yellow-400" /><span className="font-semibold">{rating} · {reviewCount}</span></div> : null}
          <span className="absolute bottom-4 start-4 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white">{localizeProductBadge(language, badge ?? "Best Seller")}</span>
        </div>
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">{category || copy.fallback}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{title}</h3>
          <div className="mt-3 flex items-center gap-2 text-slate-500"><MapPin size={18} /><span>{location}</span></div>
          <p className="mt-4 line-clamp-3 leading-relaxed text-slate-600">{description}</p>
          <div className="mt-5 flex items-center gap-2 text-slate-500"><Clock size={18} /><span>{t("everyDay")} · {duration}</span></div>
          {availableTime ? <p className="mt-3 text-sm text-slate-500">{copy.pickup}: {availableTime}</p> : null}
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700"><ShieldCheck size={17} />{bookingMode === "inquiry" ? copy.inquiry : copy.clear}</p>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>{bookingMode === "inquiry" ? <><p className="text-sm text-slate-500">{copy.quotation}</p><p className="text-xl font-bold text-blue-700">{copy.request}</p></> : <><p className="text-sm text-slate-500">{copy.from}</p>{originalPrice && Number(originalPrice) > Number(price) ? <p className="text-sm font-semibold text-slate-400 line-through">{formatPrice(originalPrice, currency)}</p> : null}<p className="text-3xl font-bold text-blue-700">{formatPrice(price, currency)}</p><p className="mt-1 text-xs text-slate-500">{priceUnit || copy.perPerson}</p>{entrancePrice !== undefined ? <p className="mt-2 text-xs font-bold text-amber-700">+ {copy.entrance} {formatPrice(String(entrancePrice), currency)}/{copy.person}</p> : null}</>}</div>
            <span className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition group-hover:bg-blue-800">{bookingMode === "inquiry" ? copy.inquire : copy.book}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
