"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import Hero from "@/components/home/Hero";
import TourCard from "@/components/cards/TourCard";

import { Car, Search, BadgeCheck, ShipWheel, Waves, TentTree, Plane, Landmark, MessageCircle, ShieldCheck, Headphones } from "lucide-react";

import { tours, type Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { googleMapsUrl, googleReviewUrl, whatsappUrl } from "@/lib/contact";
import HurghadaTravelGuide from "@/components/home/HurghadaTravelGuide";
import SocialLinks from "@/components/layout/SocialLinks";
import ImageWatermark from "@/components/media/ImageWatermark";
import { localePath } from "@/lib/i18n";
import { localizeTourArabic, localizeTourChinese, localizeTourGerman, localizeTourRussian } from "@/lib/tour-localization";
import { filterTours } from "@/lib/tour-search";



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
  const tr = (en: string, deText: string, ruText: string, arText = en) => de ? deText : ru ? ruText : ar ? arText : en;
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
  const displayTours = de ? liveTours.map(localizeTourGerman) : ru ? liveTours.map(localizeTourRussian) : ar ? liveTours.map(localizeTourArabic) : zh ? liveTours.map(localizeTourChinese) : liveTours;
  const filteredTours = filterTours(displayTours, search);

  const tourOrder = ["orange-bay", "full-day-snorkeling", "full-day-diving", "mahmya-island", "quad-safari-morning", "quad-safari-sunset", "hurghada-airport-transfer", "senzo-transfer"];
  filteredTours.sort((left, right) => {
    const leftIndex = tourOrder.indexOf(left.slug);
    const rightIndex = tourOrder.indexOf(right.slug);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });






  return (

    <>


      <Hero />

      <section className="bg-white px-6 py-10 sm:px-8"><div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-3">{(de ? ["Lokaler Anbieter in Hurghada", "Faire Preise", "Hotelabholung verfügbar", "Schnelle WhatsApp-Buchung", "Deutschsprachige Betreuung", "Keine versteckten Gebühren"] : ru ? ["Местный оператор в Хургаде", "Выгодные цены", "Трансфер из отеля", "Быстрое бронирование в WhatsApp", "Поддержка на русском языке", "Без скрытых доплат"] : ["Local Hurghada operator", "Best value prices", "Hotel pickup available", "Instant WhatsApp booking", "English-speaking support", "No hidden fees"]).map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700"><BadgeCheck className="shrink-0 text-emerald-600" size={19}/>{item}</div>)}</div></section>

      <section className="bg-slate-50 px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">{de ? "Die besten Aktivitäten in Hurghada" : ru ? "Лучшие развлечения в Хургаде" : "Best things to do in Hurghada"}</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">{de ? "Hurghada-Erlebnisse für jeden Plan" : ru ? "Отдых в Хургаде на любой вкус" : "Hurghada experiences for every plan"}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">{de ? "Türkisblaues Wasser, goldene Wüstendünen oder eine bequeme Fahrt von Tür zu Tür – dein perfekter Tag in Hurghada beginnt hier." : ru ? "Бирюзовое море, золотые дюны или удобный трансфер от двери до двери — ваш идеальный день в Хургаде начинается здесь." : "Chase turquoise water, golden-hour dunes, or a smooth door-to-door ride—your best Hurghada day starts here."}</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShipWheel, label: de ? "Inseltouren" : ru ? "Островные туры" : "Island Trips", href: "/hurghada/island-trips", description: de ? "Segle über türkisblaues Wasser zu entspannten Stränden am Roten Meer." : ru ? "Морские прогулки к спокойным пляжам Красного моря." : "Sail into turquoise water, barefoot beaches, and an unhurried Red Sea day.", cta: de ? "In See stechen" : ru ? "Выбрать тур" : "Set sail" },
              { icon: Waves, label: de ? "Tauchen & Schnorcheln" : ru ? "Дайвинг и снорклинг" : "Diving & Snorkeling", href: "/hurghada/diving-snorkeling", description: de ? "Entdecke Korallengärten und die farbenfrohe Unterwasserwelt des Roten Meeres." : ru ? "Откройте коралловые рифы и яркий подводный мир Красного моря." : "Meet coral gardens, bright reef life, and the clear blue world below the surface.", cta: de ? "Abtauchen" : ru ? "К морю" : "Dive in" },
              { icon: TentTree, label: de ? "Wüstensafari" : ru ? "Сафари в пустыне" : "Desert Safari", href: "/hurghada/desert-safaris", description: de ? "Erlebe Quads, Bergpanoramen und goldenen Sand im Licht des Sonnenuntergangs." : ru ? "Квадроциклы, горные виды и золотые пески на закате." : "Trade the shoreline for roaring quads, mountain views, and sunset-colored sand.", cta: de ? "Durch die Dünen" : ru ? "В пустыню" : "Ride the dunes" },
              { icon: Plane, label: de ? "Flughafentransfers" : ru ? "Трансфер из аэропорта" : "Airport Transfers", href: "/hurghada/airport-transfers", description: de ? "Dein Fahrer erwartet dich und bringt dich ohne Warteschlange direkt zum Hotel." : ru ? "Водитель встретит вас и без ожидания доставит прямо в отель." : "Land, meet your driver, and glide straight to your hotel—no queues or guesswork.", cta: de ? "Abholung planen" : ru ? "Заказать трансфер" : "Plan my pickup" },
              { icon: Landmark, label: de ? "Historische Ausflüge" : ru ? "Исторические экскурсии" : "Historical Tours", href: "/hurghada/historical-tours", description: de ? "Entdecke das alte Ägypten bei einem privaten Tagesausflug nach Luxor." : ru ? "Познакомьтесь с Древним Египтом во время частной поездки в Луксор." : "Step into ancient Egypt with a private Luxor day shaped around its greatest landmarks.", cta: de ? "Geschichte erleben" : ru ? "К истории" : "Travel through history" },
              { icon: Car, label: de ? "Private Transfers" : ru ? "Частные трансферы" : "Private Transfers", href: "/hurghada/private-transfers", description: de ? "Deine Route, deine Gruppe, dein Zeitplan – bequem von Tür zu Tür." : ru ? "Ваш маршрут, ваша группа и ваше расписание — комфортно от двери до двери." : "Your route, your group, your schedule—comfortable door-to-door travel around Hurghada.", cta: de ? "Privat fahren" : ru ? "Заказать поездку" : "Travel privately" },
            ].map(({ icon: Icon, label, href, description, cta }) => (
              <Link key={label} href={localePath(language, href)} className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg">
                <Icon className="text-cyan-700" size={28}/>
                <h3 className="mt-5 text-xl font-bold text-slate-900">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                <span className="mt-auto pt-5 text-sm font-bold text-blue-700">{cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">{t("chooseExperience")}</p>
              <h2 className="mt-3 text-4xl font-bold text-slate-900">{t("exploreAdventure")}</h2>
            </div>
            <Link href={`${homePath}#tours`} className="font-semibold text-blue-700 hover:text-blue-900">{t("viewAllTours")} →</Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <DestinationCard image="/images/hurghada-island-calm-sunset.jpeg" title={ru ? "Отдых на островах" : de ? "Inselerlebnisse" : "Island escapes"} description={ru ? "Морские прогулки, снорклинг и пляжный отдых на Красном море." : de ? "Bootsausflüge, Schnorcheln und Strandtage am Roten Meer." : "Boat trips, snorkeling and beach days on the Red Sea."} href={`${homePath}?search=island`} />
            <DestinationCard image="/images/hurghada-snorkeling-reef-panorama.jpeg" title={ru ? "Дайвинг и снорклинг" : de ? "Tauchen & Schnorcheln" : "Diving & Snorkeling"} description={de ? "Entdecke Korallengärten und die farbenfrohe Unterwasserwelt des Roten Meeres." : ru ? "Откройте коралловые рифы и яркий подводный мир Красного моря." : "Meet coral gardens, bright reef life, and the clear blue world below the surface."} href={localePath(language, "/hurghada/diving-snorkeling")} />
            <DestinationCard image="/images/hurghada-desert-camel-closeup.jpeg" title={ru ? "Приключения в пустыне" : de ? "Wüstenabenteuer" : "Desert adventures"} description={ru ? "Квадроциклы, культура бедуинов и незабываемые закаты." : de ? "Quads, Beduinenkultur und unvergessliche Sonnenuntergänge." : "Quad bikes, Bedouin culture and unforgettable sunsets."} href={`${homePath}?search=desert`} />
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
                    {de ? "Transfers" : ru ? "Трансферы" : "Transfers"}
                  </p>




                  <h3 className="
                    mt-2
                    break-words
                    text-3xl
                    font-bold
                    leading-tight
                    sm:text-4xl
                  ">
                    {de ? "Flughafen- und Hoteltransfer" : ru ? "Трансферы из аэропорта и отелей" : "Airport & Hotel Transfers"}
                  </h3>




                  <p className="
                    mt-4
                    text-gray-600
                  ">
                    {de ? "Private Transfers zwischen dem Flughafen Hurghada und den Hotels am Roten Meer." : ru ? "Частные трансферы между аэропортом Хургады и отелями Красного моря." : "Private transfers between Hurghada Airport and Red Sea hotels."}
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
                {de ? "Transfer buchen" : ru ? "Заказать трансфер" : "Book Transfer"}
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

{de ? "Gefunden:" : ru ? "Найдено:" : ar ? "تم العثور على:" : "Found"}

<span className="
mx-2
font-bold
text-blue-600
">

{filteredTours.length}

</span>

{de ? (filteredTours.length === 1 ? "Ausflug" : "Ausflüge") : ru ? "экскурсий" : ar ? "رحلات" : `tour${filteredTours.length === 1 ? "" : "s"}`}

{de ? "für:" : ru ? "по запросу:" : ar ? "للبحث:" : "for:"}

<span className="
ml-2
font-bold
text-blue-600
">

{search}

</span>


</div>

)}

          <div className="
            grid
            gap-8
            md:grid-cols-2
            lg:grid-cols-3
          ">



          {
            filteredTours.length > 0 ? (


              filteredTours.map((tour: Tour)=>(


                <TourCard

                  key={tour.slug}

                  image={tour.image}

                  title={tour.title}

                  rating={tour.rating}

                  price={tour.price}

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

                />


              ))


            ) : (



              <div className="
                col-span-full
                py-20
                text-center
                text-2xl
                text-gray-500
              ">

                {de ? "Keine passenden Ausflüge gefunden" : ru ? "Подходящие экскурсии не найдены" : ar ? "لم يتم العثور على رحلات مناسبة" : "No tours found"}

              </div>



            )

          }



          </div>




        </div>


      </section>

      <section className="bg-slate-950 px-6 py-20 text-white sm:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">{tr("Why Daily Red Sea", "Warum Daily Red Sea?", "Почему Daily Red Sea")}</p><h2 className="mt-4 text-4xl font-black">{tr("Local knowledge, easy booking, clear support.", "Lokale Erfahrung, einfache Buchung, klare Unterstützung.", "Местные знания, простое бронирование и понятная поддержка.")}</h2><p className="mt-5 leading-7 text-slate-300">{tr("We help you find the right Hurghada excursion with direct local support before your day begins.", "Wir helfen dir mit direkter lokaler Betreuung, den passenden Ausflug in Hurghada zu finden.", "Мы поможем выбрать подходящую экскурсию в Хургаде и поддержим вас до начала поездки.")}</p></div>{[
        {icon:ShieldCheck,title:tr("Trusted local partners","Vertrauenswürdige lokale Partner","Надёжные местные партнёры"),text:tr("Carefully selected crews, guides and drivers.","Sorgfältig ausgewählte Crews, Reiseführer und Fahrer.","Тщательно отобранные команды, гиды и водители.")},
        {icon:MessageCircle,title:tr("Easy WhatsApp booking","Einfache WhatsApp-Buchung","Простое бронирование в WhatsApp"),text:tr("Fast help for pickup, changes and questions.","Schnelle Hilfe bei Abholung, Änderungen und Fragen.","Быстрая помощь с трансфером, изменениями и вопросами.")},
        {icon:Headphones,title:tr("Helpful support","Hilfreiche Betreuung","Заботливая поддержка"),text:tr("Clear communication before your tour.","Klare Kommunikation vor deinem Ausflug.","Понятное общение перед экскурсией.")},
      ].map(({icon:Icon,title,text}) => <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6"><Icon className="text-cyan-300"/><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-300">{text}</p></div>)}</div></section>
      <HurghadaTravelGuide />

      <section id="about" className="bg-slate-50 px-8 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold">{tr("Your Red Sea adventure, made easy", "Dein Abenteuer am Roten Meer – einfach geplant", "Ваш отдых на Красном море — легко и удобно")}</h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            {tr("Daily Red Sea connects you with memorable Hurghada experiences, from island cruises and diving to desert adventures and private transfers.", "Daily Red Sea verbindet dich mit unvergesslichen Erlebnissen in Hurghada – von Insel- und Tauchausflügen bis zu Wüstenabenteuern und Privattransfers.", "Daily Red Sea предлагает яркие впечатления в Хургаде: островные прогулки, дайвинг, приключения в пустыне и частные трансферы.")}
          </p>
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-20 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="font-semibold uppercase tracking-[0.24em] text-blue-300">{tr("Why travel with us", "Warum mit uns reisen?", "Почему выбирают нас")}</p>
            <h2 className="mt-4 text-4xl font-bold">{tr("Plan with local Red Sea experts", "Plane mit lokalen Experten am Roten Meer", "Планируйте с местными экспертами Красного моря")}</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">{tr("Clear prices, hotel pickup options and friendly support make it simple to choose the right day out.", "Klare Preise, Hotelabholung und freundliche Betreuung erleichtern die Auswahl.", "Понятные цены, трансфер из отеля и дружелюбная поддержка помогают легко выбрать поездку.")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <ValueCard title={tr("Trusted local team","Vertrauenswürdiges lokales Team","Надёжная местная команда")} description={tr("Helpful advice before and after you book.","Hilfreiche Beratung vor und nach der Buchung.","Полезные советы до и после бронирования.")} />
            <ValueCard title={tr("Handpicked adventures","Ausgewählte Erlebnisse","Отобранные приключения")} description={tr("Popular island, sea and desert experiences.","Beliebte Insel-, Meeres- und Wüstenerlebnisse.","Популярные островные, морские и пустынные экскурсии.")} />
            <ValueCard title={tr("Easy WhatsApp booking","Einfache WhatsApp-Buchung","Простое бронирование в WhatsApp")} description={tr("Quick answers and practical trip support.","Schnelle Antworten und praktische Unterstützung.","Быстрые ответы и помощь с поездкой.")} />
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm sm:p-12">
          <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">{tr("Verified traveler feedback", "Verifiziertes Feedback von Reisenden", "Проверенные отзывы путешественников", "آراء المسافرين الموثّقة")}</p>
          <h2 className="mt-3 text-4xl font-black text-slate-900">{tr("See our real reviews on Google", "Unsere echten Google-Bewertungen ansehen", "Читайте реальные отзывы о нас в Google", "اطّلع على تقييماتنا الحقيقية على Google")}</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{tr("Ratings and customer comments are shown directly on our official Google profile, so you always see the latest verified feedback.", "Bewertungen und Kundenkommentare findest du direkt in unserem offiziellen Google-Profil – immer aktuell und verifiziert.", "Оценки и комментарии клиентов опубликованы в нашем официальном профиле Google, где всегда доступны актуальные проверенные отзывы.", "تظهر التقييمات وتعليقات العملاء مباشرةً في ملفنا الرسمي على Google لتشاهد دائمًا أحدث الآراء الموثّقة.")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={googleMapsUrl} onClick={() => trackEvent("google_review_click", { placement: "home_read_reviews" })} target="_blank" rel="noopener noreferrer" className="rounded-full bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800">{tr("Read Google reviews", "Google-Bewertungen lesen", "Читать отзывы в Google", "قراءة تقييمات Google")}</a>
            <a href={googleReviewUrl} onClick={() => trackEvent("google_review_click", { placement: "home_write_review" })} target="_blank" rel="noopener noreferrer" className="rounded-full border border-blue-200 bg-white px-6 py-3 font-bold text-blue-800 transition hover:bg-blue-50">{tr("Write a Google review", "Google-Bewertung abgeben", "Оставить отзыв в Google", "كتابة تقييم على Google")}</a>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 sm:px-8"><div className="mx-auto max-w-3xl"><p className="text-center font-semibold uppercase tracking-[0.24em] text-blue-600">{tr("Helpful answers","Hilfreiche Antworten","Полезные ответы")}</p><h2 className="mt-3 text-center text-4xl font-black text-slate-900">{tr("Hurghada excursions FAQ","FAQ zu Ausflügen in Hurghada","Вопросы об экскурсиях в Хургаде")}</h2><div className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-6">{(de ? [["Wie buche ich einen Ausflug?","Wähle einen Ausflug, Datum und Reisende und sende deine Buchung. Die Details bestätigen wir per WhatsApp."],["Ist die Hotelabholung verfügbar?","Viele Ausflüge beinhalten oder bieten eine Hotelabholung. Prüfe die Ausflugsdetails und gib dein Hotel bei der Buchung an."],["Wann bezahle ich?","Barzahlung bei Ankunft wird vor der Bestätigung klar angezeigt. Gesamtpreis und Zahlungsstatus stehen auch in der PDF-Bestätigung."],["Kann ich meine Buchung ändern?","Kontaktiere uns so früh wie möglich per WhatsApp. Wir prüfen die Verfügbarkeit und helfen dir."]] : ru ? [["Как забронировать экскурсию?","Выберите экскурсию, дату и гостей, затем отправьте заявку. Детали мы подтвердим в WhatsApp."],["Есть ли трансфер из отеля?","Многие экскурсии включают или предлагают трансфер. Проверьте описание и укажите отель при бронировании."],["Когда оплачивать?","Оплата наличными по прибытии ясно указывается перед подтверждением. Сумма и статус оплаты также есть в PDF."],["Можно изменить бронирование?","Свяжитесь с нами в WhatsApp как можно раньше. Мы проверим наличие мест и поможем."]] : [["How do I book a tour?","Choose a tour, select your date and travelers, then submit your booking. We confirm practical details with you on WhatsApp."],["Is hotel pickup available?","Many Hurghada tours include or offer hotel pickup. Check the tour details and add your hotel during booking."],["When do I pay?","Cash-on-arrival bookings are clearly shown before you confirm. Your total and payment status also appear on your PDF confirmation."],["Can I change my booking?","Contact us on WhatsApp as early as possible. We will check availability and help where possible."]]).map(([question,answer]) => <details key={question} className="py-5"><summary className="cursor-pointer font-bold text-slate-900">{question}</summary><p className="mt-3 leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>

      <section className="bg-blue-600 px-6 py-20 text-center text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="font-semibold uppercase tracking-[0.24em] text-blue-100">{tr("Start planning","Jetzt planen","Начните планировать")}</p>
          <h2 className="mt-4 text-4xl font-bold">{tr("Ready for your Red Sea adventure?","Bereit für dein Abenteuer am Roten Meer?","Готовы к приключению на Красном море?")}</h2>
          <p className="mt-5 text-lg text-blue-100">{tr("Message our local team and we’ll help you find the right tour for your stay.","Schreibe unserem lokalen Team – wir helfen dir, den passenden Ausflug zu finden.","Напишите нашей местной команде, и мы поможем выбрать экскурсию.")}</p>
          <a href={whatsappUrl(tr("Hello Daily Red Sea, I would like help planning my trip.","Hallo Daily Red Sea, ich möchte Hilfe bei der Reiseplanung.","Здравствуйте! Помогите мне спланировать поездку."))} onClick={() => trackEvent("whatsapp_click", { placement: "home_cta" })} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-xl bg-white px-7 py-4 font-semibold text-blue-700 transition hover:bg-blue-50">{tr("Plan on WhatsApp","Über WhatsApp planen","Спланировать в WhatsApp")}</a>
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
              <Link className="block hover:text-white" href={`${homePath}#tours`}>{t("tours")}</Link>
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
              <a className="block font-semibold text-amber-300 hover:text-amber-200" href={googleReviewUrl} onClick={() => trackEvent("google_review_click", { placement: "footer" })} target="_blank" rel="noopener noreferrer">★ {tr("Review us on Google", "Google-Bewertung abgeben", "Оставить отзыв в Google", "قيّمنا على Google")}</a>
              <Link className="block hover:text-white" href={localePath(language, "/privacy-policy")}>{tr("Privacy Policy","Datenschutz","Политика конфиденциальности")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/terms-conditions")}>{tr("Terms & Conditions","Allgemeine Geschäftsbedingungen","Условия использования")}</Link>
              <Link className="block hover:text-white" href="/image-credits">{tr("Image Credits","Bildnachweise","Источники изображений")}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/contact")}>{tr("Contact us","Kontakt","Связаться с нами")}</Link>
              <Link className="block hover:text-white" href="/blog">{language === "de" ? "Blog" : language === "ru" ? "Блог" : language === "ar" ? "المدونة" : language === "zh" ? "旅游指南" : "Blog"}</Link>
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
