"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import Hero from "@/components/home/Hero";
import TourCard from "@/components/cards/TourCard";

import { Car, Search } from "lucide-react";

import { tours, type Tour } from "@/data/tours";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";



export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { t } = useSiteSettings();
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
    router.replace(query ? `/?${query}` : "/", { scroll: false });
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






  return (

    <>


      <Hero />

      <section className="bg-slate-50 px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">{t("chooseExperience")}</p>
              <h2 className="mt-3 text-4xl font-bold text-slate-900">{t("exploreAdventure")}</h2>
            </div>
            <Link href="/#tours" className="font-semibold text-blue-700 hover:text-blue-900">{t("viewAllTours")} →</Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <DestinationCard image="/images/orange-bay.jpeg" title="Island escapes" description="Boat trips, snorkeling and beach days on the Red Sea." href="/?search=island" />
            <DestinationCard image="/images/scuba-diving.jpg" title="Diving & snorkeling" description="Discover coral reefs with experienced local crews." href="/?search=diving" />
            <DestinationCard image="/images/desert-safari.jpg" title="Desert adventures" description="Quad bikes, Bedouin culture and unforgettable sunsets." href="/?search=desert" />
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
                href="/transfers#book-transfer"
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

                  title={tour.title}

                  rating={tour.rating}

                  price={tour.price}

                  link={`/tours/${tour.slug}${bookingQueryString ? `?${bookingQueryString}` : ""}`}

                  location={tour.location}

                  duration={tour.duration}

                  description={tour.description}

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

      <section className="bg-blue-600 px-6 py-20 text-center text-white sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="font-semibold uppercase tracking-[0.24em] text-blue-100">Start planning</p>
          <h2 className="mt-4 text-4xl font-bold">Ready for your Red Sea adventure?</h2>
          <p className="mt-5 text-lg text-blue-100">Message our local team and we’ll help you find the right tour for your stay.</p>
          <a href="https://wa.me/201004933150?text=Hello%20Daily%20Red%20Sea%2C%20I%20would%20like%20help%20planning%20my%20trip." target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-xl bg-white px-7 py-4 font-semibold text-blue-700 transition hover:bg-blue-50">Plan on WhatsApp</a>
        </div>
      </section>

      <footer className="bg-slate-950 px-6 py-12 text-slate-300 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="text-xl font-bold text-white">Daily Red Sea</p>
            <p className="mt-3 max-w-sm leading-relaxed">Tours, excursions and private transfers for unforgettable days in Hurghada.</p>
          </div>
          <div>
            <p className="font-semibold text-white">Explore</p>
            <div className="mt-3 space-y-2">
              <Link className="block hover:text-white" href="/#tours">Tours</Link>
              <Link className="block hover:text-white" href="/transfers">Transfers</Link>
              <Link className="block hover:text-white" href="/booking">Booking</Link>
              <Link className="block hover:text-white" href="/checkout">Checkout</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Need help?</p>
            <a className="mt-3 inline-block hover:text-white" href="https://wa.me/201004933150" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            <div className="mt-4 space-y-2 text-sm">
              <Link className="block hover:text-white" href="/privacy-policy">Privacy Policy</Link>
              <Link className="block hover:text-white" href="/terms-conditions">Terms & Conditions</Link>
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
