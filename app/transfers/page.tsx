import { Car, Clock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import TransferBookingForm from "@/components/booking/TransferBookingForm";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Private Hurghada Airport & Hotel Transfers",
  description: "Arrange a safe private transfer between Hurghada Airport, hotels, resorts, marinas, and local destinations with Daily Red Sea.",
  path: "/transfers",
  image: "/images/hurghada-airport-transfer.jpg",
});

export default function TransfersPage() {

  return (

    <main className="bg-white">


      {/* Hero */}

      <section className="
        relative
        h-[60vh]
        bg-cover
        bg-center
      "
      style={{
        backgroundImage:
        "url('/images/transfer.jpg')"
      }}
      >

        <div className="
          absolute
          inset-0
          bg-black/50
        "/>


        <div className="
          relative
          z-10
          flex
          h-full
          items-center
          justify-center
          px-6
          text-center
          text-white
        ">


          <div>


            <h1 className="
              text-5xl
              font-bold
            ">
              Airport & Hotel Transfers
            </h1>


            <p className="
              mt-5
              text-xl
            ">
              Safe, comfortable private transfers in Hurghada
            </p>


          </div>


        </div>


      </section>

      <section id="book-transfer" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">Private transfers</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-900">Travel comfortably from door to door</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">Send your route and travel details. Our team will reply on WhatsApp with availability and a clear quote before anything is confirmed.</p>
            <ul className="mt-7 space-y-3 text-slate-700"><li>✓ Airport arrivals and departures</li><li>✓ Hotel, resort and marina pickups</li><li>✓ Flexible private vehicles for your group</li></ul>
          </div>
          <TransferBookingForm />
        </div>
      </section>





      {/* Services */}


      <section className="
        mx-auto
        max-w-6xl
        px-6
        py-20
      ">


        <h2 className="
          text-center
          text-4xl
          font-bold
        ">
          Why Choose Our Transfers?
        </h2>



        <div className="
          mt-12
          grid
          gap-8
          md:grid-cols-3
        ">



          <div className="rounded-2xl bg-gray-50 p-8">

            <Car className="text-blue-600"/>

            <h3 className="mt-4 text-xl font-bold">
              Private Vehicles
            </h3>


            <p className="mt-3 text-gray-600">
              Comfortable cars with professional drivers.
            </p>

          </div>





          <div className="rounded-2xl bg-gray-50 p-8">

            <Clock className="text-blue-600"/>

            <h3 className="mt-4 text-xl font-bold">
              On Time Service
            </h3>


            <p className="mt-3 text-gray-600">
              Airport pickup available day and night.
            </p>

          </div>





          <div className="rounded-2xl bg-gray-50 p-8">

            <ShieldCheck className="text-blue-600"/>

            <h3 className="mt-4 text-xl font-bold">
              Safe & Reliable
            </h3>


            <p className="mt-3 text-gray-600">
              Experienced drivers and clean vehicles.
            </p>

          </div>



        </div>



      </section>





      {/* Destinations */}


      <section className="
        bg-gray-50
        py-20
      ">


        <div className="
          mx-auto
          max-w-6xl
          px-6
        ">


          <h2 className="
            text-4xl
            font-bold
          ">
            Transfer Areas
          </h2>



          <div className="
            mt-8
            grid
            gap-4
            md:grid-cols-2
          ">


            <div className="rounded-xl bg-white p-5 shadow">
              📍 Hurghada Airport
            </div>


            <div className="rounded-xl bg-white p-5 shadow">
              📍 Makadi Bay
            </div>


            <div className="rounded-xl bg-white p-5 shadow">
              📍 El Gouna
            </div>


            <div className="rounded-xl bg-white p-5 shadow">
              📍 Soma Bay
            </div>


          </div>



        </div>


      </section>



    </main>

  );
}
