import type { Tour } from "@/data/tours";
import type { Locale } from "@/lib/i18n";

type SafeMedia = { image: string; alt: Record<Locale, string> };

const categoryMedia: Record<string, SafeMedia> = {
  quad: { image: "/images/placeholders/quad-safari.svg", alt: { en: "Illustrated placeholder for a quad bike desert safari", ar: "رسم توضيحي مؤقت لرحلة سفاري بالدراجة الرباعية في الصحراء", de: "Illustrierter Platzhalter für eine Quad-Safari in der Wüste", ru: "Иллюстрированная заглушка для сафари на квадроциклах в пустыне", pl: "Ilustrowana grafika zastępcza dla pustynnego safari na quadach", zh: "沙漠四轮摩托之旅插画占位图" } },
  senzo: { image: "/images/placeholders/senzo-transfer.svg", alt: { en: "Illustrated placeholder for a private Senzo Mall transfer", ar: "رسم توضيحي مؤقت لانتقال خاص إلى سنزو مول", de: "Illustrierter Platzhalter für einen privaten Transfer zur Senzo Mall", ru: "Иллюстрированная заглушка для частного трансфера в Senzo Mall", pl: "Ilustrowana grafika zastępcza dla prywatnego transferu do Senzo Mall", zh: "Senzo Mall 私人接送插画占位图" } },
  dolphin: { image: "/images/placeholders/dolphin-house.svg", alt: { en: "Illustrated placeholder for a Dolphin House snorkeling boat trip; wildlife sightings are not guaranteed", ar: "رسم توضيحي مؤقت لرحلة قارب للغطس في دولفين هاوس؛ مشاهدة الدلافين غير مضمونة", de: "Illustrierter Platzhalter für eine Schnorchelfahrt zum Dolphin House; Wildtiersichtungen sind nicht garantiert", ru: "Иллюстрированная заглушка для снорклинг-тура в Dolphin House; встречи с дельфинами не гарантированы", pl: "Ilustrowana grafika zastępcza dla rejsu snorkelingowego do Dolphin House; obserwacje delfinów nie są gwarantowane", zh: "海豚屋浮潜船行程插画占位图；不保证看到野生海豚" } },
  horse: { image: "/images/placeholders/horse-riding.svg", alt: { en: "Illustrated placeholder for a guided horse-riding experience", ar: "رسم توضيحي مؤقت لتجربة ركوب خيل بصحبة مرشد", de: "Illustrierter Platzhalter für einen geführten Ausritt", ru: "Иллюстрированная заглушка для конной прогулки с гидом", pl: "Ilustrowana grafika zastępcza dla jazdy konnej z przewodnikiem", zh: "向导陪同骑马体验插画占位图" } },
  cairo: { image: "/images/placeholders/cairo-giza.svg", alt: { en: "Illustrated placeholder for a Cairo and Giza cultural day trip", ar: "رسم توضيحي مؤقت لرحلة ثقافية إلى القاهرة والجيزة", de: "Illustrierter Platzhalter für einen Kulturausflug nach Kairo und Gizeh", ru: "Иллюстрированная заглушка для культурной поездки в Каир и Гизу", pl: "Ilustrowana grafika zastępcza dla wycieczki kulturowej do Kairu i Gizy", zh: "开罗和吉萨文化一日游插画占位图" } },
  elGouna: { image: "/images/placeholders/el-gouna.svg", alt: { en: "Illustrated placeholder for an El Gouna lagoon and city tour", ar: "رسم توضيحي مؤقت لجولة البحيرات والمدينة في الجونة", de: "Illustrierter Platzhalter für eine Lagunen- und Stadttour in El Gouna", ru: "Иллюстрированная заглушка для тура по лагунам и городу Эль-Гуна", pl: "Ilustrowana grafika zastępcza dla wycieczki po lagunach i mieście El Gouna", zh: "埃尔古纳泻湖与城市游插画占位图" } },
  spa: { image: "/images/placeholders/wellness-spa.svg", alt: { en: "Illustrated placeholder for a Turkish bath and wellness experience", ar: "رسم توضيحي مؤقت لتجربة الحمام التركي والعناية الصحية", de: "Illustrierter Platzhalter für ein Hamam- und Wellness-Erlebnis", ru: "Иллюстрированная заглушка для турецкой бани и спа", pl: "Ilustrowana grafika zastępcza dla łaźni tureckiej i spa", zh: "土耳其浴与康体体验插画占位图" } },
};

const mediaBySlug: Record<string, SafeMedia> = {
  "quad-safari-morning": categoryMedia.quad, "quad-safari-sunset": categoryMedia.quad,
  "senzo-transfer": categoryMedia.senzo, "dolphin-house-snorkeling": categoryMedia.dolphin,
  "horse-riding-sea-desert": categoryMedia.horse, "sahl-hasheesh-horse-riding": categoryMedia.horse,
  "cairo-giza-day-trip-bus": categoryMedia.cairo, "cairo-day-trip-flight": categoryMedia.cairo,
  "el-gouna-city-boat-tour": categoryMedia.elGouna, "turkish-bath-spa": categoryMedia.spa,
};

export function applyTourMediaSafety(tour: Tour, locale: Locale = "en"): Tour {
  const safe = mediaBySlug[tour.slug];
  if (!safe) return tour;
  return { ...tour, image: safe.image, imageAlt: safe.alt[locale], imageFocalPoint: { x: 0.5, y: 0.5 }, galleryImages: [], galleryImageAlts: [], galleryImageFocalPoints: [] };
}

export const applyTourCollectionMediaSafety = (tours: Tour[], locale: Locale = "en") => tours.map((tour) => applyTourMediaSafety(tour, locale));
