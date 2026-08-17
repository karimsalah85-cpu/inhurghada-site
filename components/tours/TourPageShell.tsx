import { Suspense } from "react";
import BookingForm from "@/components/booking/BookingForm";
import TourDetails from "@/components/tours/TourDetails";
import type { Tour } from "@/data/tours";
import Link from "next/link";
import { tours } from "@/data/tours";
import { absoluteUrl, siteName } from "@/lib/seo";
import TourViewTracker from "@/components/analytics/TourViewTracker";
import TransferBookingForm from "@/components/booking/TransferBookingForm";
import { localePath, type Locale } from "@/lib/i18n";
import { localizeTour } from "@/lib/tour-localization";
import { getDestination } from "@/lib/destinations";
import TourGallery from "@/components/tours/TourGallery";
import { googleReviewUrl, whatsappUrl } from "@/lib/contact";

export default function TourPageShell({ tour, locale = "en", relatedTourCandidates = tours }: { tour: Tour; locale?: Locale; relatedTourCandidates?: Tour[] }) {
  const de = locale === "de";
  const ru = locale === "ru";
  const ar = locale === "ar";
  const zh = locale === "zh";
  const pl = locale === "pl";
  const ui = {
    en: { experience: "experience", reviews: "customer reviews", reserve: "Reserve now, pay cash on arrival", pickup: "We confirm pickup details by WhatsApp after your request.", reviewEyebrow: "Customer reviews", reviewTitle: "Already travelled with us?", reviewText: "Share a review of your trip to help future guests choose their experience.", reviewCta: "Review this trip", before: "Before you book", faq: "Frequently asked questions", more: "More to explore", related: "Related experiences", relatedText: "Find another Red Sea excursion, diving day, desert safari, or private transfer that fits your plans.", from: "From", all: "Explore all tours" },
    ar: { experience: "تجربة", reviews: "تقييمات العملاء", reserve: "احجز الآن وادفع نقدًا عند الوصول", pickup: "نؤكد تفاصيل الاستلام عبر واتساب بعد إرسال طلبك.", reviewEyebrow: "تقييمات العملاء", reviewTitle: "هل سافرت معنا من قبل؟", reviewText: "شارك تقييم رحلتك لمساعدة الضيوف الآخرين في اختيار تجربتهم.", reviewCta: "قيّم هذه الرحلة", before: "قبل الحجز", faq: "الأسئلة الشائعة", more: "اكتشف المزيد", related: "تجارب مشابهة", relatedText: "اختر رحلة أخرى في البحر الأحمر أو يوم غوص أو سفاري صحراوي أو انتقالًا خاصًا يناسب خطتك.", from: "ابتداءً من", all: "استكشف كل الرحلات" },
    de: { experience: "Erlebnis", reviews: "Kundenbewertungen", reserve: "Jetzt reservieren, bei Ankunft bar bezahlen", pickup: "Nach deiner Anfrage bestätigen wir die Abholdetails per WhatsApp.", reviewEyebrow: "Kundenbewertungen", reviewTitle: "Schon mit uns gereist?", reviewText: "Teile deine Bewertung und hilf künftigen Gästen bei der Auswahl.", reviewCta: "Ausflug bewerten", before: "Vor der Buchung", faq: "Häufig gestellte Fragen", more: "Mehr entdecken", related: "Ähnliche Erlebnisse", relatedText: "Finde einen weiteren Ausflug ans Rote Meer, einen Tauchtag, eine Wüstensafari oder einen privaten Transfer.", from: "Ab", all: "Alle Ausflüge entdecken" },
    ru: { experience: "Экскурсия", reviews: "отзывов гостей", reserve: "Забронируйте сейчас, оплатите наличными по прибытии", pickup: "После заявки мы подтвердим детали трансфера через WhatsApp.", reviewEyebrow: "Отзывы клиентов", reviewTitle: "Уже путешествовали с нами?", reviewText: "Оставьте отзыв о поездке и помогите будущим гостям выбрать экскурсию.", reviewCta: "Оценить поездку", before: "Перед бронированием", faq: "Частые вопросы", more: "Больше впечатлений", related: "Похожие экскурсии", relatedText: "Выберите морскую прогулку, дайвинг, сафари в пустыне или частный трансфер.", from: "От", all: "Все экскурсии" },
    pl: { experience: "Atrakcja", reviews: "opinii klientów", reserve: "Zarezerwuj teraz i zapłać gotówką na miejscu", pickup: "Po wysłaniu zgłoszenia potwierdzimy odbiór przez WhatsApp.", reviewEyebrow: "Opinie klientów", reviewTitle: "Podróżowaliście już z nami?", reviewText: "Podziel się opinią z wycieczki i pomóż przyszłym gościom wybrać atrakcję.", reviewCta: "Oceń wycieczkę", before: "Przed rezerwacją", faq: "Najczęstsze pytania", more: "Odkryj więcej", related: "Podobne atrakcje", relatedText: "Znajdź inny rejs po Morzu Czerwonym, dzień nurkowania, safari lub prywatny transfer.", from: "Od", all: "Zobacz wszystkie wycieczki" },
    zh: { experience: "体验", reviews: "条客户评价", reserve: "立即预订，抵达后现金付款", pickup: "提交请求后，我们会通过 WhatsApp 确认接送详情。", reviewEyebrow: "客户评价", reviewTitle: "已经和我们一起旅行过？", reviewText: "分享您的行程评价，帮助其他客人选择合适的体验。", reviewCta: "评价此行程", before: "预订须知", faq: "常见问题", more: "探索更多", related: "相关体验", relatedText: "寻找适合您的其他红海行程、潜水日、沙漠探险或私人接送。", from: "起价", all: "探索所有行程" },
  }[locale];
  const pausedCopy = {
    en: ["Temporarily unavailable", "Bookings are paused", "We are not accepting new bookings for this trip right now. Existing bookings are unaffected."],
    de: ["Vorübergehend nicht verfügbar", "Buchungen sind pausiert", "Für diesen Ausflug nehmen wir derzeit keine neuen Buchungen an. Bestehende Buchungen bleiben gültig."],
    ru: ["Временно недоступно", "Бронирование приостановлено", "Сейчас мы не принимаем новые бронирования на эту экскурсию. Существующие бронирования остаются в силе."],
    ar: ["غير متاح مؤقتاً", "الحجوزات متوقفة مؤقتاً", "لا نقبل حجوزات جديدة لهذه الرحلة حالياً. الحجوزات الحالية لا تتأثر."],
    pl: ["Tymczasowo niedostępne", "Rezerwacje są wstrzymane", "Obecnie nie przyjmujemy nowych rezerwacji na tę wycieczkę. Istniejące rezerwacje pozostają ważne."],
    zh: ["暂时不可预订", "预订已暂停", "该行程目前不接受新预订，现有预订不受影响。"],
  }[locale];
  const destination = getDestination(tour.destinationSlug);
  const homeHref = localePath(locale);
  const toursHref = `${localePath(locale, "/tours")}?destination=${tour.destinationSlug || "hurghada"}`;
  const destinationHref = localePath(locale, `/destinations/${tour.destinationSlug}`);
  const reviewCount = Number(tour.reviews);
  const hasReviews = Number.isFinite(reviewCount) && reviewCount > 0;
  const transferService = tour.slug === "hurghada-airport-transfer" ? "airport" : tour.slug === "senzo-transfer" ? "senzo" : null;
  // Only show galleries curated for this exact product. Category fallbacks can
  // misrepresent the actual boat, destination, vehicle, or activity.
  const galleryImages = tour.galleryImages ?? [];
  const faqs = de ? [
    { question: "Ist die Abholung vom Hotel inklusive?", answer: "Die Abholdetails stehen in den Ausflugsinformationen. Die genaue Zeit und den Ort bestätigen wir nach der Buchung per WhatsApp." },
    { question: "Wann bezahle ich?", answer: "Du kannst online reservieren und bei Ankunft bar bezahlen, sofern bei der Buchung keine andere Zahlungsart angezeigt wird." },
    { question: "Was soll ich mitbringen?", answer: "Bringe deine Buchungsnummer, bequeme Kleidung und alle Dinge mit, die im Abschnitt mit den wichtigen Informationen genannt werden." },
  ] : ru ? [
    { question: "Включён ли трансфер из отеля?", answer: "Информация о трансфере указана в описании. Точное время и место мы подтверждаем через WhatsApp после бронирования." },
    { question: "Когда производится оплата?", answer: "Если при бронировании не указан другой способ, вы бронируете онлайн и платите наличными по прибытии." },
    { question: "Что взять с собой?", answer: "Возьмите номер бронирования, удобную одежду и всё, что перечислено в разделе важной информации." },
  ] : ar ? [
    { question: "هل الاستلام من الفندق مشمول؟", answer: "تظهر معلومات الاستلام في تفاصيل الرحلة، ونؤكد الوقت والمكان عبر واتساب بعد الحجز." },
    { question: "متى يتم الدفع؟", answer: "يمكنك الحجز عبر الموقع والدفع نقداً عند الوصول ما لم تظهر طريقة دفع أخرى بوضوح." },
    { question: "ماذا يجب أن أحضر؟", answer: "أحضر رقم الحجز وملابس مريحة وكل ما هو مذكور في قسم المعلومات المهمة." },
  ] : pl ? [
    { question: "Czy odbiór z hotelu jest wliczony?", answer: "Informacje o odbiorze znajdziesz w szczegółach wycieczki. Dokładny czas i miejsce potwierdzimy przez WhatsApp po rezerwacji." },
    { question: "Kiedy płacę?", answer: "Jeśli podczas rezerwacji nie podano inaczej, rezerwujesz online i płacisz gotówką na miejscu." },
    { question: "Co zabrać?", answer: "Zabierz numer rezerwacji, wygodne ubranie i przedmioty wymienione w sekcji ważnych informacji." },
  ] : zh ? [
    { question: "包含酒店接送吗？", answer: "接送信息会显示在行程详情中。预订后，我们会通过 WhatsApp 确认准确时间和地点。" },
    { question: "什么时候付款？", answer: "除非预订页面明确显示其他付款方式，否则您可在线预订并在抵达时支付现金。" },
    { question: "需要携带什么？", answer: "请携带预订编号、舒适衣物，以及重要信息部分所列的物品。" },
  ] : tour.faqs ?? [
    { question: de ? "Ist die Abholung vom Hotel inklusive?" : "Is hotel pickup included?", answer: de ? "Die Abholdetails stehen in den Ausflugsinformationen. Die genaue Zeit und den Ort bestätigen wir nach der Buchung per WhatsApp." : "Pickup details are shown in the tour information. We confirm the exact pickup time and location with you on WhatsApp after booking." },
    { question: de ? "Wann bezahle ich?" : "When do I pay?", answer: de ? "Du kannst online reservieren und bei Ankunft bar bezahlen, sofern bei der Buchung keine andere Zahlungsart angezeigt wird." : "You can reserve online and pay cash on arrival unless a different payment option is clearly shown during booking." },
    { question: de ? "Was soll ich mitbringen?" : "What should I bring?", answer: de ? "Bringe deine Buchungsnummer, bequeme Kleidung und alle Dinge mit, die im Abschnitt mit den wichtigen Informationen genannt werden." : "Bring your booking reference, comfortable clothing, and any items listed in the important information section for this experience." },
  ];
  const sourceTour = tours.find((item) => item.slug === tour.slug) || tour;
  const relatedTours = relatedTourCandidates.filter((item) => item.slug !== tour.slug && item.listingStatus !== "paused" && item.listingStatus !== "unlisted" && (item.destinationSlug || "hurghada") === (sourceTour.destinationSlug || "hurghada") && (item.category === sourceTour.category || item.location === sourceTour.location)).slice(0, 3).map((item) => localizeTour(item, locale));
  const tourUrl = absoluteUrl(localePath(locale, `/tours/${tour.slug}`));
  const tourSchema = { "@type": "TouristTrip", "@id": `${tourUrl}#tour`, name: tour.title, description: tour.description, image: absoluteUrl(tour.image), url: tourUrl, inLanguage: locale, touristType: tour.category || `${destination?.name || "Red Sea"} excursion`, ...(tour.bookingMode === "inquiry" ? {} : { offers: { "@type": "Offer", price: tour.price, priceCurrency: tour.currency || "USD", availability: tour.listingStatus === "paused" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", url: tourUrl } }), provider: { "@id": `${absoluteUrl()}#organization`, "@type": "TravelAgency", name: siteName, url: absoluteUrl() } };
  const breadcrumbLabels = {
    en: { home: "Home", tours: "Tours" }, ar: { home: "الرئيسية", tours: "الرحلات" },
    de: { home: "Startseite", tours: "Ausflüge" }, ru: { home: "Главная", tours: "Экскурсии" },
    pl: { home: "Strona główna", tours: "Wycieczki" }, zh: { home: "首页", tours: "旅游项目" },
  }[locale];
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "BreadcrumbList", "@id": `${tourUrl}#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: breadcrumbLabels.home, item: absoluteUrl(localePath(locale)) }, { "@type": "ListItem", position: 2, name: destination?.name || "Hurghada", item: absoluteUrl(destinationHref) }, { "@type": "ListItem", position: 3, name: tour.title, item: tourUrl }] },
    tourSchema,
    { "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
  ] };
  return (
    <main className="min-h-screen bg-slate-50">
      <TourViewTracker title={tour.title} price={tour.price} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-28 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500"><Link href={homeHref} className="hover:text-cyan-700">{breadcrumbLabels.home}</Link><span className="px-2" aria-hidden="true">/</span><Link href={destinationHref} className="hover:text-cyan-700">{destination?.name || "Hurghada"}</Link><span className="px-2" aria-hidden="true">/</span><span className="text-slate-700" aria-current="page">{tour.title}</span></nav>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700 sm:tracking-[0.28em]">{destination?.name || "Hurghada"} · {ui.experience}</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">{tour.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium text-slate-600">{hasReviews ? <><span>★ {tour.rating}</span><span>{reviewCount} {ui.reviews}</span><span>•</span></> : null}<span>{tour.location}</span><span>•</span><span>{tour.duration}</span></div>
        <TourGallery title={tour.title} mainImage={tour.image} galleryImages={galleryImages} imageAlt={tour.imageAlt} galleryImageAlts={tour.galleryImageAlts} imageFocalPoint={tour.imageFocalPoint} galleryImageFocalPoints={tour.galleryImageFocalPoints} locale={locale} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <TourDetails tour={tour} />

          <div className="lg:sticky lg:top-24 lg:self-start">
            {tour.bookingMode === "inquiry" ? <div className="rounded-3xl border border-cyan-200 bg-white p-7 shadow-sm"><p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">{ui.more}</p><h2 className="mt-3 text-3xl font-black text-slate-950">{ui.related}</h2><p className="mt-4 leading-7 text-slate-600">{ui.relatedText}</p><a href={whatsappUrl(`Hello Daily Red Sea, please send me the current price and availability for ${tour.title}.`)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-full justify-center rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white hover:bg-emerald-700">WhatsApp</a></div> : <><div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-bold">{ui.reserve}</p><p className="mt-1">{ui.pickup}</p></div><Suspense fallback={<div className="min-h-[620px] rounded-3xl border bg-white shadow-sm" />}>
              {tour.listingStatus === "paused" ? <div className="min-h-[320px] rounded-3xl border border-amber-200 bg-amber-50 p-7 shadow-sm"><p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-800">{pausedCopy[0]}</p><h2 className="mt-3 text-3xl font-black text-slate-950">{pausedCopy[1]}</h2><p className="mt-4 leading-7 text-slate-700">{pausedCopy[2]}</p></div> : transferService ? <TransferBookingForm initialService={transferService} /> : <BookingForm
                  tourName={tour.title}
                  tourSlug={tour.slug}
                  destinationSlug={tour.destinationSlug}
                  pickupZones={destination?.pickupZones.filter((zone) => zone.supplement === 0).map((zone) => zone.name)}
                  price={tour.price}
                  originalPrice={tour.originalPrice}
                  priceUnit={tour.priceUnit}
                  pricingMode={tour.pricingMode}
                  duration={tour.duration}
                  location={tour.location}
                  participantPricing={tour.participantPricing}
                  availableTimes={tour.availableTimes}
                  ageBands={tour.ageBands}
                  boatOptions={tour.boatOptions}
                  entrancePricing={tour.entrancePricing}
                  bookingExtras={tour.bookingExtras}
                  requiresMarinaTransferChoice={tour.requiresMarinaTransferChoice}
                  bookingLeadTime={tour.bookingLeadTime}
                  currency={tour.currency}
                  operatingWeekdays={tour.operatingWeekdays}
                />}
            </Suspense></>}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8"><div className="rounded-3xl bg-cyan-950 p-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-8"><div><p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">{ui.reviewEyebrow}</p><h2 className="mt-3 text-3xl font-black">{ui.reviewTitle}</h2><p className="mt-3 max-w-2xl text-slate-300">{ui.reviewText}</p></div><a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex shrink-0 rounded-full bg-white px-6 py-3 font-bold text-cyan-950 sm:mt-0">{ui.reviewCta}</a></div></section>
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">{ui.before}</p><h2 className="mt-3 text-3xl font-bold text-slate-900">{ui.faq}</h2><div className="mt-6 divide-y divide-slate-200">{faqs.map((faq) => <details key={faq.question} className="py-4"><summary className="cursor-pointer font-semibold text-slate-900">{faq.question}</summary><p className="mt-3 leading-7 text-slate-600">{faq.answer}</p></details>)}</div></div>
          <div className="rounded-3xl bg-slate-950 p-8 text-white"><p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">{ui.more}</p><h2 className="mt-3 text-3xl font-bold">{ui.related} · {destination?.name || "Hurghada"}</h2><p className="mt-4 leading-7 text-slate-300">{ui.relatedText}</p><div className="mt-6 space-y-3">{relatedTours.map((item) => <Link key={item.slug} href={localePath(locale, `/tours/${item.slug}`)} className="flex items-center justify-between rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold hover:border-cyan-300 hover:text-cyan-200"><span>{item.title}</span><span>{ui.from} {item.originalPrice && Number(item.originalPrice) > Number(item.price) ? <span className="mr-1 text-slate-400 line-through">${item.originalPrice}</span> : null}${item.price}</span></Link>)}</div><Link href={toursHref} className="mt-7 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300">{ui.all}</Link></div>
        </div>
      </section>
    </main>
  );
}
