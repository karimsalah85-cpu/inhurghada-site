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

export default function TransfersPage({ locale = "en" }: { locale?: "en" | "de" | "ru" | "ar" | "zh" }) {
  const de = locale === "de";
  const zh = locale === "zh";

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
              {de ? "Flughafen- & Hoteltransfers" : zh ? "机场与酒店接送" : "Airport & Hotel Transfers"}
            </h1>


            <p className="
              mt-5
              text-xl
            ">
              {de ? "Sichere, komfortable Privattransfers in Hurghada" : zh ? "安全舒适的赫尔格达私人接送" : "Safe, comfortable private transfers in Hurghada"}
            </p>


          </div>


        </div>


      </section>

      <section id="book-transfer" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">{de ? "Private Transfers" : zh ? "私人接送" : "Private transfers"}</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-900">{de ? "Bequem von Tür zu Tür reisen" : zh ? "舒适的门到门出行" : "Travel comfortably from door to door"}</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">{de ? "Sende uns deine Route und Reisedaten. Unser Team antwortet per WhatsApp mit Verfügbarkeit und einem klaren Preis, bevor etwas bestätigt wird." : zh ? "发送您的路线和出行信息。确认前，我们的团队会通过 WhatsApp 回复名额和透明报价。" : "Send your route and travel details. Our team will reply on WhatsApp with availability and a clear quote before anything is confirmed."}</p>
            <ul className="mt-7 space-y-3 text-slate-700"><li>✓ {de ? "Ankunft und Abfahrt am Flughafen" : zh ? "机场抵达与出发接送" : "Airport arrivals and departures"}</li><li>✓ {de ? "Abholung an Hotels, Resorts und Marinas" : zh ? "酒店、度假村和码头接送" : "Hotel, resort and marina pickups"}</li><li>✓ {de ? "Passende Privatfahrzeuge für deine Gruppe" : zh ? "适合您团队人数的私人车辆" : "Flexible private vehicles for your group"}</li></ul>
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
          {de ? "Warum unsere Transfers?" : zh ? "为什么选择我们的接送服务？" : "Why Choose Our Transfers?"}
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
              {de ? "Private Fahrzeuge" : zh ? "私人车辆" : "Private Vehicles"}
            </h3>


            <p className="mt-3 text-gray-600">
              {de ? "Komfortable Fahrzeuge mit professionellen Fahrern." : zh ? "舒适车辆与专业司机。" : "Comfortable cars with professional drivers."}
            </p>

          </div>





          <div className="rounded-2xl bg-gray-50 p-8">

            <Clock className="text-blue-600"/>

            <h3 className="mt-4 text-xl font-bold">
              {de ? "Pünktlicher Service" : zh ? "准时服务" : "On Time Service"}
            </h3>


            <p className="mt-3 text-gray-600">
              {de ? "Flughafenabholung bei Tag und Nacht." : zh ? "全天候提供机场接送。" : "Airport pickup available day and night."}
            </p>

          </div>





          <div className="rounded-2xl bg-gray-50 p-8">

            <ShieldCheck className="text-blue-600"/>

            <h3 className="mt-4 text-xl font-bold">
              {de ? "Sicher & zuverlässig" : zh ? "安全可靠" : "Safe & Reliable"}
            </h3>


            <p className="mt-3 text-gray-600">
              {de ? "Erfahrene Fahrer und saubere Fahrzeuge." : zh ? "经验丰富的司机和整洁车辆。" : "Experienced drivers and clean vehicles."}
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
            {de ? "Transfergebiete" : "Transfer Areas"}
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
