import { Suspense } from "react";
import BookingForm from "@/components/booking/BookingForm";
import TourDetails from "@/components/tours/TourDetails";
import type { Tour } from "@/data/tours";
import Image from "next/image";
import Link from "next/link";
import { tours } from "@/data/tours";
import { absoluteUrl, siteName } from "@/lib/seo";
import TourViewTracker from "@/components/analytics/TourViewTracker";
import TransferBookingForm from "@/components/booking/TransferBookingForm";
import { localePath, type Locale } from "@/lib/i18n";
import { localizeTourGerman } from "@/lib/tour-localization";

export default function TourPageShell({ tour, locale = "en" }: { tour: Tour; locale?: Locale }) {
  const de = locale === "de";
  const homeHref = localePath(locale);
  const toursHref = `${homeHref}#tours`;
  const reviewCount = Number(tour.reviews);
  const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0;
  const transferService = tour.slug === "hurghada-airport-transfer" ? "airport" : tour.slug === "senzo-transfer" ? "senzo" : null;
  const galleryImages = transferService
    ? ["/images/hurghada-airport-transfer.jpg", "/images/senzo-transfer.jpg", "/images/transfer.jpg", "/images/hero.jpg"]
    : tour.slug === "full-day-diving" || tour.slug === "professional-underwater-photographer"
      ? [
        "/images/hurghada-red-sea-coral-reef.jpeg",
        "/images/hurghada-red-sea-scuba-diver.jpeg",
        tour.image === "/images/scuba-diving.jpg" ? "/images/full-day-diving.jpg" : "/images/scuba-diving.jpg",
        "/images/full-day-snorkeling.jpg",
      ]
    : tour.slug === "mahmya-island"
      ? [
        "/images/mahmya-island-boats-sunset.jpeg",
        "/images/hurghada-island-beach-loungers.jpeg",
        "/images/hurghada-island-calm-sunset.jpeg",
        "/images/hurghada-island-family-sunset.jpeg",
      ]
    : tour.category === "Island Trip" || tour.category === "Inselausflug"
      ? [
        "/images/hurghada-island-beach-loungers.jpeg",
        "/images/hurghada-island-sunset-sandals.jpeg",
        "/images/hurghada-island-calm-sunset.jpeg",
        "/images/hurghada-island-family-sunset.jpeg",
      ]
    : tour.category === "Cultural Day Trip"
      ? ["/images/luxor-day-trip.jpg", "/images/karnak-temple.jpg", "/images/luxor-day-trip.jpg", "/images/karnak-temple.jpg"]
    : tour.category === "Desert Safari"
      ? [
        "/images/hurghada-desert-camel-closeup.jpeg",
        "/images/hurghada-desert-quad-tour.jpeg",
        "/images/hurghada-desert-camel-profile.jpeg",
        tour.image === "/images/quad-safari-sunset.jpg" ? "/images/desert-safari.jpg" : "/images/quad-safari-sunset.jpg",
      ]
      : ["/images/orange-bay.jpeg", "/images/mahmya-island.jpg", "/images/full-day-snorkeling.jpg", "/images/scuba-diving.jpg"];
  const faqs = de ? [
    { question: "Ist die Abholung vom Hotel inklusive?", answer: "Die Abholdetails stehen in den Ausflugsinformationen. Die genaue Zeit und den Ort bestätigen wir nach der Buchung per WhatsApp." },
    { question: "Wann bezahle ich?", answer: "Du kannst online reservieren und bei Ankunft bar bezahlen, sofern bei der Buchung keine andere Zahlungsart angezeigt wird." },
    { question: "Was soll ich mitbringen?", answer: "Bringe deine Buchungsnummer, bequeme Kleidung und alle Dinge mit, die im Abschnitt mit den wichtigen Informationen genannt werden." },
  ] : tour.faqs ?? [
    { question: de ? "Ist die Abholung vom Hotel inklusive?" : "Is hotel pickup included?", answer: de ? "Die Abholdetails stehen in den Ausflugsinformationen. Die genaue Zeit und den Ort bestätigen wir nach der Buchung per WhatsApp." : "Pickup details are shown in the tour information. We confirm the exact pickup time and location with you on WhatsApp after booking." },
    { question: de ? "Wann bezahle ich?" : "When do I pay?", answer: de ? "Du kannst online reservieren und bei Ankunft bar bezahlen, sofern bei der Buchung keine andere Zahlungsart angezeigt wird." : "You can reserve online and pay cash on arrival unless a different payment option is clearly shown during booking." },
    { question: de ? "Was soll ich mitbringen?" : "What should I bring?", answer: de ? "Bringe deine Buchungsnummer, bequeme Kleidung und alle Dinge mit, die im Abschnitt mit den wichtigen Informationen genannt werden." : "Bring your booking reference, comfortable clothing, and any items listed in the important information section for this experience." },
  ];
  const sourceTour = tours.find((item) => item.slug === tour.slug) || tour;
  const relatedTours = tours.filter((item) => item.slug !== tour.slug && (item.category === sourceTour.category || item.location === sourceTour.location)).slice(0, 3).map((item) => de ? localizeTourGerman(item) : item);
  const tourUrl = absoluteUrl(localePath(locale, `/tours/${tour.slug}`));
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "BreadcrumbList", "@id": `${tourUrl}#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() }, { "@type": "ListItem", position: 2, name: "Tours", item: `${absoluteUrl() }#tours` }, { "@type": "ListItem", position: 3, name: tour.title, item: tourUrl }] },
    { "@type": "TouristTrip", "@id": `${tourUrl}#tour`, name: tour.title, description: tour.description, image: absoluteUrl(tour.image), url: tourUrl, inLanguage: locale, touristType: tour.category || "Hurghada excursion", offers: { "@type": "Offer", price: tour.price, priceCurrency: "USD", availability: "https://schema.org/InStock", url: tourUrl }, provider: { "@id": `${absoluteUrl()}#organization`, "@type": "TravelAgency", name: siteName, url: absoluteUrl() } },
    { "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
  ] };
  return (
    <main className="min-h-screen bg-slate-50">
      <TourViewTracker title={tour.title} price={tour.price} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-28 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500"><Link href={homeHref} className="hover:text-cyan-700">{de ? "Startseite" : "Home"}</Link><span className="px-2" aria-hidden="true">/</span><Link href={toursHref} className="hover:text-cyan-700">{de ? "Ausflüge" : "Tours"}</Link><span className="px-2" aria-hidden="true">/</span><span className="text-slate-700" aria-current="page">{tour.title}</span></nav>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">{de ? "Hurghada-Erlebnis" : "Hurghada experience"}</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">{tour.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium text-slate-600">{hasReviews ? <><span>★ {tour.rating}</span><span>{reviewCount} {de ? "Kundenbewertungen" : "customer reviews"}</span><span>•</span></> : null}<span>{tour.location}</span><span>•</span><span>{tour.duration}</span></div>
        <div className="mt-8 grid h-[420px] gap-3 overflow-hidden rounded-[2rem] sm:grid-cols-2">
          <div className="relative min-h-64"><Image src={tour.image} alt={tour.title} fill className="object-cover" priority /></div>
          <div className="grid grid-cols-2 gap-3">{galleryImages.map((image, index) => <div key={`${image}-${index}`} className="relative overflow-hidden"><Image src={image} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />{index === 3 ? <span className="absolute bottom-4 right-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900">Daily Red Sea experiences</span> : null}</div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <TourDetails tour={tour} />

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-bold">{de ? "Jetzt reservieren, bei Ankunft bar bezahlen" : "Reserve now, pay cash on arrival"}</p><p className="mt-1">{de ? "Nach deiner Anfrage bestätigen wir die Abholdetails per WhatsApp." : "We confirm pickup details by WhatsApp after your request."}</p></div>
            <Suspense fallback={<div className="min-h-[620px] rounded-3xl border bg-white shadow-sm" />}>
              {transferService ? <TransferBookingForm initialService={transferService} /> : <BookingForm
                  tourName={tour.title}
                  tourSlug={tour.slug}
                  price={tour.price}
                  duration={tour.duration}
                  location={tour.location}
                  participantPricing={tour.participantPricing}
                  availableTimes={tour.availableTimes}
                />}
            </Suspense>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">{de ? "Vor der Buchung" : "Before you book"}</p><h2 className="mt-3 text-3xl font-bold text-slate-900">{de ? "Häufig gestellte Fragen" : "Frequently asked questions"}</h2><div className="mt-6 divide-y divide-slate-200">{faqs.map((faq) => <details key={faq.question} className="py-4"><summary className="cursor-pointer font-semibold text-slate-900">{faq.question}</summary><p className="mt-3 leading-7 text-slate-600">{faq.answer}</p></details>)}</div></div>
          <div className="rounded-3xl bg-slate-950 p-8 text-white"><p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">{de ? "Mehr entdecken" : "More to explore"}</p><h2 className="mt-3 text-3xl font-bold">{de ? "Ähnliche Erlebnisse in Hurghada" : "Related Hurghada experiences"}</h2><p className="mt-4 leading-7 text-slate-300">{de ? "Finde einen weiteren Ausflug ans Rote Meer, einen Tauchtag, eine Wüstensafari oder einen privaten Transfer." : "Find another Red Sea excursion, diving day, desert safari, or private transfer that fits your plans."}</p><div className="mt-6 space-y-3">{relatedTours.map((item) => <Link key={item.slug} href={localePath(locale, `/tours/${item.slug}`)} className="flex items-center justify-between rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold hover:border-cyan-300 hover:text-cyan-200"><span>{item.title}</span><span>{de ? "Ab" : "From"} ${item.price}</span></Link>)}</div><Link href={toursHref} className="mt-7 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300">{de ? "Alle Ausflüge entdecken" : "Explore all tours"}</Link></div>
        </div>
      </section>
    </main>
  );
}
