"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import Hero from "@/components/home/Hero";
import TourCard from "@/components/cards/TourCard";

import { Car, Search, BadgeCheck, MessageCircle, ShieldCheck, Headphones } from "lucide-react";

import { tours, type Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { googleReviewUrl, whatsappUrl } from "@/lib/contact";
import HurghadaTravelGuide from "@/components/home/HurghadaTravelGuide";
import SocialLinks from "@/components/layout/SocialLinks";
import ImageWatermark from "@/components/media/ImageWatermark";
import { localePath } from "@/lib/i18n";
import { localizeTourArabic, localizeTourChinese, localizeTourGerman, localizeTourPolish, localizeTourRussian } from "@/lib/tour-localization";
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
    "Tours, excursions and private transfers for unforgettable days in Hurghada.": { ar: "رحلات وتجارب وتنقلات خاصة لأيام لا تُنسى في الغردقة.", pl: "Wycieczki i prywatne transfery na niezapomniane dni w Hurghadzie.", zh: "赫尔格达难忘旅程的旅游项目与私人接送。" },
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
  const displayTours = de ? publicTours.map(localizeTourGerman) : ru ? publicTours.map(localizeTourRussian) : ar ? publicTours.map(localizeTourArabic) : pl ? publicTours.map(localizeTourPolish) : zh ? publicTours.map(localizeTourChinese) : publicTours;
  const filteredTours = filterTours(displayTours, search);
  const displaySearch = search.replace(/,/g, ", ");

  const tourOrder = ["orange-bay", "full-day-snorkeling", "full-day-diving", "mahmya-island", "quad-safari-morning", "quad-safari-sunset", "hurghada-airport-transfer", "senzo-transfer"];
  filteredTours.sort((left, right) => {
    const leftIndex = tourOrder.indexOf(left.slug);
    const rightIndex = tourOrder.indexOf(right.slug);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });






  return (

    <>


      <Hero />

      <section className="bg-white px-6 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-semibold uppercase tracking-[0.24em] text-cyan-700">{de ? "Reiseziele am Roten Meer" : ru ? "Направления Красного моря" : ar ? "وجهات البحر الأحمر" : pl ? "Destynacje nad Morzem Czerwonym" : zh ? "红海目的地" : "Red Sea destinations"}</p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">{de ? "Wähle dein Reiseziel" : ru ? "Выберите направление" : ar ? "اختر وجهتك للاستكشاف" : pl ? "Wybierz kierunek podróży" : zh ? "选择您想探索的目的地" : "Choose where you want to explore"}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">{de ? "Entdecke getrennte Ausflugskataloge für Hurghada und Marsa Alam mit eigenen Preisen, Abholgebieten und Buchungsbedingungen." : ru ? "Выбирайте отдельные каталоги Хургады и Марса-Алама с собственными ценами, зонами трансфера и условиями бронирования." : ar ? "استكشف كتالوجات منفصلة للغردقة ومرسى علم مع أسعار ومناطق استلام وشروط حجز خاصة بكل وجهة." : pl ? "Odkryj osobne katalogi Hurghady i Marsa Alam z własnymi cenami, strefami odbioru i zasadami rezerwacji." : zh ? "探索赫尔格达和马萨阿拉姆的独立行程目录，各自提供专属价格、接送区域和预订条件。" : "Explore separate Hurghada and Marsa Alam catalogues with destination-specific prices, pickup areas and booking conditions."}</p>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {destinations.map((destination) => (
              <Link key={destination.slug} href={localePath(language, `/destinations/${destination.slug}`)} className="group relative min-h-72 overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-cyan-400">
                <Image src={destination.image} alt={`${destination.name}, ${destination.country}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-black">{destination.name}</h3>
                    {destination.status === "coming-soon" ? <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-950">{de ? "Demnächst" : ru ? "Скоро" : ar ? "قريباً" : pl ? "Wkrótce" : zh ? "即将推出" : "Coming soon"}</span> : <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-950">{de ? "Jetzt verfügbar" : ru ? "Доступно сейчас" : ar ? "متاح الآن" : pl ? "Dostępne teraz" : zh ? "现已开放" : "Available now"}</span>}
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">{destination.slug === "hurghada" ? (de ? "Ausflüge am Roten Meer, Transfers und lokale Erlebnisse" : ru ? "Экскурсии, трансферы и местные впечатления на Красном море" : ar ? "رحلات البحر الأحمر والتنقلات والتجارب المحلية" : pl ? "Wycieczki nad Morzem Czerwonym, transfery i lokalne atrakcje" : zh ? "红海旅游、接送和本地体验" : "Red Sea tours, transfers, and local experiences") : (de ? "Unberührte Riffe, Wüstenlandschaften und Abenteuer im südlichen Roten Meer" : ru ? "Нетронутые рифы, пустынные пейзажи и приключения на юге Красного моря" : ar ? "شعاب نقية ومناظر صحراوية ومغامرات جنوب البحر الأحمر" : pl ? "Dziewicze rafy, pustynne krajobrazy i przygody na południu Morza Czerwonego" : zh ? "原始珊瑚礁、沙漠景观和红海南部探险" : "Untouched reefs, desert landscapes, and southern Red Sea adventures")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-10 sm:px-8"><div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-3">{(de ? ["Lokales Team am Roten Meer", "Faire Preise", "Hotelabholung verfügbar", "Schnelle WhatsApp-Buchung", "Deutschsprachige Betreuung", "Keine versteckten Gebühren"] : ru ? ["Местная команда на Красном море", "Выгодные цены", "Трансфер из отеля", "Быстрое бронирование в WhatsApp", "Поддержка на русском языке", "Без скрытых доплат"] : ar ? ["فريق محلي في البحر الأحمر", "أسعار مناسبة", "الاستلام من الفندق متاح", "حجز سريع عبر واتساب", "دعم باللغة العربية", "لا توجد رسوم مخفية"] : pl ? ["Lokalny zespół nad Morzem Czerwonym", "Korzystne ceny", "Dostępny odbiór z hotelu", "Szybka rezerwacja przez WhatsApp", "Wsparcie w wielu językach", "Bez ukrytych opłat"] : zh ? ["红海本地团队", "优惠价格", "提供酒店接送", "WhatsApp 快速预订", "多语言支持", "无隐藏费用"] : ["Local Red Sea team", "Best value prices", "Hotel pickup available", "Instant WhatsApp booking", "English-speaking support", "No hidden fees"]).map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700"><BadgeCheck className="shrink-0 text-emerald-600" size={19}/>{item}</div>)}</div></section>

      <section className="bg-slate-50 px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">{t("chooseExperience")}</p>
              <h2 className="mt-3 text-4xl font-bold text-slate-900">{t("exploreAdventure")}</h2>
            </div>
            <Link href={localePath(language, "/tours")} className="font-semibold text-blue-700 hover:text-blue-900">{t("viewAllTours")} →</Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <DestinationCard image="/images/owned/mahmya-island-boats-owner.jpg" title={ru ? "Отдых на островах" : de ? "Inselerlebnisse" : ar ? "عطلات الجزر" : pl ? "Wyspy i plaże" : zh ? "海岛休闲" : "Island escapes"} description={ru ? "Морские прогулки, снорклинг и пляжный отдых на Красном море." : de ? "Bootsausflüge, Schnorcheln und Strandtage am Roten Meer." : ar ? "رحلات بحرية وسنوركلينج وأيام شاطئية في البحر الأحمر." : pl ? "Rejsy, snorkeling i plażowe dni nad Morzem Czerwonym." : zh ? "游船、浮潜和红海海滩时光。" : "Boat trips, snorkeling and beach days on the Red Sea."} href={`${homePath}?search=island`} />
            <DestinationCard image="/images/owned/red-sea-diver-reef.jpg" title={ru ? "Дайвинг и снорклинг" : de ? "Tauchen & Schnorcheln" : ar ? "الغوص والسنوركلينج" : pl ? "Nurkowanie i snorkeling" : zh ? "潜水与浮潜" : "Diving & Snorkeling"} description={de ? "Entdecke Korallengärten und die farbenfrohe Unterwasserwelt des Roten Meeres." : ru ? "Откройте коралловые рифы и яркий подводный мир Красного моря." : ar ? "اكتشف حدائق المرجان وعالم البحر الأحمر تحت الماء." : pl ? "Odkryj rafy koralowe i podwodny świat Morza Czerwonego." : zh ? "探索珊瑚花园、绚丽鱼群和清澈海底。" : "Meet coral gardens, bright reef life, and the clear blue world below the surface."} href={`${homePath}?search=diving,snorkeling`} />
            <DestinationCard image="/images/owned/desert-camel-front.jpg" title={ru ? "Приключения в пустыне" : de ? "Wüstenabenteuer" : ar ? "مغامرات الصحراء" : pl ? "Przygody na pustyni" : zh ? "沙漠探险" : "Desert adventures"} description={ru ? "Квадроциклы, культура бедуинов и незабываемые закаты." : de ? "Quads, Beduinenkultur und unvergessliche Sonnenuntergänge." : ar ? "كواد وثقافة بدوية وغروب لا يُنسى." : pl ? "Quady, kultura Beduinów i niezapomniane zachody słońca." : zh ? "四轮摩托、贝都因文化和难忘的日落。" : "Quad bikes, Bedouin culture and unforgettable sunsets."} href={`${homePath}?search=desert`} />
          </div>
        </div>
      </section>




      <section
 ref={toursSection}
 id="tours"
 className="bg-white py-32"
>


        <div className="
          mx-auto
          max-w-7xl
          px-8
        ">




          <div className="
            mb-10
            text-center
          ">


            <h2 className="
              text-5xl
              font-bold
            ">
              {t("popularTours")}
            </h2>



            <p className="
              mx-auto
              mt-5
              max-w-3xl
              text-lg
              text-gray-600
            ">
              {t("popularToursDescription")}
            </p>


          </div>








          {/* TOUR SEARCH */}


          <div className="
            mx-auto
            mb-16
            max-w-xl
          ">


            <div className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              bg-gray-50
              px-5
              py-4
              shadow-sm
            ">


              <Search
                className="text-blue-600"
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

          <div className="
            mb-20
            rounded-3xl
            border
            bg-gradient-to-r
            from-slate-50
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
                  bg-blue-100
                  p-4
                ">


                  <Car
                    size={34}
                    className="text-blue-600"
                  />


                </div>




                <div className="min-w-0">


                  <p className="
                    font-semibold
                    uppercase
                    tracking-[0.35em]
                    text-blue-600
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
                    text-gray-600
                  ">
                    {de ? "Private Transfers zwischen dem Flughafen Hurghada und den Hotels am Roten Meer." : ru ? "Частные трансферы между аэропортом Хургады и отелями Красного моря." : ar ? "تنقلات خاصة بين مطار الغردقة وفنادق البحر الأحمر." : pl ? "Prywatne przejazdy między lotniskiem w Hurghadzie a hotelami nad Morzem Czerwonym." : zh ? "赫尔格达机场与红海酒店之间的私人接送。" : "Private transfers between Hurghada Airport and Red Sea hotels."}
                  </p>



                </div>


              </div>





              <Link
                href={`${localePath(language, "/transfers")}#book-transfer`}
                className="
                rounded-xl
                bg-blue-600
                px-8
                py-4
                text-center
                font-semibold
                text-white
                hover:bg-blue-700
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
bg-blue-50
p-4
text-center
text-gray-700
"
>

{de ? "Gefunden:" : ru ? "Найдено:" : ar ? "تم العثور على:" : pl ? "Znaleziono:" : zh ? "找到：" : "Found"}

<span className="
mx-2
font-bold
text-blue-600
">

{filteredTours.length}

</span>

{de ? (filteredTours.length === 1 ? "Ausflug" : "Ausflüge") : ru ? "экскурсий" : ar ? "رحلات" : pl ? (filteredTours.length === 1 ? "wycieczkę" : "wycieczki") : zh ? "个行程" : `tour${filteredTours.length === 1 ? "" : "s"}`}

{de ? "für:" : ru ? "по запросу:" : ar ? "للبحث:" : pl ? "dla:" : zh ? "搜索：" : "for:"}

<span className="
ml-2
font-bold
text-blue-600
">

{displaySearch}

</span>


</div>

)}

          <div className="space-y-16">
          {filteredTours.length > 0 ? destinations.filter((destination) => destination.status === "live").map((destination) => {
            const destinationTours = filteredTours.filter((tour) => (tour.destinationSlug || "hurghada") === destination.slug).slice(0, 6);
            if (!destinationTours.length) return null;
            return <section key={destination.slug} aria-labelledby={`home-${destination.slug}-title`}>
              <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div><p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-700">{destination.country} · {destination.region}</p><h3 id={`home-${destination.slug}-title`} className="mt-2 text-3xl font-black text-slate-950">{destination.name}</h3><p className="mt-2 max-w-2xl text-slate-600">{destination.tagline}</p></div>
                <Link href={localePath(language, `/destinations/${destination.slug}`)} className="font-bold text-blue-700 hover:text-blue-900">{t("viewAllTours")} →</Link>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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

                />


              ))}
              </div>
            </section>;
          }) : (



              <div className="
                col-span-full
                py-20
                text-center
                text-2xl
                text-gray-500
              ">

                {de ? "Keine passenden Ausflüge gefunden" : ru ? "Подходящие экскурсии не найдены" : ar ? "لم يتم العثور على رحلات مناسبة" : pl ? "Nie znaleziono pasujących wycieczek" : zh ? "未找到符合条件的旅游项目" : "No tours found"}

              </div>



            )}



          </div>




        </div>


      </section>

      <section className="bg-slate-950 px-6 py-20 text-white sm:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">{tr("Why Daily Red Sea", "Warum Daily Red Sea?", "Почему Daily Red Sea")}</p><h2 className="mt-4 text-4xl font-black">{tr("Local knowledge, easy booking, clear support.", "Lokale Erfahrung, einfache Buchung, klare Unterstützung.", "Местные знания, простое бронирование и понятная поддержка.")}</h2><p className="mt-5 leading-7 text-slate-300">{tr("We help you choose the right experience for your Red Sea destination with direct local support before your day begins.", "Wir helfen dir mit direkter lokaler Betreuung, das passende Erlebnis für dein Reiseziel am Roten Meer zu finden.", "Мы поможем выбрать подходящую поездку для вашего курорта на Красном море и поддержим вас до её начала.", "نساعدك في اختيار التجربة المناسبة لوجهتك في البحر الأحمر مع دعم محلي مباشر قبل بدء يومك.", "Pomagamy wybrać właściwą atrakcję dla Twojego miejsca nad Morzem Czerwonym i zapewniamy lokalne wsparcie przed wyjazdem.", "我们帮助您为红海目的地选择合适的体验，并在出发前提供直接的本地支持。")}</p></div>{[
        {icon:ShieldCheck,title:tr("Trusted local partners","Vertrauenswürdige lokale Partner","Надёжные местные партнёры","شركاء محليون موثوقون","Zaufani lokalni partnerzy","值得信赖的本地合作伙伴"),text:tr("Carefully selected crews, guides and drivers.","Sorgfältig ausgewählte Crews, Reiseführer und Fahrer.","Тщательно отобранные команды, гиды и водители.")},
        {icon:MessageCircle,title:tr("Easy WhatsApp booking","Einfache WhatsApp-Buchung","Простое бронирование в WhatsApp","حجز سهل عبر واتساب","Łatwa rezerwacja przez WhatsApp","轻松通过 WhatsApp 预订"),text:tr("Fast help for pickup, changes and questions.","Schnelle Hilfe bei Abholung, Änderungen und Fragen.","Быстрая помощь с трансфером, изменениями и вопросами.")},
        {icon:Headphones,title:tr("Helpful support","Hilfreiche Betreuung","Заботливая поддержка","دعم مفيد","Pomocne wsparcie","贴心支持"),text:tr("Clear communication before your tour.","Klare Kommunikation vor deinem Ausflug.","Понятное общение перед экскурсией.")},
      ].map(({icon:Icon,title,text}) => <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6"><Icon className="text-cyan-300"/><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-300">{text}</p></div>)}</div></section>
      <HurghadaTravelGuide />

      <section id="about" className="bg-slate-50 px-8 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold">{tr("Your Red Sea adventure, made easy", "Dein Abenteuer am Roten Meer – einfach geplant", "Ваш отдых на Красном море — легко и удобно")}</h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            {tr("Daily Red Sea connects you with memorable experiences across Red Sea destinations, from boat trips and diving to desert adventures and private transfers.", "Daily Red Sea verbindet dich mit unvergesslichen Erlebnissen in Reisezielen am Roten Meer – von Bootstouren und Tauchen bis zu Wüstenabenteuern und Privattransfers.", "Daily Red Sea предлагает яркие впечатления на курортах Красного моря: морские прогулки, дайвинг, приключения в пустыне и частные трансферы.", "تربطك Daily Red Sea بتجارب لا تُنسى في وجهات البحر الأحمر، من الرحلات البحرية والغوص إلى مغامرات الصحراء والتنقلات الخاصة.", "Daily Red Sea łączy Cię z niezapomnianymi atrakcjami w różnych miejscach nad Morzem Czerwonym — od rejsów i nurkowania po pustynię i prywatne transfery.", "Daily Red Sea 为您连接红海各目的地的精彩体验，从游船和潜水到沙漠探险与私人接送。")}
          </p>
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-20 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="font-semibold uppercase tracking-[0.24em] text-blue-300">{tr("Why travel with us", "Warum mit uns reisen?", "Почему выбирают нас")}</p>
            <h2 className="mt-4 text-4xl font-bold">{tr("Plan with local Red Sea experts", "Plane mit lokalen Experten am Roten Meer", "Планируйте с местными экспертами Красного моря")}</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">{tr("Clear prices, hotel pickup options and friendly support make it simple to choose the right day out.", "Klare Preise, Hotelabholung und freundliche Betreuung erleichtern die Auswahl.", "Понятные цены, трансфер из отеля и дружелюбная поддержка помогают легко выбрать поездку.", "أسعار واضحة وخيارات استلام من الفندق ودعم ودود تجعل اختيار يومك المثالي أمرًا سهلاً.", "Przejrzyste ceny, opcje odbioru z hotelu i przyjazne wsparcie ułatwiają wybór odpowiedniej wycieczki.", "价格透明、可选酒店接送并提供友善支持，让您轻松选择合适的行程。")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <ValueCard title={tr("Trusted local team","Vertrauenswürdiges lokales Team","Надёжная местная команда","فريق محلي موثوق","Zaufany lokalny zespół","值得信赖的本地团队")} description={tr("Helpful advice before and after you book.","Hilfreiche Beratung vor und nach der Buchung.","Полезные советы до и после бронирования.","نصائح مفيدة قبل الحجز وبعده.","Pomocne porady przed rezerwacją i po niej.","预订前后均提供实用建议。")} />
            <ValueCard title={tr("Handpicked adventures","Ausgewählte Erlebnisse","Отобранные приключения","مغامرات مختارة بعناية","Starannie wyselekcjonowane atrakcje","精选探险活动")} description={tr("Popular island, sea and desert experiences.","Beliebte Insel-, Meeres- und Wüstenerlebnisse.","Популярные островные, морские и пустынные экскурсии.","تجارب شهيرة في الجزر والبحر والصحراء.","Popularne atrakcje wyspiarskie, morskie i pustynne.","热门的海岛、海洋与沙漠体验。")} />
            <ValueCard title={tr("Easy WhatsApp booking","Einfache WhatsApp-Buchung","Простое бронирование в WhatsApp","حجز سهل عبر واتساب","Łatwa rezerwacja przez WhatsApp","轻松通过 WhatsApp 预订")} description={tr("Quick answers and practical trip support.","Schnelle Antworten und praktische Unterstützung.","Быстрые ответы и помощь с поездкой.","إجابات سريعة ودعم عملي لرحلتك.","Szybkie odpowiedzi i praktyczne wsparcie podczas podróży.","快速解答与实用的行程支持。")} />
          </div>
        </div>
      </section>

      <section className="bg-white px-6 pt-20 pb-32 sm:px-8 sm:pb-36"><div className="mx-auto max-w-6xl"><GoogleReviews /></div></section>

      <section className="bg-slate-50 px-6 py-20 sm:px-8"><div className="mx-auto max-w-3xl"><p className="text-center font-semibold uppercase tracking-[0.24em] text-blue-600">{tr("Helpful answers","Hilfreiche Antworten","Полезные ответы")}</p><h2 className="mt-3 text-center text-4xl font-black text-slate-900">{tr("Red Sea excursions FAQ","FAQ zu Ausflügen am Roten Meer","Вопросы об экскурсиях на Красном море")}</h2><div className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-6">{(de ? [["Wie buche ich einen Ausflug?","Wähle einen Ausflug, Datum und Reisende und sende deine Buchung. Die Details bestätigen wir per WhatsApp."],["Ist die Hotelabholung verfügbar?","Viele Ausflüge beinhalten oder bieten eine Hotelabholung. Prüfe die Ausflugsdetails und gib dein Hotel bei der Buchung an."],["Wann bezahle ich?","Barzahlung bei Ankunft wird vor der Bestätigung klar angezeigt. Gesamtpreis und Zahlungsstatus stehen auch in der PDF-Bestätigung."],["Kann ich meine Buchung ändern?","Kontaktiere uns so früh wie möglich per WhatsApp. Wir prüfen die Verfügbarkeit und helfen dir."]] : ru ? [["Как забронировать экскурсию?","Выберите экскурсию, дату и гостей, затем отправьте заявку. Детали мы подтвердим в WhatsApp."],["Есть ли трансфер из отеля?","Многие экскурсии включают или предлагают трансфер. Проверьте описание и укажите отель при бронировании."],["Когда оплачивать?","Оплата наличными по прибытии ясно указывается перед подтверждением. Сумма и статус оплаты также есть в PDF."],["Можно изменить бронирование?","Свяжитесь с нами в WhatsApp как можно раньше. Мы проверим наличие мест и поможем."]] : ar ? [["كيف أحجز رحلة؟","اختر رحلة وحدد التاريخ وعدد المسافرين ثم أرسل طلب الحجز. سنؤكد لك التفاصيل العملية عبر واتساب."],["هل الاستلام من الفندق متاح؟","تتضمن أو تقدم العديد من رحلاتنا خدمة الاستلام من الفندق. تحقق من تفاصيل الرحلة وأضف اسم فندقك عند الحجز."],["متى أدفع؟","يتم توضيح حجوزات الدفع النقدي عند الوصول بشكل واضح قبل التأكيد. يظهر إجمالي المبلغ وحالة الدفع أيضًا في تأكيد الحجز بصيغة PDF."],["هل يمكنني تغيير حجزي؟","تواصل معنا عبر واتساب في أقرب وقت ممكن. سنتحقق من التوفر ونساعدك قدر الإمكان."]] : pl ? [["Jak zarezerwować wycieczkę?","Wybierz wycieczkę, datę i liczbę uczestników, a następnie wyślij rezerwację. Szczegóły potwierdzimy z Tobą na WhatsApp."],["Czy dostępny jest odbiór z hotelu?","Wiele naszych wycieczek zawiera lub oferuje odbiór z hotelu. Sprawdź szczegóły wycieczki i podaj nazwę hotelu podczas rezerwacji."],["Kiedy płacę?","Rezerwacje z płatnością gotówką na miejscu są wyraźnie oznaczone przed potwierdzeniem. Łączna kwota i status płatności widoczne są także w potwierdzeniu PDF."],["Czy mogę zmienić rezerwację?","Skontaktuj się z nami na WhatsApp jak najwcześniej. Sprawdzimy dostępność i pomożemy, jeśli to możliwe."]] : zh ? [["如何预订旅游项目？","选择行程、日期和出行人数，然后提交预订。我们会通过 WhatsApp 与您确认具体细节。"],["是否提供酒店接送？","许多行程包含或提供酒店接送服务。请查看行程详情，并在预订时填写您的酒店名称。"],["何时付款？","到店现付的预订会在确认前清楚标明。总价和付款状态也会显示在您的 PDF 确认单中。"],["我可以更改预订吗？","请尽早通过 WhatsApp 联系我们，我们会为您查询可用性并尽力提供帮助。"]] : [["How do I book a tour?","Choose a tour, select your date and travelers, then submit your booking. We confirm practical details with you on WhatsApp."],["Is hotel pickup available?","Many tours include or offer hotel pickup. Check the tour details and add your hotel during booking."],["When do I pay?","Cash-on-arrival bookings are clearly shown before you confirm. Your total and payment status also appear on your PDF confirmation."],["Can I change my booking?","Contact us on WhatsApp as early as possible. We will check availability and help where possible."]]).map(([question,answer]) => <details key={question} className="py-5"><summary className="cursor-pointer font-bold text-slate-900">{question}</summary><p className="mt-3 leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>

      {language === "en" && (
        <section className="border-t border-slate-200 bg-white px-6 py-16 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="font-semibold uppercase tracking-[0.24em] text-cyan-700">Plan with local answers</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Hurghada guides before you book</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">Clear, practical answers on choosing the right Red Sea trip, written for first-time visitors.</p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <Link href="/blog/best-snorkeling-tours-in-hurghada-for-beginners" className="rounded-2xl border border-slate-200 p-5 transition hover:border-cyan-500 hover:bg-cyan-50"><p className="font-bold text-slate-950">Best snorkeling tours for beginners</p><p className="mt-2 text-sm leading-6 text-slate-600">Choose reef time, island time or a wildlife-focused day.</p></Link>
              <Link href="/tours/full-day-diving" className="rounded-2xl border border-slate-200 p-5 transition hover:border-cyan-500 hover:bg-cyan-50"><p className="font-bold text-slate-950">Full-day scuba diving in Hurghada</p><p className="mt-2 text-sm leading-6 text-slate-600">Two guided dives, lunch and hotel transfer for certified divers.</p></Link>
              <Link href="/blog/budget-scuba-diving-courses-for-backpackers-in-hurghada" className="rounded-2xl border border-slate-200 p-5 transition hover:border-cyan-500 hover:bg-cyan-50"><p className="font-bold text-slate-950">Hurghada diving guide</p><p className="mt-2 text-sm leading-6 text-slate-600">Know the license and equipment requirements before booking.</p></Link>
            </div>
          </div>
        </section>
      )}

      <section className="bg-blue-600 px-6 py-20 text-center text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="font-semibold uppercase tracking-[0.24em] text-blue-100">{tr("Start planning","Jetzt planen","Начните планировать")}</p>
          <h2 className="mt-4 text-4xl font-bold">{tr("Ready for your Red Sea adventure?","Bereit für dein Abenteuer am Roten Meer?","Готовы к приключению на Красном море?")}</h2>
          <p className="mt-5 text-lg text-blue-100">{tr("Message our local team and we’ll help you find the right tour for your stay.","Schreibe unserem lokalen Team – wir helfen dir, den passenden Ausflug zu finden.","Напишите нашей местной команде, и мы поможем выбрать экскурсию.","راسل فريقنا المحلي وسنساعدك في اختيار الرحلة المناسبة لإقامتك.","Napisz do naszego lokalnego zespołu, a pomożemy Ci znaleźć odpowiednią wycieczkę na czas pobytu.","联系我们的本地团队，我们将帮您找到适合此次行程的旅游项目。")}</p>
          <a href={whatsappUrl(tr("Hello Daily Red Sea, I would like help planning my trip.","Hallo Daily Red Sea, ich möchte Hilfe bei der Reiseplanung.","Здравствуйте! Помогите мне спланировать поездку.","مرحبًا Daily Red Sea، أرغب في المساعدة في تخطيط رحلتي.","Dzień dobry Daily Red Sea, poproszę o pomoc w zaplanowaniu mojej podróży.","您好 Daily Red Sea，我想请你们协助规划我的行程。"))} onClick={() => trackEvent("whatsapp_click", { placement: "home_cta" })} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-xl bg-white px-7 py-4 font-semibold text-blue-700 transition hover:bg-blue-50">{tr("Plan on WhatsApp","Über WhatsApp planen","Спланировать в WhatsApp","خطط عبر واتساب","Planuj przez WhatsApp","通过 WhatsApp 规划")}</a>
        </div>
      </section>

      <footer className="bg-slate-950 px-6 py-12 text-slate-300 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="text-xl font-bold text-white">Daily Red Sea</p>
            <p className="mt-3 max-w-sm leading-relaxed">{tr("Tours, excursions and private transfers for unforgettable days in Hurghada.","Ausflüge und Privattransfers für unvergessliche Tage in Hurghada.","Экскурсии и частные трансферы для незабываемого отдыха в Хургаде.")}</p>
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
              <Link className="block hover:text-white" href="/image-credits">{tr("Image Credits","Bildnachweise","Источники изображений","مصادر الصور","Źródła zdjęć","图片来源")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/contact")}>{tr("Contact us","Kontakt","Связаться с нами")}</Link>
              <Link className="block hover:text-white" href="/blog">{language === "de" ? "Blog" : language === "ru" ? "Блог" : language === "ar" ? "المدونة" : language === "pl" ? "Poradnik" : language === "zh" ? "旅游指南" : "Blog"}</Link>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-7xl border-t border-slate-800 pt-6 text-sm">© {new Date().getFullYear()} Daily Red Sea. {tr("All rights reserved.","Alle Rechte vorbehalten.","Все права защищены.")}</p>
      </footer>


    </>

  );

}

function DestinationCard({ image, title, description, href }: { image: string; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="group relative min-h-80 overflow-hidden rounded-3xl bg-slate-900 shadow-lg">
      <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
      <ImageWatermark />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-7 text-white"><h3 className="text-2xl font-bold">{title}</h3><p className="mt-2 text-slate-200">{description}</p><span className="mt-4 inline-block font-semibold text-blue-200">→</span></div>
    </Link>
  );
}

function ValueCard({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6"><h3 className="font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p></div>;
}
