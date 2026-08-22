"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath } from "@/lib/i18n";
import { getImageProps } from "next/image";
import ImageWatermark from "@/components/media/ImageWatermark";

const heroImageCommon = {
  alt: "Red Sea experiences including desert, ancient Egyptian temples, boat trips, and scuba diving",
  sizes: "100vw",
};
const { props: { srcSet: desktopHeroSrcSet } } = getImageProps({
  ...heroImageCommon,
  src: "/images/hero-egypt-red-sea.jpg",
  width: 1672,
  height: 941,
  quality: 75,
});
const { props: { srcSet: mobileHeroSrcSet, ...mobileHeroProps } } = getImageProps({
  ...heroImageCommon,
  src: "/images/hero-egypt-red-sea-mobile.jpg",
  width: 941,
  height: 1672,
  quality: 75,
});

export default function Hero() {

  const router = useRouter();
  const { t, language } = useSiteSettings();

  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("1");
  const [greetingKey, setGreetingKey] = useState<"goodMorning" | "goodAfternoon" | "goodEvening" | null>(null);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      setGreetingKey(hour < 12 ? "goodMorning" : hour < 18 ? "goodAfternoon" : "goodEvening");
    };
    updateGreeting();
    const intervalId = window.setInterval(updateGreeting, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);


  function searchTours() {

    const selectedDestination = destination.toLowerCase().trim();


    if (!selectedDestination) {
      alert(t("destination"));
      return;
    }


    const params = new URLSearchParams();

    params.set("destination", selectedDestination);


    if (date) {
      params.set("date", date);
    }


    if (guests) {
      params.set("guests", guests);
    }


    router.push(`${localePath(language, "/tours")}?${params.toString()}`);

  }



  return (

    <section
      className="
      relative
      min-h-[640px]
      sm:min-h-[820px]
      "
    >

      <picture className="absolute inset-0 block">
        <source media="(min-width: 640px)" srcSet={desktopHeroSrcSet} />
        <source media="(max-width: 639px)" srcSet={mobileHeroSrcSet} />
        <img {...mobileHeroProps} alt={heroImageCommon.alt} fetchPriority="high" className="h-full w-full object-cover" />
      </picture>
      <ImageWatermark prominent />

      <div
        className="
        absolute
        inset-0
        bg-gradient-to-b
        from-black/55
        via-black/25
        to-black/55
        sm:from-black/70
        sm:via-black/40
        sm:to-black/60
        "
      />


      <div
        className="
        relative
        z-10
        flex
        min-h-[640px]
        justify-start
        pb-64
        pt-28
        sm:min-h-[820px]
        sm:justify-center
        sm:pb-44
        sm:pt-32
        flex-col
        items-center
        justify-center
        px-6
        text-center
        "
      >


        <div className="max-w-4xl text-white">
          <p className={`mb-4 text-base font-bold text-white transition-opacity sm:text-lg ${greetingKey ? "opacity-100" : "opacity-0"}`} aria-live="polite">
            {greetingKey ? `${t(greetingKey)} 👋` : "\u00a0"}
          </p>
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md sm:mb-8 sm:gap-3 sm:px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200 sm:text-sm sm:tracking-[0.35em]">
              {t("discoverHurghada")}
            </span>
          </div>

          <h1 className="text-4xl font-black leading-[1.04] sm:text-6xl md:text-7xl">
            {t("heroTitle")}
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-100 sm:mt-6 sm:text-lg md:text-xl">
            {t("heroDescription")}
          </p>

          <div className="mt-6 hidden flex-wrap justify-center gap-3 sm:flex">
            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-100 backdrop-blur">
              ✨ {t("privateTransfers")}
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-100 backdrop-blur">
              🌊 {t("boatTrips")}
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-100 backdrop-blur">
              🏜 {t("desertAdventures")}
            </div>
          </div>
        </div>

      </div>





      {/* SEARCH BOX */}

      <div
        className="
        absolute
        bottom-8
        left-1/2
        z-20
        w-full
        max-w-6xl
        -translate-x-1/2
        px-4
        sm:bottom-12
        sm:px-6
        "
      >


        <div
          className="
          rounded-2xl
          border border-slate-200/80
          bg-white
          p-3
          sm:rounded-[1.75rem]
          sm:p-6
          shadow-[0_25px_80px_-20px_rgba(15,23,42,0.35)]
          "
        >


          <div
            className="
            grid
            grid-cols-2
            gap-2.5
            sm:gap-4
            md:grid-cols-4
            "
          >



            {/* Destination */}

            <div
              className="
              rounded-xl
              border
              bg-gray-50
              p-2
              sm:p-3
              "
            >


              <label
                className="
                text-xs
                font-medium
                text-gray-500
                sm:text-sm
                "
              >
                {t("destination")}
              </label>


              <div className="flex items-center gap-2 sm:gap-3">


                <MapPin className="size-4 shrink-0 text-blue-600 sm:size-5"/>


                <select

                  value={destination}

                  onChange={(e)=>
                    setDestination(e.target.value)
                  }

                  aria-label={t("destination")}
                  className="
                  w-full
                  bg-transparent
                  outline-none
                  "

                ><option value="">{t("searchPlaceholder")}</option><option value="hurghada">Hurghada</option><option value="marsa-alam">Marsa Alam</option><option value="jeddah">Jeddah</option></select>


              </div>


            </div>






            {/* Date */}


            <div
              className="
              rounded-xl
              border
              bg-gray-50
              p-2
              sm:p-3
              "
            >


              <label
                className="
                text-xs
                font-medium
                text-gray-500
                sm:text-sm
                "
              >
                {t("travelDate")}
              </label>


              <div className="flex items-center gap-2 sm:gap-3">


                <Calendar className="size-4 shrink-0 text-blue-600 sm:size-5"/>


                <input

                  type="date"

                  value={date}

                  onChange={(e)=>
                    setDate(e.target.value)
                  }

                  className="
                  w-full
                  bg-transparent
                  outline-none
                  "

                />


              </div>


            </div>






            {/* Guests */}


            <div
              className="
              rounded-xl
              border
              bg-gray-50
              p-2
              sm:p-3
              "
            >


              <label
                className="
                text-xs
                font-medium
                text-gray-500
                sm:text-sm
                "
              >
                {t("guests")}
              </label>


              <div className="flex items-center gap-2 sm:gap-3">


                <Users className="size-4 shrink-0 text-blue-600 sm:size-5"/>


                <input

                  type="number"

                  min="1"

                  value={guests}

                  onChange={(e)=>
                    setGuests(e.target.value)
                  }

                  className="
                  w-full
                  bg-transparent
                  outline-none
                  "

                />


              </div>


            </div>







            {/* Button */}


            <button

              onClick={searchTours}

              className="
              col-span-2
              rounded-xl
              bg-blue-600
              px-6
              py-3
              font-semibold
              text-white
              transition
              hover:bg-blue-700
              sm:py-4
              md:col-span-1
              "

            >

              {t("searchTours")}

            </button>




          </div>


        </div>


      </div>



    </section>

  );

}
