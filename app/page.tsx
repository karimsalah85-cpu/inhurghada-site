"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import Hero from "@/components/home/Hero";
import TourCard from "@/components/cards/TourCard";

import { Car, Search, BadgeCheck, ShipWheel, Waves, TentTree, Plane, Landmark, MessageCircle, ShieldCheck, Headphones } from "lucide-react";

import { tours, type Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/contact";
import HurghadaTravelGuide from "@/components/home/HurghadaTravelGuide";
import SocialLinks from "@/components/layout/SocialLinks";
import { localePath } from "@/lib/i18n";
import { germanTourTitle } from "@/lib/tour-localization";



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
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get("search") ?? "";
  const toursSection = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!search) return;

    const timeoutId = window.setTimeout(() => {
      toursSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  function updateSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set("search", value.toLowerCase());
    } else {
      params.delete("search");
    }

    const query = params.toString();
    if (value.trim()) trackEvent("search", { search_term: value.trim().toLowerCase() });
    router.replace(query ? `${homePath}?${query}` : homePath, { scroll: false });
  }

  const bookingQuery = new URLSearchParams();
  const date = searchParams.get("date");
  const guests = searchParams.get("guests");

  if (date) bookingQuery.set("date", date);
  if (guests) bookingQuery.set("guests", guests);

  const bookingQueryString = bookingQuery.toString();






  const filteredTours = tours.filter(
  (tour: Tour)=>{


    const searchableText = [

      tour.title,

      tour.description,

      tour.location,

      tour.duration,

      ...tour.highlights,

    ]
    .join(" ")
    .toLowerCase();



    const searchWords = search
      .toLowerCase()
      .trim()
      .split(" ")
      .filter(Boolean);



    return searchWords.every((word)=>


      searchableText.includes(word)


    );


  }
);

  const tourOrder = ["orange-bay", "full-day-snorkeling", "full-day-diving", "mahmya-island", "quad-safari-morning", "quad-safari-sunset", "hurghada-airport-transfer", "senzo-transfer"];
  filteredTours.sort((left, right) => {
    const leftIndex = tourOrder.indexOf(left.slug);
    const rightIndex = tourOrder.indexOf(right.slug);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });






  return (

    <>


      <Hero />

      <section className="bg-white px-6 py-10 sm:px-8"><div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-3">{(de ? ["Lokaler Anbieter in Hurghada", "Faire Preise", "Hotelabholung verfügbar", "Schnelle WhatsApp-Buchung", "Deutschsprachige Betreuung", "Keine versteckten Gebühren"] : ["Local Hurghada operator", "Best value prices", "Hotel pickup available", "Instant WhatsApp booking", "English-speaking support", "No hidden fees"]).map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700"><BadgeCheck className="shrink-0 text-emerald-600" size={19}/>{item}</div>)}</div></section>

      <section className="bg-slate-50 px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">{de ? "Wähle deinen Stil" : "Choose your style"}</p>
            <h2 className="mt-3 text-4xl font-black text-slate-900">{de ? "Hurghada-Erlebnisse für jeden Plan" : "Hurghada experiences for every plan"}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">{de ? "Türkisblaues Wasser, goldene Wüstendünen oder eine bequeme Fahrt von Tür zu Tür – dein perfekter Tag in Hurghada beginnt hier." : "Chase turquoise water, golden-hour dunes, or a smooth door-to-door ride—your best Hurghada day starts here."}</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShipWheel, label: de ? "Inseltouren" : "Island Trips", href: "/hurghada/island-trips", description: de ? "Segle über türkisblaues Wasser zu entspannten Stränden am Roten Meer." : "Sail into turquoise water, barefoot beaches, and an unhurried Red Sea day.", cta: de ? "In See stechen" : "Set sail" },
              { icon: Waves, label: de ? "Tauchen & Schnorcheln" : "Diving & Snorkeling", href: "/hurghada/diving-snorkeling", description: de ? "Entdecke Korallengärten und die farbenfrohe Unterwasserwelt des Roten Meeres." : "Meet coral gardens, bright reef life, and the clear blue world below the surface.", cta: de ? "Abtauchen" : "Dive in" },
              { icon: TentTree, label: de ? "Wüstensafari" : "Desert Safari", href: "/hurghada/desert-safaris", description: de ? "Erlebe Quads, Bergpanoramen und goldenen Sand im Licht des Sonnenuntergangs." : "Trade the shoreline for roaring quads, mountain views, and sunset-colored sand.", cta: de ? "Durch die Dünen" : "Ride the dunes" },
              { icon: Plane, label: de ? "Flughafentransfers" : "Airport Transfers", href: "/hurghada/airport-transfers", description: de ? "Dein Fahrer erwartet dich und bringt dich ohne Warteschlange direkt zum Hotel." : "Land, meet your driver, and glide straight to your hotel—no queues or guesswork.", cta: de ? "Abholung planen" : "Plan my pickup" },
              { icon: Landmark, label: de ? "Historische Ausflüge" : "Historical Tours", href: "/hurghada/historical-tours", description: de ? "Entdecke das alte Ägypten bei einem privaten Tagesausflug nach Luxor." : "Step into ancient Egypt with a private Luxor day shaped around its greatest landmarks.", cta: de ? "Geschichte erleben" : "Travel through history" },
              { icon: Car, label: de ? "Private Transfers" : "Private Transfers", href: "/hurghada/private-transfers", description: de ? "Deine Route, deine Gruppe, dein Zeitplan – bequem von Tür zu Tür." : "Your route, your group, your schedule—comfortable door-to-door travel around Hurghada.", cta: de ? "Privat fahren" : "Travel privately" },
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
            <DestinationCard image="/images/orange-bay.jpeg" title="Island escapes" description="Boat trips, snorkeling and beach days on the Red Sea." href={`${homePath}?search=island`} />
            <DestinationCard image="/images/scuba-diving.jpg" title="Diving & snorkeling" description="Discover coral reefs with experienced local crews." href={`${homePath}?search=diving`} />
            <DestinationCard image="/images/desert-safari.jpg" title="Desert adventures" description="Quad bikes, Bedouin culture and unforgettable sunsets." href={`${homePath}?search=desert`} />
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

    updateSearch(value);


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



          <div className="
            mb-20
            rounded-3xl
            border
            bg-gradient-to-r
            from-slate-50
            to-white
            p-12
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
                items-start
                gap-5
              ">


                <div className="
                  rounded-2xl
                  bg-blue-100
                  p-4
                ">


                  <Car
                    size={34}
                    className="text-blue-600"
                  />


                </div>




                <div>


                  <p className="
                    font-semibold
                    uppercase
                    tracking-[0.35em]
                    text-blue-600
                  ">
                    Transfers
                  </p>




                  <h3 className="
                    mt-2
                    text-4xl
                    font-bold
                  ">
                    Airport & Hotel Transfers
                  </h3>




                  <p className="
                    mt-4
                    text-gray-600
                  ">
                    Private transfers between Hurghada Airport
                    and Red Sea hotels.
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
                font-semibold
                text-white
                hover:bg-blue-700
                "
              >
                Book Transfer
              </Link>



            </div>


          </div>






