import type { Tour } from "@/data/tours";
import type { Locale } from "@/lib/i18n";

type SafeMedia = {
  image: string;
  alt: Record<Locale, string>;
  focal?: { x: number; y: number };
  gallery?: string[];
  galleryAlts?: Record<Locale, string[]>;
};

const localizedAlt = (en: string): Record<Locale, string> => ({ en, ar: en, de: en, ru: en, pl: en, zh: en });

const ownedMedia: Record<string, SafeMedia> = {
  dolphin: {
    image: "/images/owned/dolphin-house-pod.jpg",
    alt: localizedAlt("Wild dolphins swimming in clear Red Sea water; sightings on wildlife trips are not guaranteed"),
    gallery: ["/images/owned/dolphin-house-close.jpg", "/images/owned/dolphin-house-portrait.jpg", "/images/owned/dolphin-house-pair.jpg"],
    galleryAlts: { en: ["A pod of dolphins swimming near the surface", "A dolphin swimming toward the camera with snorkellers above", "Two dolphins swimming together in clear water"], ar: [], de: [], ru: [], pl: [], zh: [] },
  },
  senzo: { image: "/images/owned/senzo-mall.jpg", alt: localizedAlt("Senzo Mall shopping, dining and indoor public areas") },
  cairo: {
    image: "/images/owned/cairo-giza-day.jpg", alt: localizedAlt("The Giza pyramids seen across Cairo in daylight"), focal: { x: 0.45, y: 0.58 },
    gallery: ["/images/owned/cairo-giza-night.jpg"], galleryAlts: { en: ["The Giza pyramids illuminated at night beyond Cairo rooftops"], ar: [], de: [], ru: [], pl: [], zh: [] },
  },
  quadMorning: { image: "/images/owned/quad-safari-morning.jpg", alt: localizedAlt("Guests riding red quad bikes on a desert safari") },
  speedboat: {
    image: "/images/owned/speedboat-action-wide.jpg", alt: localizedAlt("A Daily Red Sea speedboat carrying guests across clear Red Sea water"),
    gallery: ["/images/owned/speedboat-action.jpg", "/images/owned/speedboat-guests.jpg", "/images/owned/speedboat-shallows.jpg", "/images/owned/speedboat-marina.jpg"],
    galleryAlts: { en: ["A speedboat travelling across turquoise water", "Guests enjoying a Red Sea speedboat trip", "A white speedboat moored in shallow clear water", "Speedboats moored in a Red Sea marina"], ar: [], de: [], ru: [], pl: [], zh: [] },
  },
  diving: {
    image: "/images/owned/red-sea-diver-coral.jpg", alt: localizedAlt("Scuba diver beside a colourful Red Sea coral reef"),
    gallery: ["/images/owned/red-sea-diver-fish.jpg", "/images/owned/red-sea-diver.jpg", "/images/owned/red-sea-diver-reef.jpg", "/images/owned/diving-group-surface.jpg", "/images/owned/red-sea-coral-closeup.jpg"],
    galleryAlts: { en: ["Scuba diver surrounded by small reef fish", "Scuba diver underwater in the Red Sea", "Scuba diver swimming above a coral reef", "A group of scuba divers at the surface beside a dive boat", "Red Sea coral with small reef fish"], ar: [], de: [], ru: [], pl: [], zh: [] },
  },
  diveTraining: {
    image: "/images/owned/diving-training-seabed.jpg", alt: localizedAlt("Scuba students practising skills with instructors underwater"),
    gallery: ["/images/owned/diving-training-instructor.jpg", "/images/owned/diving-group-surface.jpg", "/images/owned/red-sea-coral-closeup.jpg"],
    galleryAlts: { en: ["A diving instructor supervising an underwater training exercise", "A group of scuba divers at the surface beside a dive boat", "Red Sea coral with small reef fish"], ar: [], de: [], ru: [], pl: [], zh: [] },
  },
  mahmya: { image: "/images/owned/mahmya-boats-sunset.jpg", alt: localizedAlt("Mahmya excursion boats moored on the Red Sea at sunset"), focal: { x: 0.5, y: 0.62 } },
};

