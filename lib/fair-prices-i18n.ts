import type { Locale } from "@/lib/i18n";
import type { FairPriceCategory, FairPriceItemId, FairPriceVerdict } from "@/lib/fair-prices";

/**
 * Visitor-facing wording for the Fair Price Index, per site locale.
 * Placeholders in {braces} are filled with fillFairCopy(). Everything here is
 * plain data so it can be passed from the server page to the client checker.
 */

export type FairPriceItemCopy = { name: string; unit: string; tip: string };

export type FairPriceCopy = {
  intlLocale: string;
  metaTitle: string;
  metaDescription: string;
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  eyebrow: string;
  heading: string;
  intro: string;
  /** {date} */
  reviewed: string;
  disclaimer: string;
  checker: {
    eyebrow: string;
    title: string;
    intro: string;
    offeredLabel: string;
    /** {unit} */
    quotedLabel: string;
    currencyLabel: string;
    placeholder: string;
    fairRange: string;
    /** {amount} */
    atTodaysRate: string;
    tipLabel: string;
    /** {label} */
    book: string;
    ask: string;
    /** {amount} {name} */
    askMessage: string;
    priceUnknown: string;
  };
  verdicts: Record<FairPriceVerdict, { title: string; body: string }>;
  /** {amount} */
  ripoffOver: string;
  /** {amount} */
  ripoffFixed: string;
  /** {title} {label} */
  ourTour: string;
  /** {price} */
  tourFrom: string;
  /** English catalogue price units translated for this locale. */
  tourUnits: Record<string, string>;
  categories: Record<FairPriceCategory, string>;
  items: Record<FairPriceItemId, FairPriceItemCopy>;
  /** Visa tip and FAQ answer before / after the 1 January 2027 increase. {fee} */
  visaTip: { beforeIncrease: string; afterIncrease: string };
  habitsTitle: string;
  habits: string[];
  faqTitle: string;
  /** {uberRange} {taxiRange} */
  faqTaxiQuestion: string;
  faqTaxiAnswer: string;
  faqVisaQuestion: string;
  faqVisaAnswer: { beforeIncrease: string; afterIncrease: string };
  /** {orangeRange} */
  faqOrangeQuestion: string;
  faqOrangeAnswer: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

export function fillFairCopy(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

const en: FairPriceCopy = {
  intlLocale: "en",
  metaTitle: "Hurghada Fair Price Index 2026 — What Things Should Cost",
  metaDescription: "Fair 2026 prices for Hurghada: airport taxis, visa, SIM cards, Orange Bay, snorkeling, safaris, diving and drinks — plus a free tool to check any price you’re quoted.",
  breadcrumbHome: "Home",
  breadcrumbCurrent: "Fair price index",
  eyebrow: "Don’t overpay · Hurghada",
  heading: "Hurghada Fair Price Index",
  intro: "What things really cost in Hurghada in 2026 — from the airport taxi to an Orange Bay trip — so you can enjoy your holiday without being overcharged. Prices are checked by our local team.",
  reviewed: "Last reviewed {date}.",
  disclaimer: "Prices change; ranges are a guide, not an official tariff.",
  checker: {
    eyebrow: "Free tool",
    title: "Is this a fair price?",
    intro: "Pick what you were offered, type the price, and see instantly whether it’s fair.",
    offeredLabel: "What were you offered?",
    quotedLabel: "Price you were quoted ({unit})",
    currencyLabel: "Currency",
    placeholder: "e.g. 500",
    fairRange: "Fair range:",
    atTodaysRate: "≈ {amount} at today’s rate",
    tipLabel: "Tip:",
    book: "Book it with us — {label} →",
    ask: "Not sure? Ask us on WhatsApp",
    askMessage: "Hi Daily Red Sea! Is this a fair price? I was offered {amount} for: {name}.",
    priceUnknown: "[price]",
  },
  verdicts: {
    below: { title: "Good price", body: "That is below the usual range. Great if it’s genuine — just check exactly what’s included before you pay." },
    fair: { title: "Fair price", body: "That is within the normal range for Hurghada. Go ahead and enjoy it." },
    high: { title: "A bit high", body: "Not a scam, but you are paying more than most visitors. Try negotiating towards the fair range." },
    ripoff: { title: "Rip-off", body: "That is well above what this should cost. Walk away or compare other offers first." },
  },
  ripoffOver: "Rip-off: over {amount}",
  ripoffFixed: "Rip-off: more than {amount}",
  ourTour: "Daily Red Sea: {title} — {label}",
  tourFrom: "from {price}",
  tourUnits: { "per person": "per person", "per vehicle": "per vehicle", "per private boat": "per private boat" },
  categories: { arrival: "Arrival essentials", transport: "Taxis & transfers", trips: "Boat trips, safaris & excursions", food: "Drinks & everyday prices" },
  items: {
    "visa-on-arrival": { name: "Egypt visa on arrival (single entry)", unit: "per person", tip: "" },
    "tourist-sim": { name: "Tourist SIM card at the airport (30–40 GB)", unit: "per SIM", tip: "Buy only at the official Vodafone, Orange, Etisalat or WE counters after baggage claim, with your passport. Avoid SIMs sold in souvenir shops." },
    "airport-uber-central": { name: "Airport → central Hurghada hotel by Uber or Careem", unit: "per car", tip: "The app shows the price before you ride. Walk to the pickup zone outside arrivals and check the number plate." },
    "airport-taxi-central": { name: "Airport → central Hurghada hotel by taxi or private car", unit: "per car", tip: "Agree the total price and currency before you get in, and confirm it is per car, not per person. Pre-booking fixes the price." },
    "airport-taxi-makadi-sahl": { name: "Airport → Makadi Bay or Sahl Hasheesh", unit: "per car", tip: "These resorts are 20–40 minutes away. Prices quoted in euros at the taxi rank are usually the most inflated." },
    "airport-taxi-el-gouna": { name: "Airport → El Gouna", unit: "per car", tip: "El Gouna is about 30–40 minutes north. Ride-hailing apps are often cheapest; confirm the drop-off gate for your hotel." },
    "town-taxi": { name: "Short taxi ride inside Hurghada (3–5 km)", unit: "per car", tip: "Street taxis rarely use the meter. Agree the price first, or use Uber/Careem to see a fixed fare." },
    "orange-bay": { name: "Orange Bay group boat trip with lunch", unit: "per adult", tip: "Most prices exclude the Giftun national park fee (about $5, cash on the day). Ask whether hotel pickup and lunch are included." },
    "snorkeling-boat": { name: "Snorkeling boat trip with lunch (2–3 reef stops)", unit: "per adult", tip: "Check that snorkel gear, lunch and hotel pickup are included, and that the boat carries life jackets in your size." },
    "dolphin-house": { name: "Dolphin House snorkeling trip", unit: "per adult", tip: "Dolphins are wild and never guaranteed. Be wary of anyone who “guarantees” swimming with them or charges extra to get closer." },
    "quad-safari": { name: "Quad bike safari with camel ride (2–3 hours)", unit: "per adult", tip: "Ask whether the quad is shared or single, and whether dinner or a show is included — that explains most price differences." },
    "intro-dive": { name: "Beginner intro dive by boat (no licence needed)", unit: "per person", tip: "Make sure an instructor stays with you in the water, and that equipment and the marine park fee are included." },
    "luxor-private-day": { name: "Luxor private day trip from Hurghada (2 travellers)", unit: "per person", tip: "Confirm which entry tickets are included — the Valley of the Kings and special tombs are often extra." },
    "local-beer": { name: "Local beer (0.5 L) in a bar outside hotels", unit: "per beer", tip: "Ask for the menu with prices before ordering. Hotel and nightclub prices are higher." },
    shisha: { name: "Shisha in a café", unit: "per shisha", tip: "Check whether service charge and tax are added to the bill." },
    water: { name: "Bottled water (1.5 L) in a shop", unit: "per bottle", tip: "Supermarkets print prices on the shelf. Kiosks near hotels often charge tourists double." },
  },
  visaTip: {
    beforeIncrease: "Buy it yourself at the bank counter before passport control, in US dollars cash. The fee rises to $33 on 1 January 2027. You can also apply online for an official e-visa before you travel. Nobody needs to “help” you for a fee.",
    afterIncrease: "Buy it yourself at the bank counter before passport control, in US dollars cash. You can also apply online for an official e-visa before you travel. Nobody needs to “help” you for a fee.",
  },
  habitsTitle: "Five habits that stop overcharging",
  habits: [
    "Agree the total price, the currency and “per car or per person” before anything starts.",
    "Carry small Egyptian pound notes — “no change” is a common way to keep the difference.",
    "Use Uber or Careem when you can; the app shows the fare up front.",
    "Ask what’s included: pickup, lunch, equipment, park fees and entry tickets.",
    "It’s fine to say no and walk away. A fair seller won’t chase you.",
  ],
  faqTitle: "Common questions",
  faqTaxiQuestion: "How much is a taxi from Hurghada airport to my hotel?",
  faqTaxiAnswer: "To central Hurghada, Uber or Careem usually costs {uberRange} and a taxi or private car {taxiRange} per car. Always agree the total before you get in.",
  faqVisaQuestion: "How much is the Egypt visa on arrival?",
  faqVisaAnswer: {
    beforeIncrease: "The single-entry visa on arrival costs $30 until 31 December 2026 and $33 from 1 January 2027, paid in cash at the bank counter before passport control.",
    afterIncrease: "The single-entry visa on arrival costs {fee}, paid in cash at the bank counter before passport control.",
  },
  faqOrangeQuestion: "How much should an Orange Bay trip cost?",
  faqOrangeAnswer: "A shared Orange Bay boat trip with lunch usually costs {orangeRange} per adult, plus a national park fee of about $5 paid in cash.",
  ctaTitle: "Fixed prices, no haggling",
  ctaText: "Every Daily Red Sea trip shows the full price up front, with hotel pickup and what’s included listed clearly — and many trips can be paid in cash on the day.",
  ctaButton: "Browse all trips →",
};

const de: FairPriceCopy = {
  intlLocale: "de-DE",
  metaTitle: "Faire Preise in Hurghada 2026 – was Dinge wirklich kosten",
  metaDescription: "Faire Preise 2026 in Hurghada: Flughafentaxi, Visum, SIM-Karte, Orange Bay, Schnorcheln, Safari, Tauchen und Getränke – plus kostenloser Preis-Check für jedes Angebot.",
  breadcrumbHome: "Startseite",
  breadcrumbCurrent: "Faire Preise",
  eyebrow: "Nicht zu viel zahlen · Hurghada",
  heading: "Faire Preise in Hurghada",
  intro: "Was Dinge in Hurghada 2026 wirklich kosten – vom Flughafentaxi bis zum Orange-Bay-Ausflug –, damit Sie Ihren Urlaub genießen, ohne zu viel zu bezahlen. Die Preise werden von unserem Team vor Ort geprüft.",
  reviewed: "Zuletzt geprüft am {date}.",
  disclaimer: "Preise ändern sich; die Spannen sind Richtwerte, kein offizieller Tarif.",
  checker: {
    eyebrow: "Kostenloses Tool",
    title: "Ist dieser Preis fair?",
    intro: "Wählen Sie, was Ihnen angeboten wurde, geben Sie den Preis ein und sehen Sie sofort, ob er fair ist.",
    offeredLabel: "Was wurde Ihnen angeboten?",
    quotedLabel: "Genannter Preis ({unit})",
    currencyLabel: "Währung",
    placeholder: "z. B. 500",
    fairRange: "Fairer Preis:",
    atTodaysRate: "≈ {amount} zum heutigen Kurs",
    tipLabel: "Tipp:",
    book: "Bei uns buchen – {label} →",
    ask: "Unsicher? Fragen Sie uns per WhatsApp",
    askMessage: "Hallo Daily Red Sea! Ist das ein fairer Preis? Mir wurden {amount} angeboten für: {name}.",
    priceUnknown: "[Preis]",
  },
  verdicts: {
    below: { title: "Guter Preis", body: "Das liegt unter der üblichen Spanne. Prima, wenn das Angebot seriös ist – prüfen Sie nur genau, was inklusive ist." },
    fair: { title: "Fairer Preis", body: "Das liegt im normalen Rahmen für Hurghada. Viel Spaß!" },
    high: { title: "Etwas teuer", body: "Kein Betrug, aber Sie zahlen mehr als die meisten Urlauber. Versuchen Sie, in Richtung der fairen Spanne zu verhandeln." },
    ripoff: { title: "Abzocke", body: "Das ist deutlich mehr, als es kosten sollte. Lehnen Sie ab oder vergleichen Sie zuerst andere Angebote." },
  },
  ripoffOver: "Abzocke: über {amount}",
  ripoffFixed: "Abzocke: mehr als {amount}",
  ourTour: "Daily Red Sea: {title} – {label}",
  tourFrom: "ab {price}",
  tourUnits: { "per person": "pro Person", "per vehicle": "pro Fahrzeug", "per private boat": "pro Privatboot" },
  categories: { arrival: "Bei der Ankunft", transport: "Taxis & Transfers", trips: "Bootstouren, Safaris & Ausflüge", food: "Getränke & Alltagspreise" },
  items: {
    "visa-on-arrival": { name: "Ägypten-Visum bei Ankunft (einfache Einreise)", unit: "pro Person", tip: "" },
    "tourist-sim": { name: "Touristen-SIM-Karte am Flughafen (30–40 GB)", unit: "pro SIM", tip: "Nur an den offiziellen Schaltern von Vodafone, Orange, Etisalat oder WE nach der Gepäckausgabe kaufen, mit Reisepass. Keine SIM-Karten aus Souvenirläden." },
    "airport-uber-central": { name: "Flughafen → Hotel im Zentrum von Hurghada mit Uber oder Careem", unit: "pro Auto", tip: "Die App zeigt den Preis vor der Fahrt. Gehen Sie zur Abholzone vor der Ankunftshalle und prüfen Sie das Kennzeichen." },
    "airport-taxi-central": { name: "Flughafen → Hotel im Zentrum mit Taxi oder Privatwagen", unit: "pro Auto", tip: "Vereinbaren Sie Gesamtpreis und Währung vor dem Einsteigen und klären Sie, dass er pro Auto gilt, nicht pro Person. Mit Vorausbuchung steht der Preis fest." },
    "airport-taxi-makadi-sahl": { name: "Flughafen → Makadi Bay oder Sahl Hasheesh", unit: "pro Auto", tip: "Diese Resorts liegen 20–40 Minuten entfernt. Am Taxistand in Euro genannte Preise sind meist am stärksten überhöht." },
    "airport-taxi-el-gouna": { name: "Flughafen → El Gouna", unit: "pro Auto", tip: "El Gouna liegt etwa 30–40 Minuten nördlich. Fahrdienst-Apps sind oft am günstigsten; klären Sie das Eingangstor Ihres Hotels." },
    "town-taxi": { name: "Kurze Taxifahrt in Hurghada (3–5 km)", unit: "pro Auto", tip: "Straßentaxis nutzen selten das Taxameter. Vereinbaren Sie den Preis vorher oder nutzen Sie Uber/Careem für einen Festpreis." },
    "orange-bay": { name: "Orange-Bay-Bootstour in der Gruppe mit Mittagessen", unit: "pro Erwachsenem", tip: "Meist ohne die Gebühr für den Giftun-Nationalpark (ca. 5 $, bar vor Ort). Fragen Sie, ob Hotelabholung und Mittagessen inklusive sind." },
    "snorkeling-boat": { name: "Schnorchel-Bootstour mit Mittagessen (2–3 Riffstopps)", unit: "pro Erwachsenem", tip: "Achten Sie darauf, dass Schnorchelausrüstung, Mittagessen und Hotelabholung inklusive sind und Schwimmwesten in Ihrer Größe an Bord sind." },
    "dolphin-house": { name: "Dolphin-House-Schnorcheltour", unit: "pro Erwachsenem", tip: "Delfine sind wild und nie garantiert. Seien Sie vorsichtig bei allen, die Schwimmen mit Delfinen „garantieren“ oder extra kassieren, um näher heranzufahren." },
    "quad-safari": { name: "Quad-Safari mit Kamelritt (2–3 Stunden)", unit: "pro Erwachsenem", tip: "Fragen Sie, ob Sie das Quad teilen oder allein fahren und ob Abendessen oder Show inklusive sind – das erklärt die meisten Preisunterschiede." },
    "intro-dive": { name: "Schnuppertauchgang vom Boot (ohne Tauchschein)", unit: "pro Person", tip: "Achten Sie darauf, dass ein Tauchlehrer bei Ihnen im Wasser bleibt und Ausrüstung sowie Meeresparkgebühr inklusive sind." },
    "luxor-private-day": { name: "Private Tagestour nach Luxor ab Hurghada (2 Reisende)", unit: "pro Person", tip: "Klären Sie, welche Eintrittskarten inklusive sind – das Tal der Könige und besondere Gräber kosten oft extra." },
    "local-beer": { name: "Einheimisches Bier (0,5 l) in einer Bar außerhalb der Hotels", unit: "pro Bier", tip: "Lassen Sie sich vor der Bestellung die Karte mit Preisen zeigen. In Hotels und Clubs ist es teurer." },
    shisha: { name: "Shisha im Café", unit: "pro Shisha", tip: "Prüfen Sie, ob Servicegebühr und Steuern auf die Rechnung kommen." },
    water: { name: "Wasser (1,5 l) im Laden", unit: "pro Flasche", tip: "Supermärkte zeigen die Preise am Regal. Kioske nahe den Hotels verlangen von Touristen oft das Doppelte." },
  },
  visaTip: {
    beforeIncrease: "Kaufen Sie es selbst am Bankschalter vor der Passkontrolle, bar in US-Dollar. Am 1. Januar 2027 steigt die Gebühr auf 33 $. Sie können vor der Reise auch online ein offizielles E-Visum beantragen. Niemand muss Ihnen gegen Gebühr „helfen“.",
    afterIncrease: "Kaufen Sie es selbst am Bankschalter vor der Passkontrolle, bar in US-Dollar. Sie können vor der Reise auch online ein offizielles E-Visum beantragen. Niemand muss Ihnen gegen Gebühr „helfen“.",
  },
  habitsTitle: "Fünf Gewohnheiten gegen überhöhte Preise",
  habits: [
    "Vereinbaren Sie Gesamtpreis, Währung und „pro Auto oder pro Person“, bevor es losgeht.",
    "Haben Sie kleine ägyptische Pfundscheine dabei – „kein Wechselgeld“ ist ein beliebter Trick, um die Differenz zu behalten.",
    "Nutzen Sie wenn möglich Uber oder Careem; die App zeigt den Fahrpreis vorab.",
    "Fragen Sie, was inklusive ist: Abholung, Mittagessen, Ausrüstung, Parkgebühren und Eintritte.",
    "Sie dürfen Nein sagen und weitergehen. Ein seriöser Anbieter läuft Ihnen nicht hinterher.",
  ],
  faqTitle: "Häufige Fragen",
  faqTaxiQuestion: "Was kostet ein Taxi vom Flughafen Hurghada zum Hotel?",
  faqTaxiAnswer: "Ins Zentrum von Hurghada kostet Uber oder Careem meist {uberRange}, ein Taxi oder Privatwagen {taxiRange} pro Auto. Vereinbaren Sie den Gesamtpreis immer vor dem Einsteigen.",
  faqVisaQuestion: "Was kostet das Visum bei Ankunft in Ägypten?",
  faqVisaAnswer: {
    beforeIncrease: "Das Visum bei Ankunft für die einfache Einreise kostet bis zum 31. Dezember 2026 30 $ und ab dem 1. Januar 2027 33 $, bar zu zahlen am Bankschalter vor der Passkontrolle.",
    afterIncrease: "Das Visum bei Ankunft für die einfache Einreise kostet {fee}, bar zu zahlen am Bankschalter vor der Passkontrolle.",
  },
  faqOrangeQuestion: "Was sollte ein Orange-Bay-Ausflug kosten?",
  faqOrangeAnswer: "Eine Gruppen-Bootstour zur Orange Bay mit Mittagessen kostet meist {orangeRange} pro Erwachsenem, plus etwa 5 $ Nationalparkgebühr in bar.",
  ctaTitle: "Festpreise, kein Feilschen",
  ctaText: "Bei jeder Daily-Red-Sea-Tour sehen Sie den vollen Preis vorab, mit Hotelabholung und klar aufgelisteten Leistungen – und viele Ausflüge können Sie am Tag selbst bar bezahlen.",
  ctaButton: "Alle Ausflüge ansehen →",
};

const ru: FairPriceCopy = {
  intlLocale: "ru-RU",
  metaTitle: "Честные цены в Хургаде 2026 — сколько всё стоит на самом деле",
  metaDescription: "Честные цены 2026 года в Хургаде: такси из аэропорта, виза, SIM-карта, Орандж Бэй, снорклинг, сафари, дайвинг и напитки — и бесплатная проверка любой названной цены.",
  breadcrumbHome: "Главная",
  breadcrumbCurrent: "Честные цены",
  eyebrow: "Не переплачивайте · Хургада",
  heading: "Честные цены в Хургаде",
  intro: "Сколько всё действительно стоит в Хургаде в 2026 году — от такси из аэропорта до поездки на Орандж Бэй, — чтобы вы наслаждались отдыхом и не переплачивали. Цены проверяет наша местная команда.",
  reviewed: "Последняя проверка: {date}.",
  disclaimer: "Цены меняются; диапазоны — ориентир, а не официальный тариф.",
  checker: {
    eyebrow: "Бесплатный инструмент",
    title: "Это честная цена?",
    intro: "Выберите, что вам предложили, введите цену и сразу узнайте, честная ли она.",
    offeredLabel: "Что вам предложили?",
    quotedLabel: "Названная цена ({unit})",
    currencyLabel: "Валюта",
    placeholder: "например, 500",
    fairRange: "Честная цена:",
    atTodaysRate: "≈ {amount} по сегодняшнему курсу",
    tipLabel: "Совет:",
    book: "Забронировать у нас — {label} →",
    ask: "Сомневаетесь? Спросите нас в WhatsApp",
    askMessage: "Здравствуйте, Daily Red Sea! Это честная цена? Мне предложили {amount} за: {name}.",
    priceUnknown: "[цена]",
  },
  verdicts: {
    below: { title: "Хорошая цена", body: "Это ниже обычного диапазона. Отлично, если всё честно, — только уточните, что входит в стоимость." },
    fair: { title: "Честная цена", body: "Это в пределах обычных цен для Хургады. Отдыхайте спокойно." },
    high: { title: "Дороговато", body: "Это не обман, но вы платите больше, чем большинство туристов. Попробуйте поторговаться до честного диапазона." },
    ripoff: { title: "Явная переплата", body: "Это намного больше, чем должно стоить. Откажитесь или сначала сравните другие предложения." },
  },
  ripoffOver: "Переплата: дороже {amount}",
  ripoffFixed: "Переплата: больше {amount}",
  ourTour: "Daily Red Sea: {title} — {label}",
  tourFrom: "от {price}",
  tourUnits: { "per person": "за человека", "per vehicle": "за автомобиль", "per private boat": "за частную лодку" },
  categories: { arrival: "По прилёте", transport: "Такси и трансферы", trips: "Морские прогулки, сафари и экскурсии", food: "Напитки и повседневные цены" },
  items: {
    "visa-on-arrival": { name: "Виза в Египет по прилёте (однократная)", unit: "за человека", tip: "" },
    "tourist-sim": { name: "Туристическая SIM-карта в аэропорту (30–40 ГБ)", unit: "за SIM-карту", tip: "Покупайте только на официальных стойках Vodafone, Orange, Etisalat или WE после выдачи багажа, с паспортом. Не берите SIM-карты в сувенирных лавках." },
    "airport-uber-central": { name: "Аэропорт → отель в центре Хургады на Uber или Careem", unit: "за машину", tip: "Приложение показывает цену до поездки. Пройдите к зоне посадки у выхода из зала прилёта и сверьте номер машины." },
    "airport-taxi-central": { name: "Аэропорт → отель в центре на такси или частной машине", unit: "за машину", tip: "Договоритесь об итоговой цене и валюте до посадки и уточните, что цена за машину, а не за человека. Предварительное бронирование фиксирует цену." },
    "airport-taxi-makadi-sahl": { name: "Аэропорт → Макади Бэй или Сахл Хашиш", unit: "за машину", tip: "Эти курорты в 20–40 минутах езды. Цены в евро на стоянке такси обычно завышены сильнее всего." },
    "airport-taxi-el-gouna": { name: "Аэропорт → Эль Гуна", unit: "за машину", tip: "Эль Гуна примерно в 30–40 минутах к северу. Приложения такси часто дешевле всего; уточните въездные ворота вашего отеля." },
    "town-taxi": { name: "Короткая поездка на такси по Хургаде (3–5 км)", unit: "за машину", tip: "Уличные такси редко включают счётчик. Договоритесь о цене заранее или используйте Uber/Careem с фиксированной ценой." },
    "orange-bay": { name: "Групповая морская прогулка на Орандж Бэй с обедом", unit: "за взрослого", tip: "Чаще всего в цену не входит сбор нацпарка Гифтун (около 5 $, наличными на месте). Уточните, входят ли трансфер из отеля и обед." },
    "snorkeling-boat": { name: "Морская прогулка со снорклингом и обедом (2–3 остановки у рифов)", unit: "за взрослого", tip: "Проверьте, что снаряжение, обед и трансфер из отеля включены, а на лодке есть спасательные жилеты вашего размера." },
    "dolphin-house": { name: "Снорклинг-тур к Дельфиньему дому (Dolphin House)", unit: "за взрослого", tip: "Дельфины дикие, и встреча с ними не гарантирована. Остерегайтесь тех, кто «гарантирует» плавание с дельфинами или берёт доплату, чтобы подплыть ближе." },
    "quad-safari": { name: "Сафари на квадроциклах с катанием на верблюде (2–3 часа)", unit: "за взрослого", tip: "Спросите, квадроцикл на одного или на двоих и входят ли ужин или шоу — это объясняет большую часть разницы в цене." },
    "intro-dive": { name: "Пробное погружение с лодки (без сертификата)", unit: "за человека", tip: "Убедитесь, что инструктор всё время рядом с вами в воде, а снаряжение и сбор морского парка включены." },
    "luxor-private-day": { name: "Индивидуальная экскурсия в Луксор из Хургады (2 человека)", unit: "за человека", tip: "Уточните, какие входные билеты включены, — Долина царей и особые гробницы часто оплачиваются отдельно." },
    "local-beer": { name: "Местное пиво (0,5 л) в баре вне отеля", unit: "за пиво", tip: "Попросите меню с ценами до заказа. В отелях и ночных клубах дороже." },
    shisha: { name: "Кальян в кафе", unit: "за кальян", tip: "Уточните, добавляются ли к счёту сервисный сбор и налог." },
    water: { name: "Бутылка воды (1,5 л) в магазине", unit: "за бутылку", tip: "В супермаркетах цены указаны на полках. Киоски рядом с отелями часто берут с туристов вдвое больше." },
  },
  visaTip: {
    beforeIncrease: "Покупайте её сами в банковском окошке до паспортного контроля, наличными в долларах США. С 1 января 2027 года сбор вырастет до 33 $. Также можно заранее оформить официальную электронную визу онлайн. Никому не нужно платить за «помощь».",
    afterIncrease: "Покупайте её сами в банковском окошке до паспортного контроля, наличными в долларах США. Также можно заранее оформить официальную электронную визу онлайн. Никому не нужно платить за «помощь».",
  },
  habitsTitle: "Пять привычек, которые защищают от переплаты",
  habits: [
    "Договаривайтесь об итоговой цене, валюте и «за машину или за человека» до начала поездки.",
    "Носите с собой мелкие купюры египетских фунтов — «нет сдачи» — частый способ оставить разницу себе.",
    "По возможности пользуйтесь Uber или Careem — приложение показывает цену заранее.",
    "Спрашивайте, что входит в стоимость: трансфер, обед, снаряжение, сборы парков и входные билеты.",
    "Можно просто отказаться и уйти. Честный продавец не будет вас преследовать.",
  ],
  faqTitle: "Частые вопросы",
  faqTaxiQuestion: "Сколько стоит такси из аэропорта Хургады до отеля?",
  faqTaxiAnswer: "До центра Хургады Uber или Careem обычно стоит {uberRange}, а такси или частная машина — {taxiRange} за машину. Всегда договаривайтесь об итоговой цене до посадки.",
  faqVisaQuestion: "Сколько стоит виза в Египет по прилёте?",
  faqVisaAnswer: {
    beforeIncrease: "Однократная виза по прилёте стоит 30 $ до 31 декабря 2026 года и 33 $ с 1 января 2027 года; оплата наличными в банковском окошке до паспортного контроля.",
    afterIncrease: "Однократная виза по прилёте стоит {fee}; оплата наличными в банковском окошке до паспортного контроля.",
  },
  faqOrangeQuestion: "Сколько должна стоить поездка на Орандж Бэй?",
  faqOrangeAnswer: "Групповая морская прогулка на Орандж Бэй с обедом обычно стоит {orangeRange} за взрослого плюс сбор нацпарка около 5 $ наличными.",
  ctaTitle: "Фиксированные цены без торга",
  ctaText: "У каждой экскурсии Daily Red Sea полная цена указана заранее, вместе с трансфером из отеля и чётким списком того, что включено, — а многие поездки можно оплатить наличными в день экскурсии.",
  ctaButton: "Все экскурсии →",
};

const pl: FairPriceCopy = {
  intlLocale: "pl-PL",
  metaTitle: "Uczciwe ceny w Hurghadzie 2026 – ile naprawdę kosztują rzeczy",
  metaDescription: "Uczciwe ceny 2026 w Hurghadzie: taksówka z lotniska, wiza, karta SIM, Orange Bay, snurkowanie, safari, nurkowanie i napoje – plus darmowe narzędzie do sprawdzenia każdej ceny.",
  breadcrumbHome: "Strona główna",
  breadcrumbCurrent: "Uczciwe ceny",
  eyebrow: "Nie przepłacaj · Hurghada",
  heading: "Uczciwe ceny w Hurghadzie",
  intro: "Ile naprawdę kosztują rzeczy w Hurghadzie w 2026 roku – od taksówki z lotniska po wycieczkę na Orange Bay – żebyś cieszył się urlopem bez przepłacania. Ceny sprawdza nasz lokalny zespół.",
  reviewed: "Ostatnia weryfikacja: {date}.",
  disclaimer: "Ceny się zmieniają; przedziały są orientacyjne, to nie jest oficjalny cennik.",
  checker: {
    eyebrow: "Darmowe narzędzie",
    title: "Czy ta cena jest uczciwa?",
    intro: "Wybierz, co ci zaproponowano, wpisz cenę i od razu sprawdź, czy jest uczciwa.",
    offeredLabel: "Co ci zaproponowano?",
    quotedLabel: "Podana cena ({unit})",
    currencyLabel: "Waluta",
    placeholder: "np. 500",
    fairRange: "Uczciwa cena:",
    atTodaysRate: "≈ {amount} po dzisiejszym kursie",
    tipLabel: "Wskazówka:",
    book: "Zarezerwuj u nas – {label} →",
    ask: "Nie masz pewności? Zapytaj nas na WhatsAppie",
    askMessage: "Cześć, Daily Red Sea! Czy to uczciwa cena? Zaproponowano mi {amount} za: {name}.",
    priceUnknown: "[cena]",
  },
  verdicts: {
    below: { title: "Dobra cena", body: "To poniżej zwykłego przedziału. Świetnie, jeśli oferta jest rzetelna – sprawdź tylko dokładnie, co jest w cenie." },
    fair: { title: "Uczciwa cena", body: "To mieści się w normalnym przedziale dla Hurghady. Baw się dobrze." },
    high: { title: "Trochę drogo", body: "To nie oszustwo, ale płacisz więcej niż większość turystów. Spróbuj negocjować w stronę uczciwego przedziału." },
    ripoff: { title: "Zdzierstwo", body: "To znacznie więcej, niż powinno kosztować. Odmów albo najpierw porównaj inne oferty." },
  },
  ripoffOver: "Zdzierstwo: powyżej {amount}",
  ripoffFixed: "Zdzierstwo: więcej niż {amount}",
  ourTour: "Daily Red Sea: {title} – {label}",
  tourFrom: "od {price}",
  tourUnits: { "per person": "za osobę", "per vehicle": "za pojazd", "per private boat": "za prywatną łódź" },
  categories: { arrival: "Po przylocie", transport: "Taksówki i transfery", trips: "Rejsy, safari i wycieczki", food: "Napoje i codzienne ceny" },
  items: {
    "visa-on-arrival": { name: "Wiza do Egiptu po przylocie (jednokrotna)", unit: "za osobę", tip: "" },
    "tourist-sim": { name: "Turystyczna karta SIM na lotnisku (30–40 GB)", unit: "za kartę", tip: "Kupuj tylko na oficjalnych stoiskach Vodafone, Orange, Etisalat lub WE za odbiorem bagażu, z paszportem. Unikaj kart SIM ze sklepów z pamiątkami." },
    "airport-uber-central": { name: "Lotnisko → hotel w centrum Hurghady przez Uber lub Careem", unit: "za auto", tip: "Aplikacja pokazuje cenę przed kursem. Przejdź do strefy odbioru przed halą przylotów i sprawdź numer rejestracyjny." },
    "airport-taxi-central": { name: "Lotnisko → hotel w centrum taksówką lub prywatnym autem", unit: "za auto", tip: "Ustal łączną cenę i walutę przed wejściem do auta i upewnij się, że to cena za auto, a nie za osobę. Rezerwacja z wyprzedzeniem gwarantuje cenę." },
    "airport-taxi-makadi-sahl": { name: "Lotnisko → Makadi Bay lub Sahl Hasheesh", unit: "za auto", tip: "Te kurorty są 20–40 minut drogi od lotniska. Ceny podawane w euro na postoju taksówek są zwykle najbardziej zawyżone." },
    "airport-taxi-el-gouna": { name: "Lotnisko → El Gouna", unit: "za auto", tip: "El Gouna leży ok. 30–40 minut na północ. Aplikacje przewozowe są często najtańsze; potwierdź bramę wjazdową swojego hotelu." },
    "town-taxi": { name: "Krótki kurs taksówką po Hurghadzie (3–5 km)", unit: "za auto", tip: "Taksówki uliczne rzadko używają taksometru. Ustal cenę z góry albo skorzystaj z Ubera/Careem ze stałą ceną." },
    "orange-bay": { name: "Grupowy rejs na Orange Bay z obiadem", unit: "za osobę dorosłą", tip: "Większość cen nie obejmuje opłaty za park narodowy Giftun (ok. 5 $, gotówką na miejscu). Zapytaj, czy transfer z hotelu i obiad są w cenie." },
    "snorkeling-boat": { name: "Rejs ze snurkowaniem i obiadem (2–3 przystanki na rafach)", unit: "za osobę dorosłą", tip: "Sprawdź, czy sprzęt do snurkowania, obiad i transfer z hotelu są w cenie, a na łodzi są kamizelki ratunkowe w twoim rozmiarze." },
    "dolphin-house": { name: "Wycieczka ze snurkowaniem do Dolphin House", unit: "za osobę dorosłą", tip: "Delfiny są dzikie i spotkanie z nimi nigdy nie jest gwarantowane. Uważaj na każdego, kto „gwarantuje” pływanie z delfinami albo dolicza opłatę za podpłynięcie bliżej." },
    "quad-safari": { name: "Safari na quadach z przejażdżką na wielbłądzie (2–3 godziny)", unit: "za osobę dorosłą", tip: "Zapytaj, czy quad jest dzielony, czy pojedynczy, i czy w cenie jest kolacja lub pokaz – to tłumaczy większość różnic w cenach." },
    "intro-dive": { name: "Nurkowanie próbne z łodzi (bez licencji)", unit: "za osobę", tip: "Upewnij się, że instruktor jest z tobą w wodzie przez cały czas, a sprzęt i opłata za park morski są w cenie." },
    "luxor-private-day": { name: "Prywatna jednodniowa wycieczka do Luksoru z Hurghady (2 osoby)", unit: "za osobę", tip: "Ustal, które bilety wstępu są w cenie – Dolina Królów i specjalne grobowce często są dodatkowo płatne." },
    "local-beer": { name: "Lokalne piwo (0,5 l) w barze poza hotelem", unit: "za piwo", tip: "Poproś o menu z cenami przed zamówieniem. W hotelach i klubach nocnych jest drożej." },
    shisha: { name: "Fajka wodna (shisha) w kawiarni", unit: "za fajkę", tip: "Sprawdź, czy do rachunku doliczana jest opłata serwisowa i podatek." },
    water: { name: "Woda butelkowana (1,5 l) w sklepie", unit: "za butelkę", tip: "Supermarkety mają ceny na półkach. Kioski przy hotelach często liczą turystom podwójnie." },
  },
  visaTip: {
    beforeIncrease: "Kup ją sam w okienku banku przed kontrolą paszportową, gotówką w dolarach amerykańskich. Od 1 stycznia 2027 r. opłata wzrośnie do 33 $. Możesz też przed podróżą złożyć online wniosek o oficjalną e-wizę. Nikt nie musi ci „pomagać” za opłatą.",
    afterIncrease: "Kup ją sam w okienku banku przed kontrolą paszportową, gotówką w dolarach amerykańskich. Możesz też przed podróżą złożyć online wniosek o oficjalną e-wizę. Nikt nie musi ci „pomagać” za opłatą.",
  },
  habitsTitle: "Pięć nawyków, które chronią przed przepłacaniem",
  habits: [
    "Ustal łączną cenę, walutę i „za auto czy za osobę”, zanim cokolwiek się zacznie.",
    "Miej przy sobie drobne banknoty w funtach egipskich – „brak reszty” to częsty sposób na zatrzymanie różnicy.",
    "Gdy to możliwe, korzystaj z Ubera lub Careem; aplikacja pokazuje cenę z góry.",
    "Pytaj, co jest w cenie: transfer, obiad, sprzęt, opłaty za parki i bilety wstępu.",
    "Możesz odmówić i odejść. Uczciwy sprzedawca nie będzie za tobą chodził.",
  ],
  faqTitle: "Częste pytania",
  faqTaxiQuestion: "Ile kosztuje taksówka z lotniska w Hurghadzie do hotelu?",
  faqTaxiAnswer: "Do centrum Hurghady Uber lub Careem kosztuje zwykle {uberRange}, a taksówka lub prywatne auto {taxiRange} za auto. Zawsze ustal łączną cenę przed wejściem do auta.",
  faqVisaQuestion: "Ile kosztuje wiza do Egiptu po przylocie?",
  faqVisaAnswer: {
    beforeIncrease: "Jednokrotna wiza po przylocie kosztuje 30 $ do 31 grudnia 2026 r. i 33 $ od 1 stycznia 2027 r., płatne gotówką w okienku banku przed kontrolą paszportową.",
    afterIncrease: "Jednokrotna wiza po przylocie kosztuje {fee}, płatne gotówką w okienku banku przed kontrolą paszportową.",
  },
  faqOrangeQuestion: "Ile powinna kosztować wycieczka na Orange Bay?",
  faqOrangeAnswer: "Grupowy rejs na Orange Bay z obiadem kosztuje zwykle {orangeRange} za osobę dorosłą, plus ok. 5 $ opłaty za park narodowy gotówką.",
  ctaTitle: "Stałe ceny, bez targowania się",
  ctaText: "Każda wycieczka Daily Red Sea ma pełną cenę podaną z góry, z transferem z hotelu i jasno opisanym zakresem – a za wiele wycieczek można zapłacić gotówką w dniu wyjazdu.",
  ctaButton: "Zobacz wszystkie wycieczki →",
};

const it: FairPriceCopy = {
  intlLocale: "it-IT",
  metaTitle: "Prezzi giusti a Hurghada 2026 – quanto costano davvero le cose",
  metaDescription: "Prezzi giusti 2026 a Hurghada: taxi dall'aeroporto, visto, SIM, Orange Bay, snorkeling, safari, immersioni e bevande – più uno strumento gratuito per verificare qualsiasi prezzo.",
  breadcrumbHome: "Home",
  breadcrumbCurrent: "Prezzi giusti",
  eyebrow: "Non pagare troppo · Hurghada",
  heading: "Prezzi giusti a Hurghada",
  intro: "Quanto costano davvero le cose a Hurghada nel 2026 – dal taxi dall'aeroporto all'escursione a Orange Bay – per goderti la vacanza senza pagare troppo. I prezzi sono verificati dal nostro team locale.",
  reviewed: "Ultima verifica: {date}.",
  disclaimer: "I prezzi cambiano; le fasce sono indicative, non una tariffa ufficiale.",
  checker: {
    eyebrow: "Strumento gratuito",
    title: "Questo prezzo è giusto?",
    intro: "Scegli cosa ti hanno offerto, inserisci il prezzo e scopri subito se è giusto.",
    offeredLabel: "Cosa ti hanno offerto?",
    quotedLabel: "Prezzo proposto ({unit})",
    currencyLabel: "Valuta",
    placeholder: "es. 500",
    fairRange: "Prezzo giusto:",
    atTodaysRate: "≈ {amount} al cambio di oggi",
    tipLabel: "Consiglio:",
    book: "Prenota con noi – {label} →",
    ask: "Hai dubbi? Chiedici su WhatsApp",
    askMessage: "Ciao Daily Red Sea! È un prezzo giusto? Mi hanno offerto {amount} per: {name}.",
    priceUnknown: "[prezzo]",
  },
  verdicts: {
    below: { title: "Buon prezzo", body: "È sotto la fascia abituale. Ottimo se l'offerta è seria: controlla bene cosa è incluso prima di pagare." },
    fair: { title: "Prezzo giusto", body: "È nella fascia normale per Hurghada. Goditi l'esperienza." },
    high: { title: "Un po' caro", body: "Non è una truffa, ma stai pagando più della maggior parte dei turisti. Prova a trattare verso la fascia giusta." },
    ripoff: { title: "Fregatura", body: "È molto più di quanto dovrebbe costare. Lascia perdere o confronta prima altre offerte." },
  },
  ripoffOver: "Fregatura: oltre {amount}",
  ripoffFixed: "Fregatura: più di {amount}",
  ourTour: "Daily Red Sea: {title} – {label}",
  tourFrom: "da {price}",
  tourUnits: { "per person": "a persona", "per vehicle": "a veicolo", "per private boat": "a barca privata" },
  categories: { arrival: "All'arrivo", transport: "Taxi e transfer", trips: "Gite in barca, safari ed escursioni", food: "Bevande e prezzi di tutti i giorni" },
  items: {
    "visa-on-arrival": { name: "Visto all'arrivo per l'Egitto (ingresso singolo)", unit: "a persona", tip: "" },
    "tourist-sim": { name: "SIM turistica in aeroporto (30–40 GB)", unit: "a SIM", tip: "Comprala solo ai banchi ufficiali Vodafone, Orange, Etisalat o WE dopo il ritiro bagagli, con il passaporto. Evita le SIM vendute nei negozi di souvenir." },
    "airport-uber-central": { name: "Aeroporto → hotel nel centro di Hurghada con Uber o Careem", unit: "ad auto", tip: "L'app mostra il prezzo prima della corsa. Raggiungi la zona di ritiro fuori dagli arrivi e controlla la targa." },
    "airport-taxi-central": { name: "Aeroporto → hotel in centro con taxi o auto privata", unit: "ad auto", tip: "Concorda prezzo totale e valuta prima di salire e verifica che sia per auto, non a persona. Prenotando in anticipo il prezzo è fisso." },
    "airport-taxi-makadi-sahl": { name: "Aeroporto → Makadi Bay o Sahl Hasheesh", unit: "ad auto", tip: "Questi resort distano 20–40 minuti. I prezzi in euro proposti alla fila dei taxi sono di solito i più gonfiati." },
    "airport-taxi-el-gouna": { name: "Aeroporto → El Gouna", unit: "ad auto", tip: "El Gouna è a circa 30–40 minuti a nord. Le app di ride-hailing sono spesso le più economiche; conferma l'ingresso del tuo hotel." },
    "town-taxi": { name: "Breve corsa in taxi a Hurghada (3–5 km)", unit: "ad auto", tip: "I taxi di strada usano raramente il tassametro. Concorda il prezzo prima o usa Uber/Careem per una tariffa fissa." },
    "orange-bay": { name: "Gita in barca di gruppo a Orange Bay con pranzo", unit: "ad adulto", tip: "Quasi sempre il prezzo esclude la tassa del parco nazionale di Giftun (circa 5 $, in contanti sul posto). Chiedi se transfer dall'hotel e pranzo sono inclusi." },
    "snorkeling-boat": { name: "Gita in barca con snorkeling e pranzo (2–3 soste sulla barriera)", unit: "ad adulto", tip: "Verifica che attrezzatura da snorkeling, pranzo e transfer dall'hotel siano inclusi e che a bordo ci siano giubbotti di salvataggio della tua taglia." },
    "dolphin-house": { name: "Escursione di snorkeling a Dolphin House", unit: "ad adulto", tip: "I delfini sono selvatici e l'incontro non è mai garantito. Diffida di chi “garantisce” di nuotare con loro o chiede un extra per avvicinarsi." },
    "quad-safari": { name: "Safari in quad con giro in cammello (2–3 ore)", unit: "ad adulto", tip: "Chiedi se il quad è condiviso o singolo e se cena o spettacolo sono inclusi: spiega gran parte delle differenze di prezzo." },
    "intro-dive": { name: "Battesimo del mare dalla barca (senza brevetto)", unit: "a persona", tip: "Assicurati che un istruttore resti con te in acqua e che attrezzatura e tassa del parco marino siano incluse." },
    "luxor-private-day": { name: "Escursione privata di un giorno a Luxor da Hurghada (2 viaggiatori)", unit: "a persona", tip: "Verifica quali biglietti d'ingresso sono inclusi: la Valle dei Re e le tombe speciali sono spesso extra." },
    "local-beer": { name: "Birra locale (0,5 l) in un bar fuori dagli hotel", unit: "a birra", tip: "Chiedi il menu con i prezzi prima di ordinare. In hotel e in discoteca costa di più." },
    shisha: { name: "Narghilè in un caffè", unit: "a narghilè", tip: "Controlla se al conto vengono aggiunti servizio e tasse." },
    water: { name: "Acqua in bottiglia (1,5 l) in negozio", unit: "a bottiglia", tip: "Nei supermercati i prezzi sono sugli scaffali. I chioschi vicino agli hotel spesso fanno pagare il doppio ai turisti." },
  },
  visaTip: {
    beforeIncrease: "Compralo da solo allo sportello della banca prima del controllo passaporti, in contanti in dollari USA. Dal 1° gennaio 2027 la tassa sale a 33 $. Puoi anche richiedere online un e-visa ufficiale prima di partire. Nessuno deve “aiutarti” a pagamento.",
    afterIncrease: "Compralo da solo allo sportello della banca prima del controllo passaporti, in contanti in dollari USA. Puoi anche richiedere online un e-visa ufficiale prima di partire. Nessuno deve “aiutarti” a pagamento.",
  },
  habitsTitle: "Cinque abitudini contro i prezzi gonfiati",
  habits: [
    "Concorda prezzo totale, valuta e “per auto o a persona” prima di iniziare.",
    "Tieni con te banconote piccole in sterline egiziane: “non ho il resto” è un modo comune per tenersi la differenza.",
    "Quando puoi, usa Uber o Careem: l'app mostra la tariffa in anticipo.",
    "Chiedi cosa è incluso: transfer, pranzo, attrezzatura, tasse dei parchi e biglietti d'ingresso.",
    "Puoi dire di no e andartene. Un venditore onesto non ti inseguirà.",
  ],
  faqTitle: "Domande frequenti",
  faqTaxiQuestion: "Quanto costa un taxi dall'aeroporto di Hurghada all'hotel?",
  faqTaxiAnswer: "Per il centro di Hurghada, Uber o Careem costano di solito {uberRange} e un taxi o un'auto privata {taxiRange} ad auto. Concorda sempre il prezzo totale prima di salire.",
  faqVisaQuestion: "Quanto costa il visto all'arrivo per l'Egitto?",
  faqVisaAnswer: {
    beforeIncrease: "Il visto all'arrivo a ingresso singolo costa 30 $ fino al 31 dicembre 2026 e 33 $ dal 1° gennaio 2027, da pagare in contanti allo sportello della banca prima del controllo passaporti.",
    afterIncrease: "Il visto all'arrivo a ingresso singolo costa {fee}, da pagare in contanti allo sportello della banca prima del controllo passaporti.",
  },
  faqOrangeQuestion: "Quanto dovrebbe costare un'escursione a Orange Bay?",
  faqOrangeAnswer: "Una gita in barca di gruppo a Orange Bay con pranzo costa di solito {orangeRange} ad adulto, più circa 5 $ di tassa del parco nazionale in contanti.",
  ctaTitle: "Prezzi fissi, niente contrattazioni",
  ctaText: "Ogni escursione Daily Red Sea mostra il prezzo completo in anticipo, con transfer dall'hotel e servizi inclusi ben indicati – e molte gite si possono pagare in contanti il giorno stesso.",
  ctaButton: "Scopri tutte le escursioni →",
};

const ar: FairPriceCopy = {
  intlLocale: "ar-EG-u-nu-latn",
  metaTitle: "الأسعار العادلة في الغردقة 2026 — كم تكلّف الأشياء فعلًا",
  metaDescription: "أسعار عادلة لعام 2026 في الغردقة: تاكسي المطار، التأشيرة، شريحة الاتصال، أورانج باي، السنوركل، السفاري، الغوص والمشروبات — مع أداة مجانية للتحقق من أي سعر يُعرض عليك.",
  breadcrumbHome: "الرئيسية",
  breadcrumbCurrent: "الأسعار العادلة",
  eyebrow: "لا تدفع أكثر · الغردقة",
  heading: "دليل الأسعار العادلة في الغردقة",
  intro: "كم تكلّف الأشياء فعلًا في الغردقة في 2026 — من تاكسي المطار إلى رحلة أورانج باي — لتستمتع بإجازتك دون أن تدفع أكثر من اللازم. يراجع فريقنا المحلي هذه الأسعار.",
  reviewed: "آخر مراجعة: {date}.",
  disclaimer: "الأسعار تتغير؛ النطاقات للاسترشاد وليست تعريفة رسمية.",
  checker: {
    eyebrow: "أداة مجانية",
    title: "هل هذا سعر عادل؟",
    intro: "اختر ما عُرض عليك، واكتب السعر، واعرف فورًا إن كان عادلًا.",
    offeredLabel: "ماذا عُرض عليك؟",
    quotedLabel: "السعر المعروض ({unit})",
    currencyLabel: "العملة",
    placeholder: "مثال: 500",
    fairRange: "السعر العادل:",
    atTodaysRate: "≈ {amount} بسعر صرف اليوم",
    tipLabel: "نصيحة:",
    book: "احجز معنا — {label} ←",
    ask: "لست متأكدًا؟ اسألنا على واتساب",
    askMessage: "مرحبًا Daily Red Sea! هل هذا سعر عادل؟ عُرض عليّ {amount} مقابل: {name}.",
    priceUnknown: "[السعر]",
  },
  verdicts: {
    below: { title: "سعر جيد", body: "هذا أقل من النطاق المعتاد. ممتاز إن كان العرض حقيقيًا — فقط تأكد مما يشمله السعر قبل الدفع." },
    fair: { title: "سعر عادل", body: "هذا ضمن النطاق الطبيعي في الغردقة. استمتع بوقتك." },
    high: { title: "مرتفع قليلًا", body: "ليس احتيالًا، لكنك تدفع أكثر من معظم الزوار. حاول التفاوض للوصول إلى النطاق العادل." },
    ripoff: { title: "سعر مبالغ فيه", body: "هذا أعلى بكثير مما يجب. اعتذر أو قارن عروضًا أخرى أولًا." },
  },
  ripoffOver: "مبالغ فيه: أكثر من {amount}",
  ripoffFixed: "مبالغ فيه: أكثر من {amount}",
  ourTour: "Daily Red Sea: {title} — {label}",
  tourFrom: "ابتداءً من {price}",
  tourUnits: { "per person": "للشخص", "per vehicle": "للسيارة", "per private boat": "للقارب الخاص" },
  categories: { arrival: "عند الوصول", transport: "التاكسي والتوصيل", trips: "رحلات القوارب والسفاري والرحلات اليومية", food: "المشروبات والأسعار اليومية" },
  items: {
    "visa-on-arrival": { name: "تأشيرة الدخول إلى مصر عند الوصول (دخول واحد)", unit: "للشخص", tip: "" },
    "tourist-sim": { name: "شريحة اتصال سياحية في المطار (30–40 جيجابايت)", unit: "للشريحة", tip: "اشترِها فقط من منافذ فودافون أو أورانج أو اتصالات أو WE الرسمية بعد استلام الحقائب، ومعك جواز السفر. تجنّب الشرائح المبيعة في محلات الهدايا." },
    "airport-uber-central": { name: "المطار ← فندق في وسط الغردقة عبر أوبر أو كريم", unit: "للسيارة", tip: "يعرض التطبيق السعر قبل الرحلة. توجّه إلى منطقة الالتقاء خارج صالة الوصول وتأكد من رقم اللوحة." },
    "airport-taxi-central": { name: "المطار ← فندق في وسط الغردقة بتاكسي أو سيارة خاصة", unit: "للسيارة", tip: "اتفق على السعر الإجمالي والعملة قبل الركوب، وتأكد أنه للسيارة وليس للفرد. الحجز المسبق يثبّت السعر." },
    "airport-taxi-makadi-sahl": { name: "المطار ← مكادي باي أو سهل حشيش", unit: "للسيارة", tip: "تبعد هذه المنتجعات 20–40 دقيقة. الأسعار المعروضة باليورو عند موقف التاكسي هي غالبًا الأكثر مبالغة." },
    "airport-taxi-el-gouna": { name: "المطار ← الجونة", unit: "للسيارة", tip: "تقع الجونة على بعد نحو 30–40 دقيقة شمالًا. تطبيقات التوصيل غالبًا الأرخص؛ تأكد من بوابة الدخول إلى فندقك." },
    "town-taxi": { name: "مشوار قصير بالتاكسي داخل الغردقة (3–5 كم)", unit: "للسيارة", tip: "نادرًا ما تستخدم سيارات التاكسي العداد. اتفق على السعر مسبقًا أو استخدم أوبر أو كريم لسعر ثابت." },
    "orange-bay": { name: "رحلة قارب جماعية إلى أورانج باي مع الغداء", unit: "للبالغ", tip: "معظم الأسعار لا تشمل رسوم محمية جزيرة الجفتون (نحو 5 دولارات تُدفع نقدًا يوم الرحلة). اسأل إن كان التوصيل من الفندق والغداء مشمولين." },
    "snorkeling-boat": { name: "رحلة قارب للسنوركل مع الغداء (2–3 محطات عند الشعاب)", unit: "للبالغ", tip: "تأكد أن معدات السنوركل والغداء والتوصيل من الفندق مشمولة، وأن على القارب سترات نجاة بمقاسك." },
    "dolphin-house": { name: "رحلة سنوركل إلى بيت الدلافين (دولفين هاوس)", unit: "للبالغ", tip: "الدلافين برية ورؤيتها غير مضمونة أبدًا. احذر ممن «يضمن» السباحة معها أو يطلب مبلغًا إضافيًا للاقتراب منها." },
    "quad-safari": { name: "سفاري بالدراجات الرباعية مع ركوب الجمل (2–3 ساعات)", unit: "للبالغ", tip: "اسأل إن كانت الدراجة مشتركة أو فردية، وإن كان العشاء أو العرض مشمولًا — فهذا يفسر معظم فروق الأسعار." },
    "intro-dive": { name: "غطسة تجريبية من القارب (دون رخصة غوص)", unit: "للشخص", tip: "تأكد أن المدرب يبقى معك في الماء، وأن المعدات ورسوم المحمية البحرية مشمولة." },
    "luxor-private-day": { name: "رحلة خاصة ليوم واحد إلى الأقصر من الغردقة (شخصان)", unit: "للشخص", tip: "تأكد من تذاكر الدخول المشمولة — وادي الملوك والمقابر الخاصة غالبًا بتكلفة إضافية." },
    "local-beer": { name: "بيرة محلية (0.5 لتر) في بار خارج الفنادق", unit: "للكوب", tip: "اطلب قائمة الأسعار قبل الطلب. الأسعار أعلى في الفنادق والملاهي الليلية." },
    shisha: { name: "شيشة في مقهى", unit: "للشيشة", tip: "تأكد إن كانت رسوم الخدمة والضريبة تُضاف إلى الفاتورة." },
    water: { name: "زجاجة مياه (1.5 لتر) من متجر", unit: "للزجاجة", tip: "تعرض محلات السوبرماركت الأسعار على الرفوف. الأكشاك القريبة من الفنادق غالبًا تطلب من السياح الضعف." },
  },
  visaTip: {
    beforeIncrease: "اشترِها بنفسك من شباك البنك قبل الجوازات، نقدًا بالدولار الأمريكي. ترتفع الرسوم إلى 33 دولارًا اعتبارًا من 1 يناير 2027. يمكنك أيضًا التقديم إلكترونيًا على التأشيرة الرسمية قبل السفر. لا أحد يحتاج إلى «مساعدتك» مقابل رسوم.",
    afterIncrease: "اشترِها بنفسك من شباك البنك قبل الجوازات، نقدًا بالدولار الأمريكي. يمكنك أيضًا التقديم إلكترونيًا على التأشيرة الرسمية قبل السفر. لا أحد يحتاج إلى «مساعدتك» مقابل رسوم.",
  },
  habitsTitle: "خمس عادات تحميك من المبالغة في الأسعار",
  habits: [
    "اتفق على السعر الإجمالي والعملة و«للسيارة أم للفرد» قبل أن يبدأ أي شيء.",
    "احمل فئات صغيرة من الجنيه المصري — «مفيش فكة» طريقة شائعة للاحتفاظ بالفرق.",
    "استخدم أوبر أو كريم عندما تستطيع؛ فالتطبيق يعرض الأجرة مسبقًا.",
    "اسأل عمّا يشمله السعر: التوصيل والغداء والمعدات ورسوم المحميات وتذاكر الدخول.",
    "من حقك أن ترفض وتمضي. البائع الأمين لن يلاحقك.",
  ],
  faqTitle: "أسئلة شائعة",
  faqTaxiQuestion: "كم سعر التاكسي من مطار الغردقة إلى الفندق؟",
  faqTaxiAnswer: "إلى وسط الغردقة، يكلّف أوبر أو كريم عادةً {uberRange}، والتاكسي أو السيارة الخاصة {taxiRange} للسيارة. اتفق دائمًا على السعر الإجمالي قبل الركوب.",
  faqVisaQuestion: "كم سعر تأشيرة الدخول إلى مصر عند الوصول؟",
  faqVisaAnswer: {
    beforeIncrease: "تكلّف تأشيرة الدخول الواحد عند الوصول 30 دولارًا حتى 31 ديسمبر 2026، و33 دولارًا اعتبارًا من 1 يناير 2027، وتُدفع نقدًا في شباك البنك قبل الجوازات.",
    afterIncrease: "تكلّف تأشيرة الدخول الواحد عند الوصول {fee}، وتُدفع نقدًا في شباك البنك قبل الجوازات.",
  },
  faqOrangeQuestion: "كم يجب أن تكلّف رحلة أورانج باي؟",
  faqOrangeAnswer: "تكلّف رحلة القارب الجماعية إلى أورانج باي مع الغداء عادةً {orangeRange} للبالغ، إضافة إلى رسوم محمية تقارب 5 دولارات نقدًا.",
  ctaTitle: "أسعار ثابتة بلا مساومة",
  ctaText: "كل رحلة من Daily Red Sea تعرض السعر الكامل مسبقًا، مع التوصيل من الفندق وما يشمله السعر بوضوح — ويمكن دفع ثمن كثير من الرحلات نقدًا يوم الرحلة.",
  ctaButton: "تصفّح كل الرحلات ←",
};

const zh: FairPriceCopy = {
  intlLocale: "zh-CN",
  metaTitle: "赫尔格达公道价格指南 2026 — 东西到底该多少钱",
  metaDescription: "2026 年赫尔格达公道价格：机场出租车、签证、电话卡、橙色湾、浮潜、沙漠越野、潜水和饮品——另附免费工具，帮你核实任何报价。",
  breadcrumbHome: "首页",
  breadcrumbCurrent: "公道价格",
  eyebrow: "别多花冤枉钱 · 赫尔格达",
  heading: "赫尔格达公道价格指南",
  intro: "2026 年在赫尔格达，从机场出租车到橙色湾一日游，各项消费到底该多少钱——让你安心度假，不被宰客。价格由我们的本地团队核实。",
  reviewed: "最近核实：{date}。",
  disclaimer: "价格会变动；区间仅供参考，并非官方定价。",
  checker: {
    eyebrow: "免费工具",
    title: "这个价格公道吗？",
    intro: "选择对方给你报价的项目，输入价格，立刻知道是否公道。",
    offeredLabel: "对方给你报的是什么项目？",
    quotedLabel: "报价（{unit}）",
    currencyLabel: "货币",
    placeholder: "例如 500",
    fairRange: "公道价格：",
    atTodaysRate: "按今日汇率约 {amount}",
    tipLabel: "提示：",
    book: "向我们预订 — {label} →",
    ask: "拿不准？在 WhatsApp 上问我们",
    askMessage: "你好 Daily Red Sea！这个价格公道吗？对方给我报价 {amount}，项目是：{name}。",
    priceUnknown: "[价格]",
  },
  verdicts: {
    below: { title: "价格很好", body: "低于常见价格区间。如果靠谱就太好了——付款前确认清楚包含哪些内容。" },
    fair: { title: "价格公道", body: "在赫尔格达的正常价格范围内，放心享受吧。" },
    high: { title: "有点贵", body: "不算骗局，但你付的比大多数游客多。试着砍价到公道区间。" },
    ripoff: { title: "宰客价", body: "远高于应有的价格。可以拒绝，或先比较其他报价。" },
  },
  ripoffOver: "宰客价：高于 {amount}",
  ripoffFixed: "宰客价：超过 {amount}",
  ourTour: "Daily Red Sea：{title} — {label}",
  tourFrom: "{price} 起",
  tourUnits: { "per person": "每人", "per vehicle": "每车", "per private boat": "每艘私人船" },
  categories: { arrival: "抵达必备", transport: "出租车与接送", trips: "出海、沙漠越野与一日游", food: "饮品与日常价格" },
  items: {
    "visa-on-arrival": { name: "埃及落地签证（单次入境）", unit: "每人", tip: "" },
    "tourist-sim": { name: "机场旅游电话卡（30–40 GB）", unit: "每张", tip: "只在取完行李后的 Vodafone、Orange、Etisalat 或 WE 官方柜台购买，需要护照。不要在纪念品店买电话卡。" },
    "airport-uber-central": { name: "机场 → 赫尔格达市中心酒店（Uber 或 Careem）", unit: "每车", tip: "应用会在上车前显示价格。前往到达大厅外的上车区，并核对车牌号。" },
    "airport-taxi-central": { name: "机场 → 市中心酒店（出租车或包车）", unit: "每车", tip: "上车前谈好总价和货币，并确认是按车计价而不是按人。提前预订可锁定价格。" },
    "airport-taxi-makadi-sahl": { name: "机场 → 马卡迪湾或萨哈西什", unit: "每车", tip: "这些度假区距机场 20–40 分钟车程。出租车点用欧元报的价格通常虚高最多。" },
    "airport-taxi-el-gouna": { name: "机场 → 埃尔古纳", unit: "每车", tip: "埃尔古纳在北边约 30–40 分钟车程。打车应用往往最便宜；请确认酒店的入口大门。" },
    "town-taxi": { name: "赫尔格达市内短途出租车（3–5 公里）", unit: "每车", tip: "路边出租车很少打表。先谈好价格，或用 Uber/Careem 获得固定车费。" },
    "orange-bay": { name: "橙色湾拼团出海（含午餐）", unit: "每位成人", tip: "大多数报价不含吉夫顿国家公园费（约 5 美元，当天现金支付）。问清是否包含酒店接送和午餐。" },
    "snorkeling-boat": { name: "浮潜出海一日游（含午餐，2–3 个珊瑚礁点）", unit: "每位成人", tip: "确认含浮潜装备、午餐和酒店接送，且船上备有你尺码的救生衣。" },
    "dolphin-house": { name: "海豚屋浮潜之旅", unit: "每位成人", tip: "海豚是野生的，从来无法保证看到。凡是“保证”能和海豚游泳或加钱靠近的，都要提高警惕。" },
    "quad-safari": { name: "四驱摩托沙漠越野 + 骑骆驼（2–3 小时）", unit: "每位成人", tip: "问清摩托是两人共乘还是单人，以及是否含晚餐或表演——这解释了大部分价格差异。" },
    "intro-dive": { name: "船潜体验潜水（无需潜水证）", unit: "每人", tip: "确保教练在水中全程陪同，并包含装备和海洋公园费。" },
    "luxor-private-day": { name: "赫尔格达出发卢克索私人一日游（2 人）", unit: "每人", tip: "确认包含哪些门票——帝王谷和特殊墓穴通常另收费。" },
    "local-beer": { name: "酒店外酒吧的本地啤酒（0.5 升）", unit: "每杯", tip: "点单前先要带价格的菜单。酒店和夜店更贵。" },
    shisha: { name: "咖啡馆水烟", unit: "每份", tip: "确认账单是否另加服务费和税。" },
    water: { name: "商店瓶装水（1.5 升）", unit: "每瓶", tip: "超市货架上标有价格。酒店附近的小卖部常对游客收双倍。" },
  },
  visaTip: {
    beforeIncrease: "在入境检查前的银行柜台自行购买，用美元现金支付。自 2027 年 1 月 1 日起费用将涨至 33 美元。也可以出发前在网上申请官方电子签证。任何人都不需要收费“帮你”办。",
    afterIncrease: "在入境检查前的银行柜台自行购买，用美元现金支付。也可以出发前在网上申请官方电子签证。任何人都不需要收费“帮你”办。",
  },
  habitsTitle: "防止被宰的五个习惯",
  habits: [
    "开始之前先谈好总价、货币，以及是“按车”还是“按人”。",
    "随身带小面额埃及镑——“没零钱”是常见的扣下差价的办法。",
    "能用 Uber 或 Careem 就用，应用会提前显示车费。",
    "问清包含什么：接送、午餐、装备、公园费和门票。",
    "你可以拒绝并离开。正规商家不会追着你。",
  ],
  faqTitle: "常见问题",
  faqTaxiQuestion: "从赫尔格达机场打车到酒店多少钱？",
  faqTaxiAnswer: "去赫尔格达市中心，Uber 或 Careem 通常 {uberRange}，出租车或包车每车 {taxiRange}。上车前一定先谈好总价。",
  faqVisaQuestion: "埃及落地签多少钱？",
  faqVisaAnswer: {
    beforeIncrease: "单次入境落地签在 2026 年 12 月 31 日前为 30 美元，自 2027 年 1 月 1 日起为 33 美元，在入境检查前的银行柜台用现金支付。",
    afterIncrease: "单次入境落地签为 {fee}，在入境检查前的银行柜台用现金支付。",
  },
  faqOrangeQuestion: "橙色湾一日游应该多少钱？",
  faqOrangeAnswer: "橙色湾拼团出海含午餐通常每位成人 {orangeRange}，另需现金支付约 5 美元国家公园费。",
  ctaTitle: "明码标价，无需砍价",
  ctaText: "Daily Red Sea 的每个行程都提前显示全价，清楚列明酒店接送和包含项目——许多行程还可以当天现金支付。",
  ctaButton: "浏览全部行程 →",
};

export const fairPriceCopy: Record<Locale, FairPriceCopy> = { en, de, ru, pl, it, ar, zh };