{search && (

<div className="
mb-8
rounded-xl
bg-blue-50
p-4
text-center
text-blue-700
font-medium
">

Showing results for:
<strong className="ml-2">
{search}
</strong>

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

Found

<span className="
mx-2
font-bold
text-blue-600
">

{filteredTours.length}

</span>

tour
{filteredTours.length !== 1 && "s"}

for:

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

                  title={de ? germanTourTitle(tour.slug, tour.title) : tour.title}

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

                No tours found

              </div>



            )

          }



          </div>




        </div>


      </section>

      <section className="bg-slate-950 px-6 py-20 text-white sm:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Why Daily Red Sea</p><h2 className="mt-4 text-4xl font-black">Local knowledge, easy booking, clear support.</h2><p className="mt-5 leading-7 text-slate-300">We help you find the right Hurghada excursion with direct local support before your day begins.</p></div>{[{icon:ShieldCheck,title:"Trusted local partners",text:"Carefully selected crews, guides and drivers."},{icon:MessageCircle,title:"Easy WhatsApp booking",text:"Fast help for pickup, changes and questions."},{icon:Headphones,title:"Helpful support",text:"Clear communication in English before your tour."}].map(({icon:Icon,title,text}) => <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6"><Icon className="text-cyan-300"/><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-300">{text}</p></div>)}</div></section>
      <HurghadaTravelGuide />

      <section id="about" className="bg-slate-50 px-8 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold">Your Red Sea adventure, made easy</h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            Daily Red Sea connects you with memorable Hurghada experiences, from island cruises and diving to desert adventures and private transfers.
          </p>
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-20 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="font-semibold uppercase tracking-[0.24em] text-blue-300">Why travel with us</p>
            <h2 className="mt-4 text-4xl font-bold">Plan with local Red Sea experts</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">Clear prices, hotel pickup options and friendly support make it simple to choose the right day out.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <ValueCard title="Trusted local team" description="Helpful advice before and after you book." />
            <ValueCard title="Handpicked adventures" description="Popular island, sea and desert experiences." />
            <ValueCard title="Easy WhatsApp booking" description="Quick answers and practical trip support." />
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-semibold uppercase tracking-[0.24em] text-blue-600">Traveler feedback</p><h2 className="mt-3 text-4xl font-black text-slate-900">Loved by Red Sea travelers</h2></div><p className="text-xl font-bold text-amber-500">★★★★★ <span className="text-slate-900">4.9/5</span></p></div><div className="mt-9 grid gap-5 md:grid-cols-3">{[["Claire, United Kingdom","Easy booking and clear pickup communication. Orange Bay was a lovely day for our family."],["Mariam, Germany","The team answered quickly on WhatsApp and the transfer arrived exactly as arranged."],["Omar, Egypt","Good value, friendly crew and beautiful snorkeling stops. Everything was straightforward."]].map(([name,review]) => <figure key={name} className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><p className="text-amber-500">★★★★★</p><blockquote className="mt-4 leading-7 text-slate-700">“{review}”</blockquote><figcaption className="mt-5 font-bold text-slate-900">{name}</figcaption></figure>)}</div></div></section>

      <section className="bg-slate-50 px-6 py-20 sm:px-8"><div className="mx-auto max-w-3xl"><p className="text-center font-semibold uppercase tracking-[0.24em] text-blue-600">Helpful answers</p><h2 className="mt-3 text-center text-4xl font-black text-slate-900">Hurghada excursions FAQ</h2><div className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-6">{[["How do I book a tour?","Choose a tour, select your date and travelers, then submit your booking. We confirm practical details with you on WhatsApp."],["Is hotel pickup available?","Many Hurghada tours include or offer hotel pickup. Check the tour details and add your hotel during booking."],["When do I pay?","Cash-on-arrival bookings are clearly shown before you confirm. Your total and payment status also appear on your PDF confirmation."],["Can I change my booking?","Contact us on WhatsApp as early as possible. We will check availability and help where possible."]].map(([question,answer]) => <details key={question} className="py-5"><summary className="cursor-pointer font-bold text-slate-900">{question}</summary><p className="mt-3 leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>

      <section className="bg-blue-600 px-6 py-20 text-center text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="font-semibold uppercase tracking-[0.24em] text-blue-100">Start planning</p>
          <h2 className="mt-4 text-4xl font-bold">Ready for your Red Sea adventure?</h2>
          <p className="mt-5 text-lg text-blue-100">Message our local team and we’ll help you find the right tour for your stay.</p>
          <a href={whatsappUrl("Hello Daily Red Sea, I would like help planning my trip.")} onClick={() => trackEvent("whatsapp_click", { placement: "home_cta" })} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-xl bg-white px-7 py-4 font-semibold text-blue-700 transition hover:bg-blue-50">Plan on WhatsApp</a>
        </div>
      </section>

      <footer className="bg-slate-950 px-6 py-12 text-slate-300 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="text-xl font-bold text-white">Daily Red Sea</p>
            <p className="mt-3 max-w-sm leading-relaxed">Tours, excursions and private transfers for unforgettable days in Hurghada.</p>
            <SocialLinks className="mt-5" dark />
          </div>
          <div>
            <p className="font-semibold text-white">Explore</p>
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
            <p className="font-semibold text-white">Need help?</p>
            <a className="mt-3 inline-block hover:text-white" href={whatsappUrl()} onClick={() => trackEvent("whatsapp_click", { placement: "footer" })} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            <div className="mt-4 space-y-2 text-sm">
              <Link className="block hover:text-white" href={localePath(language, "/privacy-policy")}>{language === "de" ? "Datenschutz" : "Privacy Policy"}</Link>
              <Link className="block hover:text-white" href={localePath(language, "/terms-conditions")}>{language === "de" ? "Allgemeine Geschäftsbedingungen" : "Terms & Conditions"}</Link>
              <Link className="block hover:text-white" href="/image-credits">Image Credits</Link>
              <Link className="block hover:text-white" href={localePath(language, "/contact")}>{language === "de" ? "Kontakt" : "Contact us"}</Link>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-7xl border-t border-slate-800 pt-6 text-sm">© {new Date().getFullYear()} Daily Red Sea. All rights reserved.</p>
      </footer>


    </>

  );

}

function DestinationCard({ image, title, description, href }: { image: string; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="group relative min-h-80 overflow-hidden rounded-3xl bg-slate-900 shadow-lg">
      <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-7 text-white"><h3 className="text-2xl font-bold">{title}</h3><p className="mt-2 text-slate-200">{description}</p><span className="mt-4 inline-block font-semibold text-blue-200">Explore →</span></div>
    </Link>
  );
}

function ValueCard({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6"><h3 className="font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p></div>;
}
