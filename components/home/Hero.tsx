"use client";

import { useState } from "react";
import { MapPin, Calendar, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath } from "@/lib/i18n";


export default function Hero() {

  const router = useRouter();
  const { t, language } = useSiteSettings();

  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("1");


  function searchTours() {

    const search = destination.toLowerCase().trim();


    if (!search) {
      alert(t("destination"));
      return;
    }


    const params = new URLSearchParams();

    params.set("search", search);


    if (date) {
      params.set("date", date);
    }


    if (guests) {
      params.set("guests", guests);
    }


    router.push(`${localePath(language)}?${params.toString()}`);

  }



  return (

    <section
      className="
      relative
      min-h-screen
      bg-cover
      bg-center
      "
      style={{
        backgroundImage:"url('/images/hero.jpg')"
      }}
    >


      <div
        className="
        absolute
        inset-0
        bg-gradient-to-b
        from-black/70
        via-black/40
        to-black/60
        "
      />


      <div
        className="
        relative
        z-10
        flex
        min-h-screen
        flex-col
        items-center
        justify-center
        px-6
        text-center
        "
      >


        <div className="max-w-4xl text-white">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">
              {t("discoverHurghada")}
            </span>
          </div>

          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            {t("heroTitle")}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
            {t("heroDescription")}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
        bottom-16
        left-1/2
        z-20
        w-full
        max-w-6xl
        -translate-x-1/2
        px-6
        "
      >


        <div
          className="
          rounded-[1.75rem]
          border border-slate-200/80
          bg-white
          p-6
          shadow-[0_25px_80px_-20px_rgba(15,23,42,0.35)]
          "
        >


          <div
            className="
            grid
            gap-4
            md:grid-cols-4
            "
          >



            {/* Destination */}

            <div
              className="
              rounded-xl
              border
              bg-gray-50
              p-3
              "
            >


              <label
                className="
                text-sm
                font-medium
                text-gray-500
                "
              >
                {t("destination")}
              </label>


              <div className="flex items-center gap-3">


                <MapPin className="text-blue-600"/>


                <input

                  value={destination}

                  onChange={(e)=>
                    setDestination(e.target.value)
                  }

                  onKeyDown={(e)=>{

                    if(e.key==="Enter"){
                      searchTours();
                    }

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






            {/* Date */}


            <div
              className="
              rounded-xl
              border
              bg-gray-50
              p-3
              "
            >


              <label
                className="
                text-sm
                font-medium
                text-gray-500
                "
              >
                {t("travelDate")}
              </label>


              <div className="flex items-center gap-3">


                <Calendar className="text-blue-600"/>


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
              p-3
              "
            >


              <label
                className="
                text-sm
                font-medium
                text-gray-500
                "
              >
                {t("guests")}
              </label>


              <div className="flex items-center gap-3">


                <Users className="text-blue-600"/>


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
              rounded-xl
              bg-blue-600
              px-6
              py-4
              font-semibold
              text-white
              transition
              hover:bg-blue-700
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
