import { Car, Clock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import AirportTransferForm from "@/components/booking/AirportTransferForm";
import AirportTransferPolicy from "@/components/pages/AirportTransferPolicy";
import { pageMetadata } from "@/lib/seo";
import { languageAlternates } from "@/lib/i18n";
import { lowestVehicleFare } from "@/lib/transfer-config";

const fromFare = `$${lowestVehicleFare()}`;

export const metadata: Metadata = {
  ...pageMetadata({
  title: "Private Hurghada Airport Transfer — Price Per Vehicle",
  description: `Private, fixed-price Hurghada Airport transfers to hotels across Hurghada, El Gouna, Sahl Hasheesh, Makadi Bay, Soma Bay, Safaga and the southern Red Sea coast. Per vehicle, from ${fromFare}. Price shown before you book.`,
  path: "/transfers",
  image: "/images/owned/hurghada-transfer-road-sunset.jpg",
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
    { question: "How much is a private Hurghada Airport transfer?", answer: `The price is per vehicle, one way — not per person. A private transfer within Hurghada starts from ${fromFare} per vehicle. Sahl Hasheesh, Makadi Bay and El Gouna start from $20, Soma Bay from $30, and the southern Red Sea coast is priced by distance. You see the full price before you book.` },
    { question: "Is the price per person or per vehicle?", answer: "Per vehicle and per journey. Tell us how many people and bags are travelling and we automatically select the right private vehicle for your group." },
    { question: "Which vehicle will I get?", answer: "We match the vehicle to your passengers and luggage. 1–3 guests travel by private sedan, 4–10 guests by private Hiace or van, and larger groups by multiple vehicles. An equivalent or larger vehicle may be provided." },
    { question: "Do you monitor delayed flights?", answer: "Add your flight number to the booking so the team can check the pickup against the latest arrival information." },
    { question: "Can I book a return airport transfer?", answer: "Yes. Choose Round Trip and give the arrival and return details separately; the return price is simply the outbound vehicle plus the return vehicle." },
    { question: "Can I request child seats?", answer: "Yes. Infant, child and booster seats can be requested during booking and are subject to availability. There is no charge for seats." },
    { question: "Which areas do you cover?", answer: "Hurghada, El Ahyaa, Sahl Hasheesh, Makadi Bay, El Gouna, Soma Bay, Safaga, El Quseir, Port Ghalib and Marsa Alam, subject to vehicle and schedule availability." },
  ];
  const transferSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "Private Hurghada Airport Transfer",
        serviceType: "Private airport transfer",
        areaServed: ["Hurghada", "El Gouna", "Sahl Hasheesh", "Makadi Bay", "Soma Bay", "Safaga", "El Quseir", "Port Ghalib", "Marsa Alam"],
        provider: { "@type": "TravelAgency", name: "Daily Red Sea", url: "https://dailyredsea.com" },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          url: "https://dailyredsea.com/transfers",
          priceSpecification: {
            "@type": "PriceSpecification",
            price: String(lowestVehicleFare()),
            priceCurrency: "USD",
            unitText: "per vehicle, one way",
            description: "Private airport transfer priced per vehicle and per journey, from the lowest configured vehicle fare within Hurghada.",
          },
        },
      },
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
        "url('/images/owned/hurghada-transfer-road-sunset.jpg')"
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
              {de ? "Privater Hurghada Flughafentransfer" : ru ? "Частный трансфер из аэропорта Хургады" : ar ? "نقل خاص من مطار الغردقة" : pl ? "Prywatny transfer z lotniska w Hurghadzie" : zh ? "赫尔格达机场私人接送" : "Hurghada Airport Private Transfer"}
            </h1>


            <p className="
              mt-5
              text-xl
            ">
              {de ? `Private Festpreis-Transfers zwischen dem Flughafen Hurghada und Hotels in Hurghada, El Gouna, Sahl Hasheesh, Makadi Bay, Soma Bay, Safaga und an der südlichen Rotmeerküste. Preis pro Fahrzeug, ab ${fromFare}.` : ru ? `Частные трансферы по фиксированной цене между аэропортом Хургады и отелями Хургады, Эль-Гуны, Сахл-Хашиша, Макади-Бей, Сома-Бей, Сафаги и южного побережья Красного моря. Цена за автомобиль, от ${fromFare}.` : ar ? `تنقلات خاصة بسعر ثابت بين مطار الغردقة والفنادق في الغردقة والجونة وسهل حشيش ومكادي باي وسوما باي وسفاجا وساحل البحر الأحمر الجنوبي. السعر لكل مركبة، ابتداءً من ${fromFare}.` : pl ? `Prywatne transfery w stałej cenie między lotniskiem w Hurghadzie a hotelami w Hurghadzie, El Gouna, Sahl Hasheesh, Makadi Bay, Soma Bay, Safadze i na południowym wybrzeżu Morza Czerwonego. Cena za pojazd, od ${fromFare}.` : zh ? `赫尔格达机场与赫尔格达、艾尔古纳、萨尔哈希什、马卡迪湾、索马湾、萨法加及红海南岸酒店之间的私人固定价格接送。价格按车辆计算，${fromFare} 起。` : `Private, fixed-price transfers between Hurghada International Airport and hotels across Hurghada, El Gouna, Sahl Hasheesh, Makadi Bay, Soma Bay, Safaga and the southern Red Sea coast. Price per vehicle, from ${fromFare}.`}
            </p>


          </div>


        </div>


      </section>

      <section id="book-transfer" className="bg-surface-muted px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-semibold uppercase tracking-[0.24em] text-ocean-dark">{de ? "Private Transfers" : ru ? "Частные трансферы" : ar ? "تنقلات خاصة" : pl ? "Prywatne transfery" : zh ? "私人接送" : "Private transfers"}</p>
            <h2 className="mt-3 text-4xl font-bold text-ink">{de ? "Bequem von Tür zu Tür reisen" : ru ? "Комфортная поездка от двери до двери" : ar ? "تنقل مريح من الباب إلى الباب" : pl ? "Wygodna podróż od drzwi do drzwi" : zh ? "舒适的门到门出行" : "Travel comfortably from door to door"}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{de ? "Sende uns deine Route und Reisedaten. Unser Team antwortet per WhatsApp mit Verfügbarkeit und einem klaren Preis, bevor etwas bestätigt wird." : ru ? "Отправьте маршрут и данные поездки. Команда ответит в WhatsApp, подтвердит наличие и понятную цену до оформления." : ar ? "أرسل مسارك وتفاصيل الرحلة. سيرد فريقنا عبر واتساب بالتوفر والسعر الواضح قبل التأكيد." : pl ? "Wyślij trasę i dane podróży. Nasz zespół odpowie przez WhatsApp, potwierdzając dostępność i jasną cenę przed rezerwacją." : zh ? "发送您的路线和出行信息。确认前，我们的团队会通过 WhatsApp 回复名额和透明报价。" : "Send your route and travel details. Our team will reply on WhatsApp with availability and a clear quote before anything is confirmed."}</p>
            <ul className="mt-7 space-y-3 text-ink"><li>✓ {de ? "Ankunft und Abfahrt am Flughafen" : ru ? "Встреча и выезд из аэропорта" : ar ? "الاستقبال والمغادرة من المطار" : pl ? "Przyloty i odloty z lotniska" : zh ? "机场抵达与出发接送" : "Airport arrivals and departures"}</li><li>✓ {de ? "Abholung an Hotels, Resorts und Marinas" : ru ? "Трансфер из отелей, курортов и марин" : ar ? "الاستلام من الفنادق والمنتجعات والمراسي" : pl ? "Odbiór z hoteli, kurortów i marin" : zh ? "酒店、度假村和码头接送" : "Hotel, resort and marina pickups"}</li><li>✓ {de ? "Passende Privatfahrzeuge für deine Gruppe" : ru ? "Частный автомобиль по размеру группы" : ar ? "سيارة خاصة تناسب عدد أفراد مجموعتك" : pl ? "Prywatny samochód dopasowany do grupy" : zh ? "适合您团队人数的私人车辆" : "Flexible private vehicles for your group"}</li></ul>
          </div>
          <AirportTransferForm />
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



          <div className="rounded-2xl bg-surface-muted p-8">

            <Car className="text-ocean"/>

            <h3 className="mt-4 text-xl font-bold">
              {de ? "Private Fahrzeuge" : ru ? "Частные автомобили" : ar ? "سيارات خاصة" : pl ? "Prywatne samochody" : zh ? "私人车辆" : "Private Vehicles"}
            </h3>


            <p className="mt-3 text-muted">
              {de ? "Komfortable Fahrzeuge mit professionellen Fahrern." : ru ? "Комфортные автомобили и профессиональные водители." : ar ? "سيارات مريحة مع سائقين محترفين." : pl ? "Wygodne samochody i profesjonalni kierowcy." : zh ? "舒适车辆与专业司机。" : "Comfortable cars with professional drivers."}
            </p>

          </div>





          <div className="rounded-2xl bg-surface-muted p-8">

            <Clock className="text-ocean"/>

            <h3 className="mt-4 text-xl font-bold">
              {de ? "Pünktlicher Service" : ru ? "Пунктуальный сервис" : ar ? "خدمة في الموعد" : pl ? "Punktualna obsługa" : zh ? "准时服务" : "On Time Service"}
            </h3>


            <p className="mt-3 text-muted">
              {de ? "Flughafenabholung bei Tag und Nacht." : ru ? "Встреча в аэропорту днём и ночью." : ar ? "استقبال من المطار طوال اليوم." : pl ? "Odbiór z lotniska w dzień i w nocy." : zh ? "全天候提供机场接送。" : "Airport pickup available day and night."}
            </p>

          </div>





          <div className="rounded-2xl bg-surface-muted p-8">

            <ShieldCheck className="text-ocean"/>

            <h3 className="mt-4 text-xl font-bold">
              {de ? "Sicher & zuverlässig" : ru ? "Безопасно и надёжно" : ar ? "آمن وموثوق" : pl ? "Bezpiecznie i niezawodnie" : zh ? "安全可靠" : "Safe & Reliable"}
            </h3>


            <p className="mt-3 text-muted">
              {de ? "Erfahrene Fahrer und saubere Fahrzeuge." : ru ? "Опытные водители и чистые автомобили." : ar ? "سائقون ذوو خبرة وسيارات نظيفة." : pl ? "Doświadczeni kierowcy i czyste samochody." : zh ? "经验丰富的司机和整洁车辆。" : "Experienced drivers and clean vehicles."}
            </p>

          </div>



        </div>



      </section>





      {/* Destinations */}


      <section className="
        bg-surface-muted
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


            {["Hurghada City · Marina · Village Road", "El Ahyaa / North Hurghada", "Sahl Hasheesh", "Makadi Bay", "El Gouna", "Soma Bay", "Safaga", "El Quseir", "Port Ghalib", "Marsa Alam"].map((area) => (
              <div key={area} className="rounded-xl bg-white p-5 shadow">📍 {area}</div>
            ))}


          </div>



        </div>


      </section>

      <AirportTransferPolicy locale={locale} />

      {locale === "en" ? <section className="border-t border-line bg-white px-6 py-20"><div className="mx-auto max-w-4xl"><p className="font-semibold uppercase tracking-[0.24em] text-ocean-dark">Plan your pickup</p><h2 className="mt-3 text-4xl font-bold text-ink">Hurghada Airport transfer prices and questions</h2><p className="mt-5 text-lg leading-8 text-muted">Airport transfers are priced per vehicle and per journey, not per person. A private transfer within Hurghada starts from {fromFare} per vehicle; longer routes are priced by distance. Your vehicle, pickup point and time are confirmed before travel.</p><div className="mt-8 divide-y divide-line rounded-3xl border border-line px-6">{transferFaqs.map((item) => <details key={item.question} className="py-5"><summary className="cursor-pointer font-bold text-ink">{item.question}</summary><p className="mt-3 leading-7 text-muted">{item.answer}</p></details>)}</div></div></section> : null}


    </main>

  );
}