const categoryMedia: Record<string, SafeMedia> = {
  sea: { image: "/images/placeholders/sea-activity.svg", alt: { en: "Illustrated placeholder for a Red Sea activity", ar: "رسم توضيحي مؤقت لنشاط في البحر الأحمر", de: "Illustrierter Platzhalter für eine Aktivität am Roten Meer", ru: "Иллюстрированная заглушка для отдыха на Красном море", pl: "Ilustrowana grafika zastępcza dla atrakcji nad Morzem Czerwonym", zh: "红海活动插画占位图" } },
  island: { image: "/images/placeholders/island-trip.svg", alt: { en: "Illustrated placeholder for a Red Sea island trip", ar: "رسم توضيحي مؤقت لرحلة جزيرة في البحر الأحمر", de: "Illustrierter Platzhalter für einen Inselausflug am Roten Meer", ru: "Иллюстрированная заглушка для поездки на остров Красного моря", pl: "Ilustrowana grafika zastępcza dla wycieczki na wyspę Morza Czerwonego", zh: "红海海岛游插画占位图" } },
  diving: { image: "/images/placeholders/diving.svg", alt: { en: "Illustrated placeholder for a Red Sea diving experience", ar: "رسم توضيحي مؤقت لتجربة غوص في البحر الأحمر", de: "Illustrierter Platzhalter für ein Taucherlebnis am Roten Meer", ru: "Иллюстрированная заглушка для дайвинга в Красном море", pl: "Ilustrowana grafika zastępcza dla nurkowania w Morzu Czerwonym", zh: "红海潜水体验插画占位图" } },
  desert: { image: "/images/placeholders/desert-experience.svg", alt: { en: "Illustrated placeholder for a Hurghada desert experience", ar: "رسم توضيحي مؤقت لتجربة في صحراء الغردقة", de: "Illustrierter Platzhalter für ein Wüstenerlebnis in Hurghada", ru: "Иллюстрированная заглушка для поездки в пустыню Хургады", pl: "Ilustrowana grafika zastępcza dla atrakcji na pustyni w Hurghadzie", zh: "赫尔格达沙漠体验插画占位图" } },
  transfer: { image: "/images/placeholders/private-transfer.svg", alt: { en: "Illustrated placeholder for a private transfer", ar: "رسم توضيحي مؤقت لخدمة توصيل خاصة", de: "Illustrierter Platzhalter für einen privaten Transfer", ru: "Иллюстрированная заглушка для частного трансфера", pl: "Ilustrowana grafika zastępcza dla prywatnego transferu", zh: "私人接送插画占位图" } },
  culture: { image: "/images/placeholders/cultural-trip.svg", alt: { en: "Illustrated placeholder for an Egyptian cultural day trip", ar: "رسم توضيحي مؤقت لرحلة ثقافية في مصر", de: "Illustrierter Platzhalter für einen kulturellen Tagesausflug in Ägypten", ru: "Иллюстрированная заглушка для культурной поездки по Египту", pl: "Ilustrowana grafika zastępcza dla wycieczki kulturowej po Egipcie", zh: "埃及文化一日游插画占位图" } },
  quad: { image: "/images/placeholders/quad-safari.svg", alt: { en: "Illustrated placeholder for a quad bike desert safari", ar: "رسم توضيحي مؤقت لرحلة سفاري بالدراجة الرباعية في الصحراء", de: "Illustrierter Platzhalter für eine Quad-Safari in der Wüste", ru: "Иллюстрированная заглушка для сафари на квадроциклах в пустыне", pl: "Ilustrowana grafika zastępcza dla pustynnego safari na quadach", zh: "沙漠四轮摩托之旅插画占位图" } },
  senzo: { image: "/images/placeholders/senzo-transfer.svg", alt: { en: "Illustrated placeholder for a private Senzo Mall transfer", ar: "رسم توضيحي مؤقت لانتقال خاص إلى سنزو مول", de: "Illustrierter Platzhalter für einen privaten Transfer zur Senzo Mall", ru: "Иллюстрированная заглушка для частного трансфера в Senzo Mall", pl: "Ilustrowana grafika zastępcza dla prywatnego transferu do Senzo Mall", zh: "Senzo Mall 私人接送插画占位图" } },
  dolphin: { image: "/images/placeholders/dolphin-house.svg", alt: { en: "Illustrated placeholder for a Dolphin House snorkeling boat trip; wildlife sightings are not guaranteed", ar: "رسم توضيحي مؤقت لرحلة قارب للغطس في دولفين هاوس؛ مشاهدة الدلافين غير مضمونة", de: "Illustrierter Platzhalter für eine Schnorchelfahrt zum Dolphin House; Wildtiersichtungen sind nicht garantiert", ru: "Иллюстрированная заглушка для снорклинг-тура в Dolphin House; встречи с дельфинами не гарантированы", pl: "Ilustrowana grafika zastępcza dla rejsu snorkelingowego do Dolphin House; obserwacje delfinów nie są gwarantowane", zh: "海豚屋浮潜船行程插画占位图；不保证看到野生海豚" } },
  horse: { image: "/images/placeholders/horse-riding.svg", alt: { en: "Illustrated placeholder for a guided horse-riding experience", ar: "رسم توضيحي مؤقت لتجربة ركوب خيل بصحبة مرشد", de: "Illustrierter Platzhalter für einen geführten Ausritt", ru: "Иллюстрированная заглушка для конной прогулки с гидом", pl: "Ilustrowana grafika zastępcza dla jazdy konnej z przewodnikiem", zh: "向导陪同骑马体验插画占位图" } },
  cairo: { image: "/images/placeholders/cairo-giza.svg", alt: { en: "Illustrated placeholder for a Cairo and Giza cultural day trip", ar: "رسم توضيحي مؤقت لرحلة ثقافية إلى القاهرة والجيزة", de: "Illustrierter Platzhalter für einen Kulturausflug nach Kairo und Gizeh", ru: "Иллюстрированная заглушка для культурной поездки в Каир и Гизу", pl: "Ilustrowana grafika zastępcza dla wycieczki kulturowej do Kairu i Gizy", zh: "开罗和吉萨文化一日游插画占位图" } },
  elGouna: { image: "/images/placeholders/el-gouna.svg", alt: { en: "Illustrated placeholder for an El Gouna lagoon and city tour", ar: "رسم توضيحي مؤقت لجولة البحيرات والمدينة في الجونة", de: "Illustrierter Platzhalter für eine Lagunen- und Stadttour in El Gouna", ru: "Иллюстрированная заглушка для тура по лагунам и городу Эль-Гуна", pl: "Ilustrowana grafika zastępcza dla wycieczki po lagunach i mieście El Gouna", zh: "埃尔古纳泻湖与城市游插画占位图" } },
  spa: { image: "/images/placeholders/wellness-spa.svg", alt: { en: "Illustrated placeholder for a Turkish bath and wellness experience", ar: "رسم توضيحي مؤقت لتجربة الحمام التركي والعناية الصحية", de: "Illustrierter Platzhalter für ein Hamam- und Wellness-Erlebnis", ru: "Иллюстрированная заглушка для турецкой бани и спа", pl: "Ilustrowana grafika zastępcza dla łaźni tureckiej i spa", zh: "土耳其浴与康体体验插画占位图" } },
};

