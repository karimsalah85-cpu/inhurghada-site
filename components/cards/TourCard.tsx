import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, ShieldCheck, Star } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";

type TourCardProps = {
  image: string;
  title: string;
  price: string;
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
};

export default function TourCard({
  image,
  title,
  price,
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
}: TourCardProps) {
  const { formatPrice, t } = useSiteSettings();
  const reviewCount = Number(reviews);
  const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition duration-300 md:hover:-translate-y-2 md:hover:shadow-2xl">
      <Link href={link} className="group block">
        <div className="relative h-60 overflow-hidden sm:h-64">
          <Image src={image} alt={title} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          {hasReviews ? <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white px-3 py-2 text-sm shadow"><Star size={16} className="fill-yellow-400 text-yellow-400" /><span className="font-semibold">{rating} · {reviewCount}</span></div> : null}
          <span className="absolute bottom-4 left-4 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white">{badge ?? t("bestSeller")}</span>
        </div>
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">{category || "Hurghada experience"}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{title}</h3>
          <div className="mt-3 flex items-center gap-2 text-slate-500"><MapPin size={18} /><span>{location}</span></div>
          <p className="mt-4 line-clamp-3 leading-relaxed text-slate-600">{description}</p>
          <div className="mt-5 flex items-center gap-2 text-slate-500"><Clock size={18} /><span>{t("everyDay")} · {duration}</span></div>
          {availableTime ? <p className="mt-3 text-sm text-slate-500">Pickup: {availableTime}</p> : null}
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700"><ShieldCheck size={17} />Clear price · pickup confirmed</p>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div><p className="text-sm text-slate-500">From</p><p className="text-3xl font-bold text-blue-700">{formatPrice(price)}</p><p className="mt-1 text-xs text-slate-500">{priceUnit || "per person"}</p></div>
            <span className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition group-hover:bg-blue-800">View & book</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
