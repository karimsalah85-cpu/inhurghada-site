import { Car, Clock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import TransferBookingForm from "@/components/booking/TransferBookingForm";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  ...pageMetadata({
  title: "Private Hurghada Airport & Hotel Transfers",
  description: "Arrange a safe private transfer between Hurghada Airport, hotels, resorts, marinas, and local destinations with Daily Red Sea.",
  path: "/transfers",
  image: "/images/placeholders/private-transfer.svg",
  }),
  alternates: { canonical: "/transfers", languages: { ...languageAlternates("/transfers"), "x-default": "/transfers" } },
};

export default function TransfersPage({ locale = "en" }: { locale?: "en" | "de" | "ru" | "ar" | "pl" | "zh" }) {
  const de = locale === "de";
  const ru = locale === "ru";
  const ar = locale === "ar";
  const pl = locale === "pl";
  const zh = locale === "zh";
  const transferFaqs = [
    { question: "How much is a private transfer from Hurghada Airport?", answer: "A one-way private airport transfer within Hurghada starts at $20. Makadi Bay, Soma Bay, El Gouna and Sahl Hasheesh add $7 to the base fare." },
    { question: "Do you monitor delayed flights?", answer: "Yes. Add the flight number to the booking request so the team can confirm the pickup against the latest arrival information." },
    { question: "Can I book a return airport transfer?", answer: "Yes. Book each direction with its own date, time and pickup details so both journeys can be confirmed correctly." },
    { question: "Which areas do you cover?", answer: "Private transfers are available for Hurghada, Makadi Bay, Sahl Hasheesh, Soma Bay and El Gouna, subject to vehicle and schedule availability." },
  ];
  const transferSchema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", name: "Private Hurghada Airport and Hotel Transfers", serviceType: "Private airport and hotel transfer", areaServed: ["Hurghada", "Makadi Bay", "Sahl Hasheesh", "Soma Bay", "El Gouna"], provider: { "@type": "TravelAgency", name: "Daily Red Sea", url: "https://dailyredsea.com" }, offers: { "@type": "Offer", price: "20", priceCurrency: "USD", url: "https://dailyredsea.com/transfers" } },
      { "@type": "FAQPage", mainEntity: transferFaqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    ],
  };

  return (

    <main className="bg-white">
      {locale === "en" ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(transferSchema).replace(/</g, "\\u003c") }} /> : null}


      {/* Hero */}

      <section className="
        relative
        h-[60vh]
        bg-cover
        bg-center
      "
      style={{
        backgroundImage:
        "url('/images/placeholders/private-transfer.svg')"
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
              {de ? "Flughafen- & Hoteltransfers" : ru ? "Трансферы из аэропорта и отелей" : ar ? "تنقلات المطار والفنادق" : pl ? "Transfery lotniskowe i hotelowe" : zh ? "机场与酒店接送" : "Airport & Hotel Transfers"}
            </h1>


            <p className="
              mt-5
              text-xl
            ">
              {de ? "Sichere, komfortable Privattransfers in Hurghada" : ru ? "Безопасные и комфортные частные трансферы в Хургаде" : ar ? "تنقلات خاصة آمنة ومريحة في الغردقة" : pl ? "Bezpieczne i wygodne prywatne transfery w Hurghadzie" : zh ? "安全舒适的赫尔格达私人接送" : "Safe, comfortable private transfers in Hurghada"}
            </p>


          </div>


        </div>


      </section>

      <section id="book-transfer" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-semibold uppercase tracking-[0.24em] text-blue-600">{de ? "Private Transfers" : ru ? "Частные трансферы" : ar ? "تنقلات خاصة" : pl ? "Prywatne transfery" : zh ? "私人接送" : "Private transfers"}</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-900">{de ? "Bequem von Tür zu Tür reisen" : ru ? "Комфортная поездка от двери до двери" : ar ? "تنقل مريح من الباب إلى الباب" : pl ? "Wygodna podróż od drzwi do drzwi" : zh ? "舒适的门到门出行" : "Travel comfortably from door to door"}</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">{de ? "Sende uns deine Route und Reisedaten. Unser Team antwortet per WhatsApp mit Verfügbarkeit und einem klaren Preis, bevor etwas bestätigt wird." : ru ? "Отправьте маршрут и данные поездки. Команда ответит в WhatsApp, подтвердит наличие и понятную цену до оформления." : ar ? "أرسل مسارك وتفاصيل الرحلة. سيرد فريقنا عبر واتساب بالتوفر والسعر الواضح قبل التأكيد." : pl ? "Wyślij trasę i dane podróży. Nasz zespół odpowie przez WhatsApp, potwierdzając dostępność i jasną cenę przed rezerwacją." : zh ? "发送您的路线和出行信息。确认前，我们的团队会通过 WhatsApp 回复名额和透明报价。" : "Send your route and travel details. Our team will reply on WhatsApp with availability and a clear quote before anything is confirmed."}</p>
            <ul className="mt-7 space-y-3 text-slate-700"><li>✓ {de ? "Ankunft und Abfahrt am Flughafen" : ru ? "Встреча и выезд из аэропорта" : ar ? "الاستقبال والمغادرة من المطار" : pl ? "Przyloty i odloty z lotniska" : zh ? "机场抵达与出发接送" : "Airport arrivals and departures"}</li><li>✓ {de ? "Abholung an Hotels, Resorts und Marinas" : ru ? "Трансфер из отелей, курортов и марин" : ar ? "الاستلام من الفنادق والمنتجعات والمراسي" : pl ? "Odbiór z hoteli, kurortów i marin" : zh ? "酒店、度假村和码头接送" : "Hotel, resort and marina pickups"}</li><li>✓ {de ? "Passende Privatfahrzeuge für deine Gruppe" : ru ? "Частный автомобиль по размеру группы" : ar ? "سيارة خاصة تناسب عدد أفراد مجموعتك" : pl ? "Prywatny samochód dopasowany do grupy" : zh ? "适合您团队人数的私人车辆" : "Flexible private vehicles for your group"}</li></ul>
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
          {de ? "Warum unsere Transfers?" : ru ? "Почему выбирают наши трансферы?" : ar ? "لماذا تختار تنقلاتنا؟" : pl ? "Dlaczego warto wybrać nasze transfery?" : zh ? "为什么选择我们的接送服务？" : "Why Choose Our Transfers?"}
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
              {de ? "Private Fahrzeuge" : ru ? "Частные автомобили" : ar ? "سيارات خاصة" : pl ? "Prywatne samochody" : zh ? "私人车辆" : "Private Vehicles"}
            </h3>


            <p className="mt-3 text-gray-600">
              {de ? "Komfortable Fahrzeuge mit professionellen Fahrern." : ru ? "Комфортные автомобили и профессиональные водители." : ar ? "سيارات مريحة مع سائقين محترفين." : pl ? "Wygodne samochody i profesjonalni kierowcy." : zh ? "舒适车辆与专业司机。" : "Comfortable cars with professional drivers."}
            </p>

          </div>





          <div className="rounded-2xl bg-gray-50 p-8">

            <Clock className="text-blue-600"/>

            <h3 className="mt-4 text-xl font-bold">
              {de ? "Pünktlicher Service" : ru ? "Пунктуальный сервис" : ar ? "خدمة في الموعد" : pl ? "Punktualna obsługa" : zh ? "准时服务" : "On Time Service"}
            </h3>


            <p className="mt-3 text-gray-600">
              {de ? "Flughafenabholung bei Tag und Nacht." : ru ? "Встреча в аэропорту днём и ночью." : ar ? "استقبال من المطار طوال اليوم." : pl ? "Odbiór z lotniska w dzień i w nocy." : zh ? "全天候提供机场接送。" : "Airport pickup available day and night."}
            </p>

          </div>





          <div className="rounded-2xl bg-gray-50 p-8">

            <ShieldCheck className="text-blue-600"/>

            <h3 className="mt-4 text-xl font-bold">
              {de ? "Sicher & zuverlässig" : ru ? "Безопасно и надёжно" : ar ? "آمن وموثوق" : pl ? "Bezpiecznie i niezawodnie" : zh ? "安全可靠" : "Safe & Reliable"}
            </h3>


            <p className="mt-3 text-gray-600">
              {de ? "Erfahrene Fahrer und saubere Fahrzeuge." : ru ? "Опытные водители и чистые автомобили." : ar ? "سائقون ذوو خبرة وسيارات نظيفة." : pl ? "Doświadczeni kierowcy i czyste samochody." : zh ? "经验丰富的司机和整洁车辆。" : "Experienced drivers and clean vehicles."}
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
            {de ? "Transfergebiete" : ru ? "Районы трансфера" : ar ? "مناطق التنقل" : pl ? "Obszary transferu" : zh ? "接送区域" : "Transfer Areas"}
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

      {locale === "en" ? <section className="border-t border-slate-200 bg-white px-6 py-20"><div className="mx-auto max-w-4xl"><p className="font-semibold uppercase tracking-[0.24em] text-blue-600">Plan your pickup</p><h2 className="mt-3 text-4xl font-bold text-slate-950">Hurghada transfer prices and questions</h2><p className="mt-5 text-lg leading-8 text-slate-600">One-way private airport transfers start at $20 within Hurghada. Makadi Bay, Soma Bay, El Gouna and Sahl Hasheesh add $7. Your final vehicle, pickup point and time are confirmed before travel.</p><div className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200 px-6">{transferFaqs.map((item) => <details key={item.question} className="py-5"><summary className="cursor-pointer font-bold text-slate-950">{item.question}</summary><p className="mt-3 leading-7 text-slate-600">{item.answer}</p></details>)}</div></div></section> : null}


    </main>

  );
}