const mediaBySlug: Record<string, SafeMedia> = {
  "quad-safari-morning": ownedMedia.quadMorning, "quad-safari-sunset": categoryMedia.quad,
  "senzo-transfer": ownedMedia.senzo, "dolphin-house-snorkeling": ownedMedia.dolphin,
  "horse-riding-sea-desert": categoryMedia.horse, "sahl-hasheesh-horse-riding": categoryMedia.horse,
  "cairo-giza-day-trip-bus": ownedMedia.cairo, "cairo-day-trip-flight": ownedMedia.cairo,
  "el-gouna-city-boat-tour": categoryMedia.elGouna, "turkish-bath-spa": categoryMedia.spa,
  "dolphin-house-marsa-alam": categoryMedia.dolphin,
  "marsa-mubarak-snorkeling": categoryMedia.island,
  "abu-dabbab-snorkeling": categoryMedia.island,
  "beginner-scuba-diving": ownedMedia.diveTraining,
  "padi-open-water-course": ownedMedia.diveTraining,
  "ssi-open-water-course": ownedMedia.diveTraining,
};

const localizedGalleryAlts = (media: SafeMedia, locale: Locale) => {
  const english = media.galleryAlts?.en || [];
  const translated = media.galleryAlts?.[locale] || [];
  return english.map((alt, index) => translated[index] || alt);
};

export function applyTourMediaSafety(tour: Tour, locale: Locale = "en"): Tour {
  const category = `${tour.category || ""} ${tour.title}`.toLowerCase();
  const safe = mediaBySlug[tour.slug]
    || (/speedboat/.test(category) ? ownedMedia.speedboat
      : /diving|scuba/.test(category) ? ownedMedia.diving
      : /mahmya/.test(category) ? ownedMedia.mahmya
      : /transfer/.test(category) ? categoryMedia.transfer
      : /diving|scuba|underwater|submarine/.test(category) ? categoryMedia.diving
      : /island|snorkel|boat|speedboat|sea/.test(category) ? categoryMedia.island
      : /desert|safari|quad|camel|stargaz/.test(category) ? categoryMedia.desert
      : /luxor|cairo|cultural/.test(category) ? categoryMedia.culture
      : categoryMedia.sea);
  const galleryImages = safe.gallery || [];
  return { ...tour, image: safe.image, imageAlt: safe.alt[locale], imageFocalPoint: safe.focal || { x: 0.5, y: 0.5 }, galleryImages, galleryImageAlts: localizedGalleryAlts(safe, locale), galleryImageFocalPoints: galleryImages.map(() => ({ x: 0.5, y: 0.5 })) };
}

export const applyTourCollectionMediaSafety = (tours: Tour[], locale: Locale = "en") => tours.map((tour) => applyTourMediaSafety(tour, locale));
