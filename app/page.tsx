"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import Hero from "@/components/home/Hero";
import TourCard from "@/components/cards/TourCard";
import MobileTourCarousel from "@/components/home/MobileTourCarousel";
import ContinuePlanningRail from "@/components/favourites/ContinuePlanningRail";

import { BadgeCheck, MessageCircle, ShieldCheck, Headphones, ArrowRight, Car, Search } from "lucide-react";

import { tours, type Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { googleReviewUrl, whatsappUrl } from "@/lib/contact";
import HurghadaTravelGuide from "@/components/home/HurghadaTravelGuide";
import SocialLinks from "@/components/layout/SocialLinks";
import { localePath } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";
import { filterTours } from "@/lib/tour-search";
import GoogleReviews from "@/components/reviews/GoogleReviews";
import { destinations } from "@/lib/destinations";
import { applyTourCollectionMediaSafety } from "@/lib/tour-media-safety";



export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { t, language } = useSiteSettings();
  const homePath = localePath(language);
  const de = language === "de";
  const ru = language === "ru";
  const ar = language === "ar";
  const zh = language === "zh";
  const pl = language === "pl";
  const sharedLocaleCopy: Record<string, Partial<Record<"ar" | "pl" | "zh", string>>> = {
    "Why Daily Red Sea": { ar: "لماذا Daily Red Sea؟", pl: "Dlaczego Daily Red Sea?", zh: "为什么选择 Daily Red Sea？" },
    "Local knowledge, easy booking, clear support.": { ar: "خبرة محلية وحجز سهل ودعم واضح.", pl: "Lokalna wiedza, łatwa rezerwacja i jasne wsparcie.", zh: "本地经验、轻松预订和清晰支持。" },
    "Carefully selected crews, guides and drivers.": { ar: "أطقم ومرشدون وسائقون مختارون بعناية.", pl: "Starannie wybrane załogi, przewodnicy i kierowcy.", zh: "精心挑选的船员、向导和司机。" },
    "Fast help for pickup, changes and questions.": { ar: "مساعدة سريعة للاستلام والتغييرات والاستفسارات.", pl: "Szybka pomoc w sprawie odbioru, zmian i pytań.", zh: "快速处理接送、变更和咨询。" },
    "Clear communication before your tour.": { ar: "تواصل واضح قبل رحلتك.", pl: "Jasna komunikacja przed wycieczką.", zh: "行程前沟通清晰。" },
    "Your Red Sea adventure, made easy": { ar: "مغامرتك في البحر الأحمر أصبحت أسهل", pl: "Twoja przygoda nad Morzem Czerwonym — prościej", zh: "轻松开启您的红海之旅" },
    "Why travel with us": { ar: "لماذا تسافر معنا؟", pl: "Dlaczego warto podróżować z nami", zh: "为什么选择我们" },
    "Plan with local Red Sea experts": { ar: "خطط مع خبراء البحر الأحمر المحليين", pl: "Planuj z lokalnymi ekspertami Morza Czerwonego", zh: "与红海本地专家一起规划" },
    "Helpful answers": { ar: "إجابات مفيدة", pl: "Pomocne odpowiedzi", zh: "实用解答" },
    "Red Sea excursions FAQ": { ar: "الأسئلة الشائعة عن رحلات البحر الأحمر", pl: "FAQ o wycieczkach nad Morzem Czerwonym", zh: "红海旅游常见问题" },
    "Start planning": { ar: "ابدأ التخطيط", pl: "Zacznij planować", zh: "开始规划" },
    "Ready for your Red Sea adventure?": { ar: "هل أنت مستعد لمغامرة البحر الأحمر؟", pl: "Gotowy na przygodę nad Morzem Czerwonym?", zh: "准备好开启红海之旅了吗？" },
    "Tours, excursions and private transfers for unforgettable days on the Red Sea.": { ar: "رحلات وجولات وتنقلات خاصة لأيام لا تُنسى على البحر الأحمر.", pl: "Wycieczki, rejsy i prywatne transfery na niezapomniane dni nad Morzem Czerwonym.", zh: "游览、行程和私人接送，让您在红海度过难忘的日子。" },
    "Explore": { ar: "استكشف", pl: "Odkrywaj", zh: "探索" },
    "Need help?": { ar: "تحتاج إلى مساعدة؟", pl: "Potrzebujesz pomocy?", zh: "需要帮助？" },
    "Chat on WhatsApp": { ar: "تحدث عبر واتساب", pl: "Napisz na WhatsApp", zh: "通过 WhatsApp 联系" },
    "Contact us": { ar: "تواصل معنا", pl: "Skontaktuj się z nami", zh: "联系我们" },
    "All rights reserved.": { ar: "جميع الحقوق محفوظة.", pl: "Wszelkie prawa zastrzeżone.", zh: "版权所有。" },
  };
  const tr = (en: string, deText: string, ruText: string, arText = sharedLocaleCopy[en]?.ar || en, plText = sharedLocaleCopy[en]?.pl || en, zhText = sharedLocaleCopy[en]?.zh || en) => de ? deText : ru ? ruText : ar ? arText : pl ? plText : zh ? zhText : en;
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const lastWrittenSearch = useRef(urlSearch);
  const toursSection = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (urlSearch === lastWrittenSearch.current) return;
    lastWrittenSearch.current = urlSearch;
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (normalizedSearch === urlSearch) return;

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (normalizedSearch) params.set("search", normalizedSearch);
      else params.delete("search");
      lastWrittenSearch.current = normalizedSearch;
      if (normalizedSearch) trackEvent("search", { search_term: normalizedSearch });
      const query = params.toString();
      router.replace(query ? `${homePath}?${query}` : homePath, { scroll: false });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [homePath, router, search, searchParams, urlSearch]);

  useEffect(() => {
    if (!search.trim()) return;

    const timeoutId = window.setTimeout(() => {
      toursSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const bookingQuery = new URLSearchParams();
  const date = searchParams.get("date");
  const guests = searchParams.get("guests");

  if (date) bookingQuery.set("date", date);
  if (guests) bookingQuery.set("guests", guests);

  const bookingQueryString = bookingQuery.toString();






  const [liveTours, setLiveTours] = useState<Tour[]>(tours);
  useEffect(() => { let active = true; fetch("/api/site-content").then((response) => response.ok ? response.json() : null).then((data) => { if (active && Array.isArray(data?.tours)) setLiveTours(data.tours); }).catch(() => undefined); return () => { active = false; }; }, []);
  const publicTours = applyTourCollectionMediaSafety(liveTours.filter((tour) => tour.listingStatus !== "unlisted" && tour.listingStatus !== "paused"), language);
  const displayTours = publicTours.map((tour) => localizeTour(tour, language));
  const filteredTours = filterTours(displayTours, search);
  const displaySearch = search.replace(/,/g, ", ");

  const tourOrder = ["orange-bay", "full-day-diving", "dolphin-house-marsa-alam", "marsa-mubarak-snorkeling", "basic-diver-jeddah", "jeddah-yacht-sunset-cruise"];
  filteredTours.sort((left, right) => {
    const leftIndex = tourOrder.indexOf(left.slug);
    const rightIndex = tourOrder.indexOf(right.slug);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });
  const homepageTours = filteredTours;
  const destinationDetails: Record<string, { signature: string; startingPrice: string }> = {
    hurghada: { signature: tr("Islands, reefs & desert", "Inseln, Riffe & Wüste", "Острова, рифы и пустыня", "الجزر والشعاب والصحراء", "Wyspy, rafy i pustynia", "海岛、珊瑚礁与沙漠"), startingPrice: "$8" },
    "marsa-alam": { signature: tr("Wild reefs & marine life", "Wilde Riffe & Meeresleben", "Дикие рифы и морская жизнь", "شعاب بكر وحياة بحرية", "Dzikie rafy i życie morskie", "原生态珊瑚礁与海洋生物"), startingPrice: "€45" },
    jeddah: { signature: tr("Coastal diving", "Tauchen an der Küste", "Прибрежный дайвинг", "غوص ساحلي", "Nurkowanie przybrzeżne", "滨海潜水"), startingPrice: "SAR 300" },
  };
  const destinationLocaleCopy: Record<string, { country: string; region: string; tagline: string }> = {
    hurghada: {
      country: tr("Egypt", "Ägypten", "Египет", "مصر", "Egipt", "埃及"),
      region: tr("Red Sea Governorate", "Gouvernement Rotes Meer", "Мухафаза Красное море", "محافظة البحر الأحمر", "Muhafaza Morza Czerwonego", "红海省"),
      tagline: tr("Red Sea tours, transfers, and local experiences", "Ausflüge am Roten Meer, Transfers und lokale Erlebnisse", "Экскурсии, трансферы и местные впечатления на Красном море", "رحلات البحر الأحمر والتنقلات والتجارب المحلية", "Wycieczki nad Morzem Czerwonym, transfery i lokalne atrakcje", "红海旅游、接送和本地体验"),
    },
    "marsa-alam": {
      country: tr("Egypt", "Ägypten", "Египет", "مصر", "Egipt", "埃及"),
      region: tr("Red Sea Governorate", "Gouvernement Rotes Meer", "Мухафаза Красное море", "محافظة البحر الأحمر", "Muhafaza Morza Czerwonego", "红海省"),
      tagline: tr("Untouched reefs, desert landscapes, and southern Red Sea adventures", "Unberührte Riffe, Wüstenlandschaften und Abenteuer im südlichen Roten Meer", "Нетронутые рифы, пустынные пейзажи и приключения на юге Красного моря", "شعاب نقية ومناظر صحراوية ومغامرات جنوب البحر الأحمر", "Dziewicze rafy, pustynne krajobrazy i przygody na południu Morza Czerwonego", "原始珊瑚礁、沙漠景观和红海南部探险"),
    },
    jeddah: {
      country: tr("Saudi Arabia", "Saudi-Arabien", "Саудовская Аравия", "المملكة العربية السعودية", "Arabia Saudyjska", "沙特阿拉伯"),
      region: tr("Makkah Province", "Provinz Mekka", "Провинция Мекка", "منطقة مكة المكرمة", "Prowincja Mekka", "麦加省"),
      tagline: tr("Red Sea diving and coastal experiences in Jeddah", "Tauchen und Küstenerlebnisse in Jeddah", "Дайвинг и прибрежные впечатления в Джидде", "غوص وتجارب ساحلية في جدة", "Nurkowanie i nadmorskie atrakcje w Dżuddzie", "吉达的红海潜水与海岸体验"),
    },
  };






  return (

    <>


      <Hero />

      <section aria-label="Booking benefits" className="border-b border-line bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
          {[tr("Clear prices before you book", "Klare Preise vor der Buchung", "Понятные цены до бронирования", "أسعار واضحة قبل الحجز", "Jasne ceny przed rezerwacją", "预订前价格透明"), tr("Hotel pickup where available", "Hotelabholung, wo verfügbar", "Трансфер из отеля, где доступно", "الاستلام من الفندق عند توفره", "Odbiór z hotelu, gdy dostępny", "可提供酒店接送"), tr("Local help on WhatsApp", "Lokale Hilfe per WhatsApp", "Местная помощь в WhatsApp", "مساعدة محلية عبر واتساب", "Lokalna pomoc na WhatsApp", "WhatsApp 本地协助")].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-bold text-ink"><BadgeCheck className="shrink-0 text-emerald-600" size={20}/>{item}</div>)}
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-semibold uppercase tracking-[0.24em] text-ocean-dark">{de ? "Reiseziele am Roten Meer" : ru ? "Направления Красного моря" : ar ? "وجهات البحر الأحمر" : pl ? "Destynacje nad Morzem Czerwonym" : zh ? "红海目的地" : "Red Sea destinations"}</p>
            <h2 className="mt-3 text-4xl font-black text-ink">{de ? "Wähle dein Reiseziel" : ru ? "Выберите направление" : ar ? "اختر وجهتك للاستكشاف" : pl ? "Wybierz kierunek podróży" : zh ? "选择您想探索的目的地" : "Choose where you want to explore"}</h2>
            <p className="mt-4 text-lg leading-8 text-muted">{de ? "Entdecke getrennte Ausflugskataloge für Hurghada und Marsa Alam mit eigenen Preisen, Abholgebieten und Buchungsbedingungen." : ru ? "Выбирайте отдельные каталоги Хургады и Марса-Алама с собственными ценами, зонами трансфера и условиями бронирования." : ar ? "استكشف كتالوجات منفصلة للغردقة ومرسى علم مع أسعار ومناطق استلام وشروط حجز خاصة بكل وجهة." : pl ? "Odkryj osobne katalogi Hurghady i Marsa Alam z własnymi cenami, strefami odbioru i zasadami rezerwacji." : zh ? "探索赫尔格达和马萨阿拉姆的独立行程目录，各自提供专属价格、接送区域和预订条件。" : "Explore separate Hurghada, Marsa Alam and Jeddah catalogues with destination-specific prices, pickup areas and booking conditions."}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {destinations.map((destination) => (
              <Link key={destination.slug} href={localePath(language, `/destinations/${destination.slug}`)} className="group relative min-h-[410px] overflow-hidden rounded-[2rem] border border-line shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-ocean">
                <Image src={destination.image} alt={`${destination.name}, ${destination.country}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-3xl font-black">{destination.name}</h3>
                    {destination.status === "coming-soon" ? <span className="rounded-full bg-brand-orange-soft px-3 py-1 text-xs font-black uppercase tracking-wide text-brand-orange-cta">{de ? "Demnächst" : ru ? "Скоро" : ar ? "قريباً" : pl ? "Wkrótce" : zh ? "即将推出" : "Coming soon"}</span> : <span className="rounded-full bg-brand-navy-soft px-3 py-1 text-xs font-black uppercase tracking-wide text-brand-navy">{de ? "Jetzt verfügbar" : ru ? "Доступно сейчас" : ar ? "متاح الآن" : pl ? "Dostępne teraz" : zh ? "现已开放" : "Available now"}</span>}
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-line">{destination.slug === "hurghada" ? (de ? "Ausflüge am Roten Meer, Transfers und lokale Erlebnisse" : ru ? "Экскурсии, трансферы и местные впечатления на Красном море" : ar ? "رحلات البحر الأحمر والتنقلات والتجارب المحلية" : pl ? "Wycieczki nad Morzem Czerwonym, transfery i lokalne atrakcje" : zh ? "红海旅游、接送和本地体验" : "Red Sea tours, transfers, and local experiences") : destination.slug === "jeddah" ? (de ? "Tauchen und Küstenerlebnisse in Jeddah" : ru ? "Дайвинг и прибрежные впечатления в Джидде" : ar ? "غوص وتجارب ساحلية في جدة" : pl ? "Nurkowanie i nadmorskie atrakcje w Dżuddzie" : zh ? "吉达的红海潜水与海岸体验" : "Red Sea diving and coastal experiences in Jeddah") : (de ? "Unberührte Riffe, Wüstenlandschaften und Abenteuer im südlichen Roten Meer" : ru ? "Нетронутые рифы, пустынные пейзажи и приключения на юге Красного моря" : ar ? "شعاب نقية ومناظر صحراوية ومغامرات جنوب البحر الأحمر" : pl ? "Dziewicze rafy, pustynne krajobrazy i przygody na południu Morza Czerwonego" : zh ? "原始珊瑚礁、沙漠景观和红海南部探险" : "Untouched reefs, desert landscapes, and southern Red Sea adventures")}</p>
                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/20 pt-4">
                    <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-ocean-soft">{destinationDetails[destination.slug].signature}</p><p className="mt-1 text-sm text-line">{displayTours.filter((tour) => (tour.destinationSlug || "hurghada") === destination.slug).length} {t("tours").toLowerCase()} · {tr("from", "ab", "от", "من", "od", "起价")} {destinationDetails[destination.slug].startingPrice}</p></div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ocean-dark transition group-hover:translate-x-1"><ArrowRight size={19}/></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ContinuePlanningRail />

      <section
 ref={toursSection}
 id="tours"
 className="bg-white py-20 sm:py-24"
>


        <div className="
          mx-auto
          max-w-7xl
          px-8
        ">




          <div className="
            mb-10
            text-left
          ">


            <h2 className="
              text-4xl
              font-black
            ">
              {t("popularTours")}
            </h2>



            <p className="
              mt-5
              max-w-3xl
              text-lg
              text-muted
            ">
              {t("popularToursDescription")}
            </p>


          </div>








          {/* TOUR SEARCH */}


          <div className="
            hidden
            mb-16
            max-w-xl
          ">


            <div className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              bg-surface-muted
              px-5
              py-4
              shadow-sm
            ">


              <Search
                className="text-ocean"
              />

<input

  value={search}

  onChange={(e)=>{

    const value = e.target.value;

    setSearch(value);


  }}

  placeholder={t("searchPlaceholder")}

  className="
    w-full
    bg-transparent
    outline-none
  "

/>




            </div>


          </div>








          {/* TRANSFERS */}

          {!search && (

          <div className="hidden
            mb-20
            rounded-3xl
            border
            bg-gradient-to-r
            from-surface-muted
            to-white
            p-6
            sm:p-12
            shadow-sm
          ">



            <div className="
              flex
              flex-col
              gap-8
              md:flex-row
              md:items-center
              md:justify-between
            ">




              <div className="
                flex
                min-w-0
                items-start
                gap-5
              ">


                <div className="
                  shrink-0
                  rounded-2xl
                  bg-ocean-tint
                  p-4
                ">


                  <Car
                    size={34}
                    className="text-ocean"
                  />


                </div>




                <div className="min-w-0">


                  <p className="
                    font-semibold
                    uppercase
                    tracking-[0.35em]
                    text-ocean
                  ">
                    {de ? "Transfers" : ru ? "Трансферы" : ar ? "التنقلات" : pl ? "Transfery" : zh ? "接送服务" : "Transfers"}
                  </p>




                  <h3 className="
                    mt-2
                    break-words
                    text-3xl
                    font-bold
                    leading-tight
                    sm:text-4xl
                  ">
                    {de ? "Flughafen- und Hoteltransfer" : ru ? "Трансферы из аэропорта и отелей" : ar ? "تنقلات المطار والفنادق" : pl ? "Transfery lotniskowe i hotelowe" : zh ? "机场与酒店接送" : "Airport & Hotel Transfers"}
                  </h3>




                  <p className="
                    mt-4
                    text-muted
                  ">
                    {de ? "Private Transfers zwischen dem Flughafen Hurghada und den Hotels am Roten Meer." : ru ? "Частные трансферы между аэропортом Хургады и отелями Красного моря." : ar ? "تنقلات خاصة بين مطار الغردقة وفنادق البحر الأحمر." : pl ? "Prywatne przejazdy między lotniskiem w Hurghadzie a hotelami nad Morzem Czerwonym." : zh ? "赫尔格达机场与红海酒店之间的私人接送。" : "Private transfers between Hurghada Airport and Red Sea hotels."}
                  </p>



                </div>


              </div>





              <Link
                href={`${localePath(language, "/transfers")}#book-transfer`}
                className="
                rounded-xl
                bg-ocean
                px-8
                py-4
                text-center
                font-semibold
                text-white
                hover:bg-ocean-dark
                sm:w-auto
                "
              >
                {de ? "Transfer buchen" : ru ? "Заказать трансфер" : ar ? "احجز التنقل" : pl ? "Zarezerwuj transfer" : zh ? "预订接送" : "Book Transfer"}
              </Link>



            </div>


          </div>
          )}






          {/* RESULTS */}

{search && (

<div
className="
mb-8
rounded-2xl
bg-ocean-tint
p-4
text-center
text-ink
"
>

{de ? "Gefunden:" : ru ? "Найдено:" : ar ? "تم العثور على:" : pl ? "Znaleziono:" : zh ? "找到：" : "Found"}

<span className="
mx-2
font-bold
text-ocean
">

{filteredTours.length}

</span>

{de ? (filteredTours.length === 1 ? "Ausflug" : "Ausflüge") : ru ? "экскурсий" : ar ? "رحلات" : pl ? (filteredTours.length === 1 ? "wycieczkę" : "wycieczki") : zh ? "个行程" : `tour${filteredTours.length === 1 ? "" : "s"}`}

{de ? "für:" : ru ? "по запросу:" : ar ? "للبحث:" : pl ? "dla:" : zh ? "搜索：" : "for:"}

<span className="
ml-2
font-bold
text-ocean
">

{displaySearch}

</span>


</div>

)}

          <div className="space-y-16">
          {homepageTours.length > 0 ? destinations.filter((destination) => destination.status === "live").map((destination) => {
            const destinationTours = homepageTours.filter((tour) => (tour.destinationSlug || "hurghada") === destination.slug).slice(0, 12);
            if (!destinationTours.length) return null;
            return <section key={destination.slug} aria-labelledby={`home-${destination.slug}-title`}>
              <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div><p className="text-sm font-black uppercase tracking-[0.22em] text-ocean-dark">{destinationLocaleCopy[destination.slug].country} · {destinationLocaleCopy[destination.slug].region}</p><h3 id={`home-${destination.slug}-title`} className="mt-2 text-3xl font-black text-ink">{destination.name}</h3><p className="mt-2 max-w-2xl text-muted">{destinationLocaleCopy[destination.slug].tagline}</p></div>
                <Link href={localePath(language, `/destinations/${destination.slug}`)} className="font-bold text-ocean-dark hover:text-primary">{t("viewAllTours")} →</Link>
              </div>
              <MobileTourCarousel label={`${destination.name} tours`}>
              {destinationTours.map((tour: Tour)=>(


                <TourCard

                  key={tour.slug}

                  image={tour.image}

                  title={tour.title}

                  rating={tour.rating}

                  price={tour.price}
                  originalPrice={tour.originalPrice}

                  link={`${localePath(language, `/tours/${tour.slug}`)}${bookingQueryString ? `?${bookingQueryString}` : ""}`}

                  location={tour.location}

                  duration={tour.duration}

                  description={tour.description}

                  badge={tour.badge}
                  reviews={tour.reviews}
                  category={tour.category}
                  availableTime={tour.availableTimes?.[0]}
                  priceUnit={tour.priceUnit}
                  bookingMode={tour.bookingMode}
                  entrancePrice={tour.entrancePricing?.adults}
                  currency={tour.currency}
                  tourSlug={tour.slug}
                  destination={tour.destinationSlug || "hurghada"}

                />


              ))}
              </MobileTourCarousel>
            </section>;
          }) : (



              <div className="
                col-span-full
                py-20
                text-center
                text-2xl
                text-muted
              ">

                {de ? "Keine passenden Ausflüge gefunden" : ru ? "Подходящие экскурсии не найдены" : ar ? "لم يتم العثور على رحلات مناسبة" : pl ? "Nie znaleziono pasujących wycieczek" : zh ? "未找到符合条件的旅游项目" : "No tours found"}

              </div>



            )}



          </div>




        </div>


      </section>

      <section className="bg-ink px-6 py-20 text-white sm:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-ocean-soft">{tr("Why Daily Red Sea", "Warum Daily Red Sea?", "Почему Daily Red Sea")}</p><h2 className="mt-4 text-4xl font-black">{tr("Local knowledge, easy booking, clear support.", "Lokale Erfahrung, einfache Buchung, klare Unterstützung.", "Местные знания, простое бронирование и понятная поддержка.")}</h2><p className="mt-5 leading-7 text-line">{tr("We help you choose the right experience for your Red Sea destination with direct local support before your day begins.", "Wir helfen dir mit direkter lokaler Betreuung, das passende Erlebnis für dein Reiseziel am Roten Meer zu finden.", "Мы поможем выбрать подходящую поездку для вашего курорта на Красном море и поддержим вас до её начала.", "نساعدك في اختيار التجربة المناسبة لوجهتك في البحر الأحمر مع دعم محلي مباشر قبل بدء يومك.", "Pomagamy wybrać właściwą atrakcję dla Twojego miejsca nad Morzem Czerwonym i zapewniamy lokalne wsparcie przed wyjazdem.", "我们帮助您为红海目的地选择合适的体验，并在出发前提供直接的本地支持。")}</p></div>{[
        {icon:ShieldCheck,title:tr("Trusted local partners","Vertrauenswürdige lokale Partner","Надёжные местные партнёры","شركاء محليون موثوقون","Zaufani lokalni partnerzy","值得信赖的本地合作伙伴"),text:tr("Carefully selected crews, guides and drivers.","Sorgfältig ausgewählte Crews, Reiseführer und Fahrer.","Тщательно отобранные команды, гиды и водители.")},
        {icon:MessageCircle,title:tr("Easy WhatsApp booking","Einfache WhatsApp-Buchung","Простое бронирование в WhatsApp","حجز سهل عبر واتساب","Łatwa rezerwacja przez WhatsApp","轻松通过 WhatsApp 预订"),text:tr("Fast help for pickup, changes and questions.","Schnelle Hilfe bei Abholung, Änderungen und Fragen.","Быстрая помощь с трансфером, изменениями и вопросами.")},
        {icon:Headphones,title:tr("Helpful support","Hilfreiche Betreuung","Заботливая поддержка","دعم مفيد","Pomocne wsparcie","贴心支持"),text:tr("Clear communication before your tour.","Klare Kommunikation vor deinem Ausflug.","Понятное общение перед экскурсией.")},
      ].map(({icon:Icon,title,text}) => <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6"><Icon className="text-ocean-soft"/><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-line">{text}</p></div>)}</div></section>
      <section className="bg-white px-6 pt-20 pb-32 sm:px-8 sm:pb-36"><div className="mx-auto max-w-6xl"><GoogleReviews /></div></section>

      <HurghadaTravelGuide />

      <section className="bg-surface-muted px-6 py-20 sm:px-8"><div className="mx-auto max-w-3xl"><p className="text-center font-semibold uppercase tracking-[0.24em] text-ocean">{tr("Helpful answers","Hilfreiche Antworten","Полезные ответы")}</p><h2 className="mt-3 text-center text-4xl font-black text-ink">{tr("Red Sea excursions FAQ","FAQ zu Ausflügen am Roten Meer","Вопросы об экскурсиях на Красном море")}</h2><div className="mt-8 divide-y divide-line rounded-3xl border border-line bg-white px-6">{(de ? [["Wie buche ich einen Ausflug?","Wähle einen Ausflug, Datum und Reisende und sende deine Buchung. Die Details bestätigen wir per WhatsApp."],["Ist die Hotelabholung verfügbar?","Viele Ausflüge beinhalten oder bieten eine Hotelabholung. Prüfe die Ausflugsdetails und gib dein Hotel bei der Buchung an."],["Wann bezahle ich?","Barzahlung bei Ankunft wird vor der Bestätigung klar angezeigt. Gesamtpreis und Zahlungsstatus stehen auch in der PDF-Bestätigung."],["Kann ich meine Buchung ändern?","Kontaktiere uns so früh wie möglich per WhatsApp. Wir prüfen die Verfügbarkeit und helfen dir."]] : ru ? [["Как забронировать экскурсию?","Выберите экскурсию, дату и гостей, затем отправьте заявку. Детали мы подтвердим в WhatsApp."],["Есть ли трансфер из отеля?","Многие экскурсии включают или предлагают трансфер. Проверьте описание и укажите отель при бронировании."],["Когда оплачивать?","Оплата наличными по прибытии ясно указывается перед подтверждением. Сумма и статус оплаты также есть в PDF."],["Можно изменить бронирование?","Свяжитесь с нами в WhatsApp как можно раньше. Мы проверим наличие мест и поможем."]] : ar ? [["كيف أحجز رحلة؟","اختر رحلة وحدد التاريخ وعدد المسافرين ثم أرسل طلب الحجز. سنؤكد لك التفاصيل العملية عبر واتساب."],["هل الاستلام من الفندق متاح؟","تتضمن أو تقدم العديد من رحلاتنا خدمة الاستلام من الفندق. تحقق من تفاصيل الرحلة وأضف اسم فندقك عند الحجز."],["متى أدفع؟","يتم توضيح حجوزات الدفع النقدي عند الوصول بشكل واضح قبل التأكيد. يظهر إجمالي المبلغ وحالة الدفع أيضًا في تأكيد الحجز بصيغة PDF."],["هل يمكنني تغيير حجزي؟","تواصل معنا عبر واتساب في أقرب وقت ممكن. سنتحقق من التوفر ونساعدك قدر الإمكان."]] : pl ? [["Jak zarezerwować wycieczkę?","Wybierz wycieczkę, datę i liczbę uczestników, a następnie wyślij rezerwację. Szczegóły potwierdzimy z Tobą na WhatsApp."],["Czy dostępny jest odbiór z hotelu?","Wiele naszych wycieczek zawiera lub oferuje odbiór z hotelu. Sprawdź szczegóły wycieczki i podaj nazwę hotelu podczas rezerwacji."],["Kiedy płacę?","Rezerwacje z płatnością gotówką na miejscu są wyraźnie oznaczone przed potwierdzeniem. Łączna kwota i status płatności widoczne są także w potwierdzeniu PDF."],["Czy mogę zmienić rezerwację?","Skontaktuj się z nami na WhatsApp jak najwcześniej. Sprawdzimy dostępność i pomożemy, jeśli to możliwe."]] : zh ? [["如何预订旅游项目？","选择行程、日期和出行人数，然后提交预订。我们会通过 WhatsApp 与您确认具体细节。"],["是否提供酒店接送？","许多行程包含或提供酒店接送服务。请查看行程详情，并在预订时填写您的酒店名称。"],["何时付款？","到店现付的预订会在确认前清楚标明。总价和付款状态也会显示在您的 PDF 确认单中。"],["我可以更改预订吗？","请尽早通过 WhatsApp 联系我们，我们会为您查询可用性并尽力提供帮助。"]] : [["How do I book a tour?","Choose a tour, select your date and travelers, then submit your booking. We confirm practical details with you on WhatsApp."],["Is hotel pickup available?","Many tours include or offer hotel pickup. Check the tour details and add your hotel during booking."],["When do I pay?","Cash-on-arrival bookings are clearly shown before you confirm. Your total and payment status also appear on your PDF confirmation."],["Can I change my booking?","Contact us on WhatsApp as early as possible. We will check availability and help where possible."]]).map(([question,answer]) => <details key={question} className="py-5"><summary className="cursor-pointer font-bold text-ink">{question}</summary><p className="mt-3 leading-7 text-muted">{answer}</p></details>)}</div></div></section>

      {language === "en" && (
        <section className="border-t border-line bg-white px-6 py-16 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="font-semibold uppercase tracking-[0.24em] text-ocean-dark">Plan with local answers</p>
            <h2 className="mt-3 text-3xl font-bold text-ink">Red Sea guides before you book</h2>
            <p className="mt-3 max-w-2xl leading-7 text-muted">Clear, practical answers on choosing the right Red Sea trip, written for first-time visitors.</p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <Link href="/blog/best-snorkeling-tours-in-hurghada-for-beginners" className="rounded-2xl border border-line p-5 transition hover:border-ocean hover:bg-ocean-tint"><p className="font-bold text-ink">Best snorkeling tours for beginners</p><p className="mt-2 text-sm leading-6 text-muted">Choose reef time, island time or a wildlife-focused day.</p></Link>
              <Link href="/tours/full-day-diving" className="rounded-2xl border border-line p-5 transition hover:border-ocean hover:bg-ocean-tint"><p className="font-bold text-ink">Full-day scuba diving in Hurghada</p><p className="mt-2 text-sm leading-6 text-muted">Two guided dives, lunch and hotel transfer for certified divers.</p></Link>
              <Link href="/blog/budget-scuba-diving-courses-for-backpackers-in-hurghada" className="rounded-2xl border border-line p-5 transition hover:border-ocean hover:bg-ocean-tint"><p className="font-bold text-ink">Hurghada diving guide</p><p className="mt-2 text-sm leading-6 text-muted">Know the license and equipment requirements before booking.</p></Link>
            </div>
          </div>
        </section>
      )}

      <section className="bg-ocean px-6 py-20 text-center text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="font-semibold uppercase tracking-[0.24em] text-ocean-tint">{tr("Start planning","Jetzt planen","Начните планировать")}</p>
          <h2 className="mt-4 text-4xl font-bold">{tr("Ready for your Red Sea adventure?","Bereit für dein Abenteuer am Roten Meer?","Готовы к приключению на Красном море?")}</h2>
          <p className="mt-5 text-lg text-ocean-tint">{tr("Message our local team and we’ll help you find the right tour for your stay.","Schreibe unserem lokalen Team – wir helfen dir, den passenden Ausflug zu finden.","Напишите нашей местной команде, и мы поможем выбрать экскурсию.","راسل فريقنا المحلي وسنساعدك في اختيار الرحلة المناسبة لإقامتك.","Napisz do naszego lokalnego zespołu, a pomożemy Ci znaleźć odpowiednią wycieczkę na czas pobytu.","联系我们的本地团队，我们将帮您找到适合此次行程的旅游项目。")}</p>
          <a href={whatsappUrl(tr("Hello Daily Red Sea, I would like help planning my trip.","Hallo Daily Red Sea, ich möchte Hilfe bei der Reiseplanung.","Здравствуйте! Помогите мне спланировать поездку.","مرحبًا Daily Red Sea، أرغب في المساعدة في تخطيط رحلتي.","Dzień dobry Daily Red Sea, poproszę o pomoc w zaplanowaniu mojej podróży.","您好 Daily Red Sea，我想请你们协助规划我的行程。"))} onClick={() => trackEvent("whatsapp_click", { placement: "home_cta" })} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-xl bg-white px-7 py-4 font-semibold text-ocean-dark transition hover:bg-ocean-tint">{tr("Plan on WhatsApp","Über WhatsApp planen","Спланировать в WhatsApp","خطط عبر واتساب","Planuj przez WhatsApp","通过 WhatsApp 规划")}</a>
        </div>
      </section>

      <footer className="bg-ink px-6 py-12 text-line sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="text-xl font-bold text-white">Daily Red Sea</p>
            <p className="mt-3 max-w-sm leading-relaxed">{tr("Tours, excursions and private transfers for unforgettable days on the Red Sea.","Ausflüge und Privattransfers für unvergessliche Tage am Roten Meer.","Экскурсии и частные трансферы для незабываемого отдыха на Красном море.")}</p>
            <SocialLinks className="mt-5" dark />
          </div>
          <div>
            <p className="font-semibold text-white">{tr("Explore","Entdecken","Разделы")}</p>
            <div className="mt-3 space-y-2">
              <Link className="block hover:text-white" href={localePath(language, "/tours")}>{t("tours")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/transfers")}>{t("transfers")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/booking")}>{t("booking")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/checkout")}>{t("checkout")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/about")}>{t("about")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/faq")}>FAQ</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">{tr("Need help?","Brauchst du Hilfe?","Нужна помощь?")}</p>
            <a className="mt-3 inline-block hover:text-white" href={whatsappUrl()} onClick={() => trackEvent("whatsapp_click", { placement: "footer" })} target="_blank" rel="noopener noreferrer">{tr("Chat on WhatsApp","Über WhatsApp schreiben","Написать в WhatsApp")}</a>
            <div className="mt-4 space-y-2 text-sm">
              <a className="block font-semibold text-amber-300 hover:text-amber-200" href={googleReviewUrl} onClick={() => trackEvent("google_review_click", { placement: "footer" })} target="_blank" rel="noopener noreferrer">★ {tr("Review us on Google", "Google-Bewertung abgeben", "Оставить отзыв в Google", "قيّمنا على Google", "Oceń nas na Google", "在 Google 上评价我们")}</a>
              <Link className="block hover:text-white" href={localePath(language, "/privacy-policy")}>{tr("Privacy Policy","Datenschutz","Политика конфиденциальности","سياسة الخصوصية","Polityka prywatności","隐私政策")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/terms-conditions")}>{tr("Terms & Conditions","Allgemeine Geschäftsbedingungen","Условия использования","الشروط والأحكام","Regulamin","条款与条件")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/contact")}>{tr("Contact us","Kontakt","Связаться с нами")}</Link>
              <Link className="block hover:text-white" href="/blog">{language === "de" ? "Blog" : language === "ru" ? "Блог" : language === "ar" ? "المدونة" : language === "pl" ? "Poradnik" : language === "zh" ? "旅游指南" : "Blog"}</Link>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-7xl border-t border-ink pt-6 text-sm">© {new Date().getFullYear()} Daily Red Sea. {tr("All rights reserved.","Alle Rechte vorbehalten.","Все права защищены.")}</p>
      </footer>


    </>

  );

}
