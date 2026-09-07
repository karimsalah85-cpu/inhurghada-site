"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Car, Clock3, Hotel, Luggage, MessageCircle, Plane, Users } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath } from "@/lib/i18n";
import { confirmationStorageKey } from "@/lib/booking-confirmation";
import { isTransferLeadTimeValid, minimumTransferSlot } from "@/lib/booking-validation";
import PhoneNumberInput from "@/components/booking/PhoneNumberInput";
import { validatePhoneNumber } from "@/lib/phone";
import {
  TRANSFER_ZONE_KEYS,
  mapHotelToZone,
  type OversizedItemType,
  type TransferZoneKey,
} from "@/lib/transfer-config";
import { calculateTransferQuote } from "@/lib/transfer-quote";

type Locale = "en" | "de" | "ru" | "ar" | "pl" | "zh";

const ZONE_LABELS: Record<TransferZoneKey, string> = {
  hurghada_city: "Hurghada City / Marina / Mamsha / Village Road",
  el_ahyaa: "El Ahyaa / North Hurghada",
  sahl_hasheesh: "Sahl Hasheesh",
  makadi_bay: "Makadi Bay",
  el_gouna: "El Gouna",
  soma_bay: "Soma Bay",
  safaga: "Safaga",
  el_quseir: "El Quseir",
  port_ghalib: "Port Ghalib",
  marsa_alam: "Marsa Alam",
};

const VEHICLE_LABELS: Record<string, string> = {
  sedan: "Private Sedan",
  suv: "Private SUV",
  minivan: "Private Minivan",
  hiace: "Private Hiace / Van",
  minibus: "Private Minibus",
};

const OVERSIZED_TYPES: OversizedItemType[] = [
  "golf_bag",
  "kitesurf",
  "windsurf",
  "diving_equipment",
  "bicycle",
  "surfboard",
  "wheelchair",
  "baby_stroller",
  "other",
];

// English strings. Other locales override the most visible keys; anything not
// listed falls back to English so the flow is never broken by a missing string.
const EN = {
  heading: "Book a private airport transfer",
  sub: "Price is per vehicle and per journey — not per person. We match the vehicle to your group and luggage.",
  journey: "Journey",
  oneWay: "One way",
  roundTrip: "Round trip",
  direction: "Direction",
  airportToHotel: "Hurghada Airport → Hotel",
  hotelToAirport: "Hotel → Hurghada Airport",
  hotelToHotel: "Hotel → Hotel",
  hotel: "Hotel / resort / accommodation",
  hotelPlaceholder: "e.g. Steigenberger Aqua Magic, Hurghada",
  zone: "Pricing area",
  zoneAuto: "Detected from your hotel",
  zoneManual: "Select the closest area",
  date: "Arrival date",
  time: "Arrival / pickup time",
  leadTime: "Please allow at least 1 hour before pickup.",
  flight: "Flight number (for airport pickups)",
  returnDate: "Return date",
  returnTime: "Return pickup time",
  returnFlight: "Return flight number",
  returnHint: "Give the time you want to be collected from the hotel, not the flight departure time.",
  paxLuggage: "Passengers & luggage",
  adults: "Adults",
  children: "Children",
  infants: "Infants / babies",
  paxNote: "Adults, children and infants all take a seat and count toward vehicle capacity.",
  largeBags: "Large suitcases / checked bags",
  cabinBags: "Small cabin bags / backpacks",
  oversizedToggle: "I am travelling with oversized equipment",
  oversizedNote: "Vehicle selection depends on both passenger and luggage capacity.",
  otherLabel: "Describe the item",
  seatsToggle: "I need child seats",
  seatsNote: "Child and baby seats must be requested in advance and are subject to availability. Seats are free.",
  infantSeat: "Infant seat",
  childSeat: "Child seat",
  boosterSeat: "Booster seat",
  wheelchair: "Wheelchair / mobility equipment",
  wcNone: "None",
  wcFolding: "Folding manual wheelchair",
  wcPowered: "Powered wheelchair / mobility scooter / must stay seated in wheelchair",
  vehiclePrice: "Recommended vehicle & price",
  yourGroup: "Your group",
  upTo: "Up to",
  passengers: "passengers",
  suitcases: "large suitcases",
  privateNotShared: "Private transfer — not shared, not per person",
  totalLabel: "Transfer price",
  total: "total",
  twoVehicles: "2 private vehicles will be dispatched for your group.",
  manualTitle: "Request a transfer quote",
  manualBody: "This trip needs a quick check by our team before we can confirm the vehicle and price. Send the request and we will reply on WhatsApp.",
  reason_powered_wheelchair: "Accessible vehicle confirmation required for a powered wheelchair or scooter.",
  reason_route_not_mapped: "We could not match your accommodation to a pricing area.",
  reason_hotel_to_hotel: "Hotel-to-hotel private transfers are quoted individually.",
  reason_oversized_needs_confirmation: "The declared oversized equipment needs a vehicle check.",
  reason_group_exceeds_fleet: "Large group — we will arrange the right combination of vehicles.",
  reason_luggage_exceeds_fleet: "That much luggage needs a vehicle check.",
  reason_zone_unpriced: "This route is quoted individually.",
  reason_invalid_passengers: "Add at least one adult passenger.",
  warn_multiple_vehicles: "Your group requires 2 vehicles.",
  warn_vehicle_upsized_for_luggage: "We upgraded your vehicle so the luggage fits safely.",
  warn_folding_wheelchair_space: "We have reserved boot space for a folding wheelchair.",
  warn_oversized_declared: "Thanks for declaring oversized equipment — we will send a suitable vehicle.",
  contact: "Your details",
  name: "Full name",
  phone: "WhatsApp number",
  phoneHint: "We use this for booking confirmation and pickup details.",
  email: "Email address",
  notes: "Special requests (optional)",
  review: "Review & confirm",
  cancellationBefore: "Before booking, please review our",
  cancellation: "cancellation policy",
  agree: "By submitting, you agree to our terms and conditions.",
  submit: "Request transfer",
  submitting: "Sending transfer request…",
  errRoute: "Choose your journey and accommodation.",
  errLead: "We need at least 1 hour to arrange your transfer. Choose a later pickup time.",
  errReturnLead: "The return transfer also needs at least 1 hour of notice.",
  errPhone: "Please enter a valid WhatsApp phone number including the country code.",
  errGeneric: "Transfer request failed. Please try again.",
  errNetwork: "We could not reach the booking service. Check your connection and try again.",
  oversizedLabels: {
    golf_bag: "Golf bag",
    kitesurf: "Kite-surfing equipment",
    windsurf: "Windsurfing equipment",
    diving_equipment: "Diving equipment",
    bicycle: "Bicycle",
    surfboard: "Surfboard",
    wheelchair: "Wheelchair",
    baby_stroller: "Baby stroller",
    other: "Other oversized baggage",
  } as Record<OversizedItemType, string>,
};

type CopyShape = typeof EN;

const DE: CopyShape = {
  heading: "Privaten Flughafentransfer buchen",
  sub: "Der Preis gilt pro Fahrzeug und pro Fahrt – nicht pro Person. Wir wählen das passende Fahrzeug für Gruppe und Gepäck.",
  journey: "Fahrt",
  oneWay: "Einfache Fahrt",
  roundTrip: "Hin- und Rückfahrt",
  direction: "Richtung",
  airportToHotel: "Flughafen Hurghada → Hotel",
  hotelToAirport: "Hotel → Flughafen Hurghada",
  hotelToHotel: "Hotel → Hotel",
  hotel: "Hotel / Resort / Unterkunft",
  hotelPlaceholder: "z. B. Steigenberger Aqua Magic, Hurghada",
  zone: "Preiszone",
  zoneAuto: "Anhand deines Hotels erkannt",
  zoneManual: "Wähle das nächstgelegene Gebiet",
  date: "Ankunftsdatum",
  time: "Ankunfts-/Abholzeit",
  leadTime: "Bitte mindestens 1 Stunde vor der Abholung buchen.",
  flight: "Flugnummer (für Flughafenabholungen)",
  returnDate: "Rückreisedatum",
  returnTime: "Abholzeit für die Rückfahrt",
  returnFlight: "Flugnummer Rückflug",
  returnHint: "Gib die gewünschte Abholzeit am Hotel an, nicht die Abflugzeit.",
  paxLuggage: "Fahrgäste & Gepäck",
  adults: "Erwachsene",
  children: "Kinder",
  infants: "Kleinkinder / Babys",
  paxNote: "Erwachsene, Kinder und Kleinkinder belegen jeweils einen Sitzplatz und zählen zur Fahrzeugkapazität.",
  largeBags: "Große Koffer / aufgegebenes Gepäck",
  cabinBags: "Kleine Handgepäckstücke / Rucksäcke",
  oversizedToggle: "Ich reise mit übergroßer Ausrüstung",
  oversizedNote: "Die Fahrzeugwahl hängt von Fahrgast- und Gepäckkapazität ab.",
  otherLabel: "Gegenstand beschreiben",
  seatsToggle: "Ich benötige Kindersitze",
  seatsNote: "Kinder- und Babysitze müssen im Voraus angefragt werden und sind nach Verfügbarkeit. Sitze sind kostenlos.",
  infantSeat: "Babyschale",
  childSeat: "Kindersitz",
  boosterSeat: "Sitzerhöhung",
  wheelchair: "Rollstuhl / Mobilitätshilfe",
  wcNone: "Keine",
  wcFolding: "Faltbarer manueller Rollstuhl",
  wcPowered: "Elektrorollstuhl / Mobilitätsscooter / muss im Rollstuhl sitzen bleiben",
  vehiclePrice: "Empfohlenes Fahrzeug & Preis",
  yourGroup: "Deine Gruppe",
  upTo: "Bis zu",
  passengers: "Fahrgäste",
  suitcases: "große Koffer",
  privateNotShared: "Privattransfer – nicht geteilt, nicht pro Person",
  totalLabel: "Transferpreis",
  total: "gesamt",
  twoVehicles: "Für deine Gruppe werden 2 private Fahrzeuge eingesetzt.",
  manualTitle: "Transferangebot anfragen",
  manualBody: "Diese Fahrt muss unser Team kurz prüfen, bevor wir Fahrzeug und Preis bestätigen können. Sende die Anfrage – wir antworten per WhatsApp.",
  reason_powered_wheelchair: "Für einen Elektrorollstuhl oder Scooter ist die Bestätigung eines barrierefreien Fahrzeugs erforderlich.",
  reason_route_not_mapped: "Wir konnten deine Unterkunft keiner Preiszone zuordnen.",
  reason_hotel_to_hotel: "Private Transfers von Hotel zu Hotel werden individuell angeboten.",
  reason_oversized_needs_confirmation: "Die angegebene übergroße Ausrüstung erfordert eine Fahrzeugprüfung.",
  reason_group_exceeds_fleet: "Große Gruppe – wir stellen die passende Fahrzeugkombination zusammen.",
  reason_luggage_exceeds_fleet: "So viel Gepäck erfordert eine Fahrzeugprüfung.",
  reason_zone_unpriced: "Diese Strecke wird individuell angeboten.",
  reason_invalid_passengers: "Füge mindestens einen erwachsenen Fahrgast hinzu.",
  warn_multiple_vehicles: "Deine Gruppe benötigt 2 Fahrzeuge.",
  warn_vehicle_upsized_for_luggage: "Wir haben ein größeres Fahrzeug gewählt, damit das Gepäck sicher passt.",
  warn_folding_wheelchair_space: "Wir haben Kofferraumplatz für einen faltbaren Rollstuhl reserviert.",
  warn_oversized_declared: "Danke für die Angabe der übergroßen Ausrüstung – wir senden ein passendes Fahrzeug.",
  contact: "Deine Daten",
  name: "Vollständiger Name",
  phone: "WhatsApp-Nummer",
  phoneHint: "Wir verwenden sie für die Buchungsbestätigung und Abholdetails.",
  email: "E-Mail-Adresse",
  notes: "Besondere Wünsche (optional)",
  review: "Prüfen & bestätigen",
  cancellationBefore: "Bitte lies vor der Buchung unsere",
  cancellation: "Stornierungsbedingungen",
  agree: "Mit dem Absenden stimmst du unseren Allgemeinen Geschäftsbedingungen zu.",
  submit: "Transfer anfragen",
  submitting: "Transferanfrage wird gesendet…",
  errRoute: "Wähle deine Fahrt und Unterkunft.",
  errLead: "Wir benötigen mindestens 1 Stunde, um deinen Transfer zu organisieren. Wähle eine spätere Abholzeit.",
  errReturnLead: "Auch der Rücktransfer benötigt mindestens 1 Stunde Vorlauf.",
  errPhone: "Bitte gib eine gültige WhatsApp-Nummer inklusive Landesvorwahl ein.",
  errGeneric: "Transferanfrage fehlgeschlagen. Bitte versuche es erneut.",
  errNetwork: "Der Buchungsdienst ist nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.",
  oversizedLabels: {
    golf_bag: "Golfbag",
    kitesurf: "Kitesurf-Ausrüstung",
    windsurf: "Windsurf-Ausrüstung",
    diving_equipment: "Tauchausrüstung",
    bicycle: "Fahrrad",
    surfboard: "Surfbrett",
    wheelchair: "Rollstuhl",
    baby_stroller: "Kinderwagen",
    other: "Anderes Übergepäck",
  },
};

const RU: CopyShape = {
  heading: "Забронировать частный трансфер из аэропорта",
  sub: "Цена — за автомобиль и за поездку, а не за человека. Подбираем автомобиль под вашу группу и багаж.",
  journey: "Поездка",
  oneWay: "В одну сторону",
  roundTrip: "Туда и обратно",
  direction: "Направление",
  airportToHotel: "Аэропорт Хургады → отель",
  hotelToAirport: "Отель → аэропорт Хургады",
  hotelToHotel: "Отель → отель",
  hotel: "Отель / курорт / место проживания",
  hotelPlaceholder: "напр. Steigenberger Aqua Magic, Хургада",
  zone: "Тарифная зона",
  zoneAuto: "Определено по вашему отелю",
  zoneManual: "Выберите ближайший район",
  date: "Дата прибытия",
  time: "Время прибытия / подачи",
  leadTime: "Бронируйте минимум за 1 час до подачи.",
  flight: "Номер рейса (для встречи в аэропорту)",
  returnDate: "Дата обратной поездки",
  returnTime: "Время подачи на обратную поездку",
  returnFlight: "Номер обратного рейса",
  returnHint: "Укажите желаемое время подачи к отелю, а не время вылета.",
  paxLuggage: "Пассажиры и багаж",
  adults: "Взрослые",
  children: "Дети",
  infants: "Младенцы",
  paxNote: "Взрослые, дети и младенцы занимают место и учитываются в вместимости автомобиля.",
  largeBags: "Большие чемоданы / сдаваемый багаж",
  cabinBags: "Ручная кладь / рюкзаки",
  oversizedToggle: "Я еду с негабаритным снаряжением",
  oversizedNote: "Выбор автомобиля зависит и от числа пассажиров, и от объёма багажа.",
  otherLabel: "Опишите предмет",
  seatsToggle: "Мне нужны детские кресла",
  seatsNote: "Детские и бустерные кресла нужно запрашивать заранее, они предоставляются при наличии. Кресла бесплатны.",
  infantSeat: "Кресло для младенца",
  childSeat: "Детское кресло",
  boosterSeat: "Бустер",
  wheelchair: "Инвалидная коляска / средства передвижения",
  wcNone: "Нет",
  wcFolding: "Складная механическая коляска",
  wcPowered: "Электроколяска / скутер / необходимо оставаться в коляске",
  vehiclePrice: "Рекомендуемый автомобиль и цена",
  yourGroup: "Ваша группа",
  upTo: "До",
  passengers: "пассажиров",
  suitcases: "больших чемоданов",
  privateNotShared: "Частный трансфер — не общий и не за человека",
  totalLabel: "Цена трансфера",
  total: "итого",
  twoVehicles: "Для вашей группы будет подано 2 частных автомобиля.",
  manualTitle: "Запросить расчёт трансфера",
  manualBody: "Эту поездку должна быстро проверить наша команда, прежде чем подтвердить автомобиль и цену. Отправьте запрос — мы ответим в WhatsApp.",
  reason_powered_wheelchair: "Для электроколяски или скутера требуется подтверждение доступного автомобиля.",
  reason_route_not_mapped: "Не удалось сопоставить ваше жильё с тарифной зоной.",
  reason_hotel_to_hotel: "Частные трансферы «отель — отель» рассчитываются индивидуально.",
  reason_oversized_needs_confirmation: "Заявленное негабаритное снаряжение требует проверки автомобиля.",
  reason_group_exceeds_fleet: "Большая группа — подберём подходящую комбинацию автомобилей.",
  reason_luggage_exceeds_fleet: "Такой объём багажа требует проверки автомобиля.",
  reason_zone_unpriced: "Этот маршрут рассчитывается индивидуально.",
  reason_invalid_passengers: "Добавьте хотя бы одного взрослого пассажира.",
  warn_multiple_vehicles: "Вашей группе требуется 2 автомобиля.",
  warn_vehicle_upsized_for_luggage: "Мы подобрали автомобиль побольше, чтобы багаж поместился безопасно.",
  warn_folding_wheelchair_space: "Мы зарезервировали место в багажнике для складной коляски.",
  warn_oversized_declared: "Спасибо, что указали негабаритное снаряжение — подадим подходящий автомобиль.",
  contact: "Ваши данные",
  name: "Полное имя",
  phone: "Номер WhatsApp",
  phoneHint: "Используем его для подтверждения брони и деталей подачи.",
  email: "Электронная почта",
  notes: "Особые пожелания (необязательно)",
  review: "Проверить и подтвердить",
  cancellationBefore: "Перед бронированием ознакомьтесь с нашими",
  cancellation: "правилами отмены",
  agree: "Отправляя форму, вы соглашаетесь с нашими условиями.",
  submit: "Запросить трансфер",
  submitting: "Отправка заявки на трансфер…",
  errRoute: "Выберите поездку и место проживания.",
  errLead: "Нам нужно не менее 1 часа на организацию трансфера. Выберите более позднее время подачи.",
  errReturnLead: "Обратному трансферу также нужно не менее 1 часа.",
  errPhone: "Введите действительный номер WhatsApp с кодом страны.",
  errGeneric: "Не удалось отправить заявку на трансфер. Попробуйте ещё раз.",
  errNetwork: "Не удалось связаться с сервисом бронирования. Проверьте соединение и попробуйте снова.",
  oversizedLabels: {
    golf_bag: "Сумка для гольфа",
    kitesurf: "Кайт-снаряжение",
    windsurf: "Виндсёрф-снаряжение",
    diving_equipment: "Снаряжение для дайвинга",
    bicycle: "Велосипед",
    surfboard: "Доска для сёрфинга",
    wheelchair: "Инвалидная коляска",
    baby_stroller: "Детская коляска",
    other: "Другой негабаритный багаж",
  },
};

const AR: CopyShape = {
  heading: "احجز خدمة نقل خاصة من المطار",
  sub: "السعر لكل مركبة ولكل رحلة، وليس لكل شخص. نختار المركبة المناسبة لمجموعتك وأمتعتك.",
  journey: "الرحلة",
  oneWay: "اتجاه واحد",
  roundTrip: "ذهاب وعودة",
  direction: "الاتجاه",
  airportToHotel: "مطار الغردقة ← الفندق",
  hotelToAirport: "الفندق ← مطار الغردقة",
  hotelToHotel: "فندق ← فندق",
  hotel: "الفندق / المنتجع / مكان الإقامة",
  hotelPlaceholder: "مثال: Steigenberger Aqua Magic، الغردقة",
  zone: "منطقة التسعير",
  zoneAuto: "تم تحديدها من فندقك",
  zoneManual: "اختر أقرب منطقة",
  date: "تاريخ الوصول",
  time: "وقت الوصول / الاستلام",
  leadTime: "يرجى الحجز قبل موعد الاستلام بساعة واحدة على الأقل.",
  flight: "رقم الرحلة (لعمليات الاستقبال من المطار)",
  returnDate: "تاريخ العودة",
  returnTime: "وقت استلام رحلة العودة",
  returnFlight: "رقم رحلة العودة",
  returnHint: "حدّد وقت الاستلام المطلوب من الفندق، وليس وقت إقلاع الطائرة.",
  paxLuggage: "الركاب والأمتعة",
  adults: "بالغون",
  children: "أطفال",
  infants: "رُضّع",
  paxNote: "يشغل البالغون والأطفال والرُّضّع مقعداً ويُحتسبون ضمن سعة المركبة.",
  largeBags: "حقائب كبيرة / أمتعة مُسجَّلة",
  cabinBags: "حقائب يد صغيرة / حقائب ظهر",
  oversizedToggle: "أسافر بمعدات كبيرة الحجم",
  oversizedNote: "يعتمد اختيار المركبة على سعة الركاب والأمتعة معاً.",
  otherLabel: "صف العنصر",
  seatsToggle: "أحتاج مقاعد أطفال",
  seatsNote: "يجب طلب مقاعد الأطفال والرُّضّع مسبقاً وهي رهن التوفر. المقاعد مجانية.",
  infantSeat: "مقعد رضيع",
  childSeat: "مقعد طفل",
  boosterSeat: "مقعد داعم",
  wheelchair: "كرسي متحرك / معدات حركة",
  wcNone: "لا شيء",
  wcFolding: "كرسي متحرك يدوي قابل للطي",
  wcPowered: "كرسي متحرك كهربائي / سكوتر / يجب البقاء جالساً في الكرسي",
  vehiclePrice: "المركبة المقترحة والسعر",
  yourGroup: "مجموعتك",
  upTo: "حتى",
  passengers: "ركاب",
  suitcases: "حقائب كبيرة",
  privateNotShared: "نقل خاص — ليس مشتركاً وليس للفرد",
  totalLabel: "سعر النقل",
  total: "الإجمالي",
  twoVehicles: "سيتم إرسال مركبتين خاصتين لمجموعتك.",
  manualTitle: "اطلب عرض سعر للنقل",
  manualBody: "تحتاج هذه الرحلة إلى مراجعة سريعة من فريقنا قبل تأكيد المركبة والسعر. أرسل الطلب وسنرد عبر واتساب.",
  reason_powered_wheelchair: "يلزم تأكيد مركبة مهيأة لكرسي متحرك كهربائي أو سكوتر.",
  reason_route_not_mapped: "تعذّر مطابقة مكان إقامتك بمنطقة تسعير.",
  reason_hotel_to_hotel: "تُسعَّر رحلات النقل الخاصة من فندق إلى فندق بشكل فردي.",
  reason_oversized_needs_confirmation: "تتطلب المعدات كبيرة الحجم المُصرَّح بها فحص المركبة.",
  reason_group_exceeds_fleet: "مجموعة كبيرة — سنرتّب المزيج المناسب من المركبات.",
  reason_luggage_exceeds_fleet: "هذا القدر من الأمتعة يتطلب فحص المركبة.",
  reason_zone_unpriced: "يُسعَّر هذا المسار بشكل فردي.",
  reason_invalid_passengers: "أضف راكباً بالغاً واحداً على الأقل.",
  warn_multiple_vehicles: "تحتاج مجموعتك إلى مركبتين.",
  warn_vehicle_upsized_for_luggage: "اخترنا مركبة أكبر لتتسع الأمتعة بأمان.",
  warn_folding_wheelchair_space: "حجزنا مساحة في صندوق الأمتعة لكرسي متحرك قابل للطي.",
  warn_oversized_declared: "شكراً لإفصاحك عن المعدات كبيرة الحجم — سنرسل مركبة مناسبة.",
  contact: "بياناتك",
  name: "الاسم الكامل",
  phone: "رقم واتساب",
  phoneHint: "نستخدمه لتأكيد الحجز وتفاصيل الاستلام.",
  email: "البريد الإلكتروني",
  notes: "طلبات خاصة (اختياري)",
  review: "المراجعة والتأكيد",
  cancellationBefore: "قبل الحجز، يرجى مراجعة",
  cancellation: "سياسة الإلغاء",
  agree: "بإرسال الطلب، فإنك توافق على الشروط والأحكام.",
  submit: "اطلب النقل",
  submitting: "جارٍ إرسال طلب النقل…",
  errRoute: "اختر رحلتك ومكان إقامتك.",
  errLead: "نحتاج ساعة واحدة على الأقل لترتيب النقل. اختر وقت استلام لاحقاً.",
  errReturnLead: "يحتاج نقل العودة أيضاً إلى مهلة ساعة واحدة على الأقل.",
  errPhone: "يرجى إدخال رقم واتساب صحيح مع رمز الدولة.",
  errGeneric: "تعذّر إرسال طلب النقل. يرجى المحاولة مرة أخرى.",
  errNetwork: "تعذّر الوصول إلى خدمة الحجز. تحقق من اتصالك وحاول مرة أخرى.",
  oversizedLabels: {
    golf_bag: "حقيبة غولف",
    kitesurf: "معدات الطائرة الشراعية",
    windsurf: "معدات ركوب الأمواج الشراعي",
    diving_equipment: "معدات غوص",
    bicycle: "دراجة",
    surfboard: "لوح ركوب أمواج",
    wheelchair: "كرسي متحرك",
    baby_stroller: "عربة أطفال",
    other: "أمتعة أخرى كبيرة الحجم",
  },
};

const PL: CopyShape = {
  heading: "Zarezerwuj prywatny transfer z lotniska",
  sub: "Cena jest za pojazd i za przejazd — nie za osobę. Dobieramy pojazd do grupy i bagażu.",
  journey: "Przejazd",
  oneWay: "W jedną stronę",
  roundTrip: "W obie strony",
  direction: "Kierunek",
  airportToHotel: "Lotnisko w Hurghadzie → hotel",
  hotelToAirport: "Hotel → lotnisko w Hurghadzie",
  hotelToHotel: "Hotel → hotel",
  hotel: "Hotel / kurort / zakwaterowanie",
  hotelPlaceholder: "np. Steigenberger Aqua Magic, Hurghada",
  zone: "Strefa cenowa",
  zoneAuto: "Wykryto na podstawie hotelu",
  zoneManual: "Wybierz najbliższy obszar",
  date: "Data przylotu",
  time: "Godzina przylotu / odbioru",
  leadTime: "Zarezerwuj co najmniej 1 godzinę przed odbiorem.",
  flight: "Numer lotu (dla odbiorów z lotniska)",
  returnDate: "Data powrotu",
  returnTime: "Godzina odbioru w drodze powrotnej",
  returnFlight: "Numer lotu powrotnego",
  returnHint: "Podaj żądaną godzinę odbioru z hotelu, nie godzinę odlotu.",
  paxLuggage: "Pasażerowie i bagaż",
  adults: "Dorośli",
  children: "Dzieci",
  infants: "Niemowlęta",
  paxNote: "Dorośli, dzieci i niemowlęta zajmują miejsce i liczą się do pojemności pojazdu.",
  largeBags: "Duże walizki / bagaż rejestrowany",
  cabinBags: "Małe bagaże podręczne / plecaki",
  oversizedToggle: "Podróżuję z ponadwymiarowym sprzętem",
  oversizedNote: "Dobór pojazdu zależy od liczby pasażerów i pojemności bagażowej.",
  otherLabel: "Opisz przedmiot",
  seatsToggle: "Potrzebuję fotelików dziecięcych",
  seatsNote: "Foteliki dla dzieci i niemowląt należy zamówić z wyprzedzeniem — w miarę dostępności. Foteliki są bezpłatne.",
  infantSeat: "Fotelik dla niemowlęcia",
  childSeat: "Fotelik dziecięcy",
  boosterSeat: "Podstawka",
  wheelchair: "Wózek inwalidzki / sprzęt wspomagający",
  wcNone: "Brak",
  wcFolding: "Składany wózek manualny",
  wcPowered: "Wózek elektryczny / skuter / konieczność pozostania w wózku",
  vehiclePrice: "Zalecany pojazd i cena",
  yourGroup: "Twoja grupa",
  upTo: "Do",
  passengers: "pasażerów",
  suitcases: "dużych walizek",
  privateNotShared: "Transfer prywatny — nie wspólny i nie za osobę",
  totalLabel: "Cena transferu",
  total: "razem",
  twoVehicles: "Dla Twojej grupy zostaną podstawione 2 prywatne pojazdy.",
  manualTitle: "Poproś o wycenę transferu",
  manualBody: "Ten przejazd wymaga szybkiego sprawdzenia przez nasz zespół, zanim potwierdzimy pojazd i cenę. Wyślij zapytanie — odpowiemy na WhatsApp.",
  reason_powered_wheelchair: "Dla wózka elektrycznego lub skutera wymagane jest potwierdzenie pojazdu dostosowanego.",
  reason_route_not_mapped: "Nie udało się dopasować Twojego zakwaterowania do strefy cenowej.",
  reason_hotel_to_hotel: "Prywatne transfery hotel–hotel są wyceniane indywidualnie.",
  reason_oversized_needs_confirmation: "Zgłoszony ponadwymiarowy sprzęt wymaga sprawdzenia pojazdu.",
  reason_group_exceeds_fleet: "Duża grupa — dobierzemy właściwą kombinację pojazdów.",
  reason_luggage_exceeds_fleet: "Taka ilość bagażu wymaga sprawdzenia pojazdu.",
  reason_zone_unpriced: "Ta trasa jest wyceniana indywidualnie.",
  reason_invalid_passengers: "Dodaj co najmniej jednego dorosłego pasażera.",
  warn_multiple_vehicles: "Twoja grupa wymaga 2 pojazdów.",
  warn_vehicle_upsized_for_luggage: "Dobraliśmy większy pojazd, aby bagaż zmieścił się bezpiecznie.",
  warn_folding_wheelchair_space: "Zarezerwowaliśmy miejsce w bagażniku na składany wózek.",
  warn_oversized_declared: "Dziękujemy za zgłoszenie ponadwymiarowego sprzętu — podeślemy odpowiedni pojazd.",
  contact: "Twoje dane",
  name: "Imię i nazwisko",
  phone: "Numer WhatsApp",
  phoneHint: "Użyjemy go do potwierdzenia rezerwacji i szczegółów odbioru.",
  email: "Adres e-mail",
  notes: "Życzenia specjalne (opcjonalnie)",
  review: "Sprawdź i potwierdź",
  cancellationBefore: "Przed rezerwacją zapoznaj się z naszymi",
  cancellation: "zasadami anulowania",
  agree: "Wysyłając formularz, akceptujesz nasz regulamin.",
  submit: "Zapytaj o transfer",
  submitting: "Wysyłanie zapytania o transfer…",
  errRoute: "Wybierz przejazd i zakwaterowanie.",
  errLead: "Potrzebujemy co najmniej 1 godziny na organizację transferu. Wybierz późniejszą godzinę odbioru.",
  errReturnLead: "Transfer powrotny również wymaga co najmniej 1 godziny wyprzedzenia.",
  errPhone: "Podaj prawidłowy numer WhatsApp wraz z numerem kierunkowym kraju.",
  errGeneric: "Nie udało się wysłać zapytania o transfer. Spróbuj ponownie.",
  errNetwork: "Nie udało się połączyć z usługą rezerwacji. Sprawdź połączenie i spróbuj ponownie.",
  oversizedLabels: {
    golf_bag: "Torba golfowa",
    kitesurf: "Sprzęt do kitesurfingu",
    windsurf: "Sprzęt windsurfingowy",
    diving_equipment: "Sprzęt do nurkowania",
    bicycle: "Rower",
    surfboard: "Deska surfingowa",
    wheelchair: "Wózek inwalidzki",
    baby_stroller: "Wózek dziecięcy",
    other: "Inny bagaż ponadwymiarowy",
  },
};

const ZH: CopyShape = {
  heading: "预订私人机场接送",
  sub: "价格按车辆、按行程计算，而非按人。我们会根据人数和行李匹配车辆。",
  journey: "行程",
  oneWay: "单程",
  roundTrip: "往返",
  direction: "方向",
  airportToHotel: "赫尔格达机场 → 酒店",
  hotelToAirport: "酒店 → 赫尔格达机场",
  hotelToHotel: "酒店 → 酒店",
  hotel: "酒店／度假村／住宿",
  hotelPlaceholder: "例如 Steigenberger Aqua Magic，赫尔格达",
  zone: "计价区域",
  zoneAuto: "已根据酒店自动识别",
  zoneManual: "选择最近的区域",
  date: "抵达日期",
  time: "抵达／上车时间",
  leadTime: "请至少提前 1 小时预订。",
  flight: "航班号（用于机场接机）",
  returnDate: "返程日期",
  returnTime: "返程上车时间",
  returnFlight: "返程航班号",
  returnHint: "请填写希望从酒店上车的时间，而非航班起飞时间。",
  paxLuggage: "乘客与行李",
  adults: "成人",
  children: "儿童",
  infants: "婴儿",
  paxNote: "成人、儿童和婴儿都占一个座位，并计入车辆容量。",
  largeBags: "大件行李箱／托运行李",
  cabinBags: "小件随身行李／背包",
  oversizedToggle: "我携带超大装备出行",
  oversizedNote: "车辆选择取决于乘客和行李容量。",
  otherLabel: "描述物品",
  seatsToggle: "我需要儿童座椅",
  seatsNote: "儿童和婴儿座椅须提前申请，视供应情况而定。座椅免费。",
  infantSeat: "婴儿座椅",
  childSeat: "儿童座椅",
  boosterSeat: "增高垫",
  wheelchair: "轮椅／助行设备",
  wcNone: "无",
  wcFolding: "可折叠手动轮椅",
  wcPowered: "电动轮椅／代步车／须坐在轮椅中",
  vehiclePrice: "推荐车辆与价格",
  yourGroup: "您的团队",
  upTo: "最多",
  passengers: "位乘客",
  suitcases: "件大行李箱",
  privateNotShared: "私人接送 — 非拼车、非按人计价",
  totalLabel: "接送价格",
  total: "合计",
  twoVehicles: "将为您的团队派出 2 辆私人车辆。",
  manualTitle: "申请接送报价",
  manualBody: "此行程需要我们团队快速确认后才能给出车辆和价格。请提交申请，我们会通过 WhatsApp 回复。",
  reason_powered_wheelchair: "电动轮椅或代步车需要确认无障碍车辆。",
  reason_route_not_mapped: "无法将您的住宿匹配到计价区域。",
  reason_hotel_to_hotel: "酒店到酒店的私人接送单独报价。",
  reason_oversized_needs_confirmation: "所申报的超大装备需要确认车辆。",
  reason_group_exceeds_fleet: "大型团队 — 我们将安排合适的车辆组合。",
  reason_luggage_exceeds_fleet: "这么多行李需要确认车辆。",
  reason_zone_unpriced: "此路线单独报价。",
  reason_invalid_passengers: "请至少添加一位成人乘客。",
  warn_multiple_vehicles: "您的团队需要 2 辆车。",
  warn_vehicle_upsized_for_luggage: "我们升级了车辆，以便安全容纳行李。",
  warn_folding_wheelchair_space: "我们已为可折叠轮椅预留后备箱空间。",
  warn_oversized_declared: "感谢申报超大装备 — 我们会派出合适车辆。",
  contact: "您的信息",
  name: "全名",
  phone: "WhatsApp 号码",
  phoneHint: "我们用它发送预订确认和接送详情。",
  email: "电子邮箱",
  notes: "特殊要求（选填）",
  review: "核对并确认",
  cancellationBefore: "预订前，请查看我们的",
  cancellation: "取消政策",
  agree: "提交即表示您同意我们的条款与条件。",
  submit: "申请接送",
  submitting: "正在提交接送申请…",
  errRoute: "请选择行程和住宿。",
  errLead: "我们至少需要 1 小时安排接送，请选择更晚的上车时间。",
  errReturnLead: "返程接送也需要至少提前 1 小时。",
  errPhone: "请输入包含国家代码的有效 WhatsApp 号码。",
  errGeneric: "接送申请提交失败，请重试。",
  errNetwork: "无法连接预订服务，请检查网络后重试。",
  oversizedLabels: {
    golf_bag: "高尔夫球包",
    kitesurf: "风筝冲浪装备",
    windsurf: "帆板装备",
    diving_equipment: "潜水装备",
    bicycle: "自行车",
    surfboard: "冲浪板",
    wheelchair: "轮椅",
    baby_stroller: "婴儿车",
    other: "其他超大行李",
  },
};

const COPY: Record<Locale, CopyShape> = { en: EN, de: DE, ru: RU, ar: AR, pl: PL, zh: ZH };

function useCopy(language: Locale) {
  return useMemo(() => COPY[language] ?? EN, [language]);
}

type Direction = "airport_to_hotel" | "hotel_to_airport" | "hotel_to_hotel";
type Wheelchair = "none" | "folding_manual" | "powered_or_fixed";

export default function AirportTransferForm() {
  const router = useRouter();
  const { language } = useSiteSettings();
  const copy = useCopy(language as Locale);
  const idempotencyKey = useRef<string | null>(null);
  const minimumSlot = minimumTransferSlot();

  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const [direction, setDirection] = useState<Direction>("airport_to_hotel");
  const [hotelName, setHotelName] = useState("");
  const [zoneOverride, setZoneOverride] = useState<TransferZoneKey | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [returnFlightNumber, setReturnFlightNumber] = useState("");

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [largeBags, setLargeBags] = useState(2);
  const [cabinBags, setCabinBags] = useState(0);

  const [oversizedOpen, setOversizedOpen] = useState(false);
  const [oversized, setOversized] = useState<Partial<Record<OversizedItemType, number>>>({});
  const [otherNote, setOtherNote] = useState("");
  const [seatsOpen, setSeatsOpen] = useState(false);
  const [infantSeat, setInfantSeat] = useState(0);
  const [childSeat, setChildSeat] = useState(0);
  const [boosterSeat, setBoosterSeat] = useState(0);
  const [wheelchair, setWheelchair] = useState<Wheelchair>("none");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const autoZone = mapHotelToZone(hotelName);
  const zone: TransferZoneKey | null = direction === "hotel_to_hotel" ? null : zoneOverride || autoZone;

  const oversizedItems = useMemo(
    () =>
      (Object.entries(oversized) as [OversizedItemType, number][])
        .filter(([, quantity]) => quantity > 0)
        .map(([type, quantity]) => ({ type, quantity })),
    [oversized],
  );

  const quote = useMemo(
    () =>
      calculateTransferQuote({
        direction,
        zone,
        tripType,
        adults,
        children,
        infants,
        largeBags,
        cabinBags,
        oversizedItems,
        childSeats: { infant: infantSeat, child: childSeat, booster: boosterSeat },
        wheelchair,
      }),
    [direction, zone, tripType, adults, children, infants, largeBags, cabinBags, oversizedItems, infantSeat, childSeat, boosterSeat, wheelchair],
  );

  const totalPassengers = adults + children + infants;

  const quoteStartedRef = useRef(false);
  useEffect(() => {
    if (quoteStartedRef.current) return;
    quoteStartedRef.current = true;
    trackEvent("transfer_quote_started", { booking_type: "transfer" });
  }, []);

  useEffect(() => {
    if (zone) trackEvent("transfer_route_selected", { booking_type: "transfer", destination: zone, trip_type: tripType });
  }, [zone, tripType]);

  const quoteSignature = quote.requiresManualConfirmation
    ? `manual:${quote.reason}:${zone ?? "unmapped"}`
    : `${quote.allocatedVehicles.map((entry) => `${entry.vehicleClass}x${entry.count}`).join("+")}:${quote.total}:${zone ?? ""}`;
  useEffect(() => {
    if (quote.requiresManualConfirmation) {
      trackEvent("transfer_manual_quote_requested", { booking_type: "transfer", reason: quote.reason ?? "unknown", destination: zone ?? "unmapped", traveler_count: totalPassengers });
      return;
    }
    trackEvent("transfer_vehicle_allocated", {
      booking_type: "transfer",
      variant: quote.allocatedVehicles.map((entry) => entry.vehicleClass).join("+"),
      vehicle_count: quote.vehicleCount,
      traveler_count: totalPassengers,
    });
    trackEvent("transfer_quote_generated", {
      booking_type: "transfer",
      destination: zone ?? "",
      trip_type: tripType,
      value: quote.total,
      currency: "USD",
      traveler_count: totalPassengers,
      vehicle_count: quote.vehicleCount,
    });
    // Fires once per distinct allocation/price outcome, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteSignature]);

  function bumpOversized(type: OversizedItemType, delta: number) {
    setOversized((current) => {
      const next = Math.max(0, Math.min(20, (current[type] ?? 0) + delta));
      return { ...current, [type]: next };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (direction !== "hotel_to_hotel" && !hotelName.trim()) {
      alert(copy.errRoute);
      return;
    }
    if (!isTransferLeadTimeValid(date, time)) {
      alert(copy.errLead);
      return;
    }
    if (tripType === "round_trip" && !isTransferLeadTimeValid(returnDate, returnTime)) {
      alert(copy.errReturnLead);
      return;
    }
    const phoneCheck = validatePhoneNumber(phone, "EG");
    if (!phoneCheck.valid) {
      alert(copy.errPhone);
      return;
    }

    const journeyName = `Private airport transfer (${tripType === "round_trip" ? "round trip" : "one way"})`;
    trackEvent("booking_start", {
      booking_type: "transfer",
      item_name: journeyName,
      value: quote.requiresManualConfirmation ? 0 : quote.total,
      currency: "USD",
    });

    setSubmitting(true);
    try {
      idempotencyKey.current ||= crypto.randomUUID();
      const payload = {
        idempotencyKey: idempotencyKey.current,
        type: "transfer" as const,
        transferProduct: "airport-v2" as const,
        locale: language,
        customerName: name.trim(),
        phone: phoneCheck.e164,
        customerEmail: email.trim(),
        tripType,
        direction,
        zone: zone ?? undefined,
        hotel: hotelName.trim(),
        hotelName: hotelName.trim(),
        date,
        time,
        flightNumber: flightNumber.trim(),
        returnDate: tripType === "round_trip" ? returnDate : "",
        returnTime: tripType === "round_trip" ? returnTime : "",
        returnFlightNumber: tripType === "round_trip" ? returnFlightNumber.trim() : "",
        adults,
        children,
        infants,
        largeBags,
        cabinBags,
        oversizedItems: oversizedItems.map((item) =>
          item.type === "other" ? { ...item, note: otherNote.trim() } : item,
        ),
        childSeats: { infant: infantSeat, child: childSeat, booster: boosterSeat },
        wheelchair,
        message: notes.trim(),
        website,
      };
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.error || copy.errGeneric);
        return;
      }

      trackEvent("booking_complete", {
        transaction_id: data.reference,
        booking_type: "transfer",
        item_name: journeyName,
        value: quote.requiresManualConfirmation ? 0 : quote.total,
        currency: "USD",
      });
      trackEvent("transfer_booking_submitted", {
        transaction_id: data.reference,
        booking_type: "transfer",
        destination: zone ?? "unmapped",
        trip_type: tripType,
        traveler_count: totalPassengers,
        vehicle_count: quote.requiresManualConfirmation ? 0 : quote.vehicleCount,
        variant: quote.requiresManualConfirmation ? "manual" : quote.allocatedVehicles.map((entry) => entry.vehicleClass).join("+"),
        value: quote.requiresManualConfirmation ? 0 : quote.total,
        currency: "USD",
      });

      if (!data.whatsappSent && data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      window.sessionStorage.setItem(
        confirmationStorageKey(data.reference),
        JSON.stringify({
          reference: data.reference,
          customerName: name.trim(),
          serviceName: journeyName,
          date,
          time,
          travelers: `${totalPassengers} ${copy.passengers}`,
          total: quote.requiresManualConfirmation ? copy.manualTitle : `$${quote.total.toFixed(2)}`,
          customerEmailSent: Boolean(data.customerEmailSent),
          whatsappSent: Boolean(data.whatsappSent),
          bookingConfirmationPdf: String(data.bookingConfirmationPdf || ""),
        }),
      );
      router.push(`${localePath(language, "/booking/confirmation")}?reference=${encodeURIComponent(data.reference)}`);
    } catch {
      alert(copy.errNetwork);
    } finally {
      setSubmitting(false);
    }
  }

  const reasonKey = quote.reason ? (`reason_${quote.reason}` as keyof CopyShape) : null;

  return (
    <form onSubmit={submit} aria-busy={submitting} className="rounded-3xl bg-white p-6 shadow-2xl md:p-8">
      <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-ocean-tint p-3 text-ocean-dark"><Car /></div>
        <div>
          <h2 className="text-2xl font-bold text-ink">{copy.heading}</h2>
          <p className="mt-1 text-sm text-muted">{copy.sub}</p>
        </div>
      </div>

      {/* Step 1 — Journey */}
      <fieldset className="mt-7">
        <legend className="text-sm font-bold uppercase tracking-wide text-ocean-dark">1 · {copy.journey}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["one_way", "round_trip"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTripType(value)}
              aria-pressed={tripType === value}
              className={`rounded-2xl border p-4 text-start font-bold transition ${tripType === value ? "border-ocean bg-ocean-tint ring-2 ring-ocean-tint" : "border-line hover:border-ocean-soft"}`}
            >
              {value === "one_way" ? copy.oneWay : copy.roundTrip}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Labelled icon={<Plane />} label={copy.direction}>
            <select value={direction} onChange={(event) => setDirection(event.target.value as Direction)}>
              <option value="airport_to_hotel">{copy.airportToHotel}</option>
              <option value="hotel_to_airport">{copy.hotelToAirport}</option>
              <option value="hotel_to_hotel">{copy.hotelToHotel}</option>
            </select>
          </Labelled>
          <Labelled icon={<Hotel />} label={copy.hotel} required>
            <input type="text" value={hotelName} onChange={(event) => setHotelName(event.target.value)} placeholder={copy.hotelPlaceholder} required={direction !== "hotel_to_hotel"} />
          </Labelled>
          {direction !== "hotel_to_hotel" ? (
            <Labelled icon={<Car />} label={copy.zone}>
              <select value={zoneOverride} onChange={(event) => setZoneOverride(event.target.value as TransferZoneKey | "")}>
                <option value="">{autoZone ? `${copy.zoneAuto}: ${ZONE_LABELS[autoZone]}` : copy.zoneManual}</option>
                {TRANSFER_ZONE_KEYS.map((key) => (
                  <option key={key} value={key}>{ZONE_LABELS[key]}</option>
                ))}
              </select>
            </Labelled>
          ) : null}
          <Labelled icon={<CalendarDays />} label={copy.date} required>
            <input type="date" value={date} min={minimumSlot.date} onChange={(event) => setDate(event.target.value)} required />
          </Labelled>
          <Labelled icon={<Clock3 />} label={copy.time} required>
            <input type="time" value={time} min={date === minimumSlot.date ? minimumSlot.time : undefined} onChange={(event) => { setTime(event.target.value); if (event.target.value) trackEvent("date_selected", { booking_type: "transfer" }); }} required />
            <p className="mt-2 text-xs leading-5 text-amber-700">{copy.leadTime}</p>
          </Labelled>
          <Labelled icon={<Plane />} label={copy.flight}>
            <input type="text" value={flightNumber} onChange={(event) => setFlightNumber(event.target.value)} placeholder="U2 1234" />
          </Labelled>
          {tripType === "round_trip" ? (
            <>
              <Labelled icon={<CalendarDays />} label={copy.returnDate} required>
                <input type="date" value={returnDate} min={date || minimumSlot.date} onChange={(event) => setReturnDate(event.target.value)} required />
              </Labelled>
              <Labelled icon={<Clock3 />} label={copy.returnTime} required>
                <input type="time" value={returnTime} onChange={(event) => setReturnTime(event.target.value)} required />
                <p className="mt-2 text-xs leading-5 text-muted">{copy.returnHint}</p>
              </Labelled>
              <Labelled icon={<Plane />} label={copy.returnFlight}>
                <input type="text" value={returnFlightNumber} onChange={(event) => setReturnFlightNumber(event.target.value)} placeholder="U2 1235" />
              </Labelled>
            </>
          ) : null}
        </div>
      </fieldset>

      {/* Step 2 — Passengers & luggage */}
      <fieldset className="mt-8">
        <legend className="text-sm font-bold uppercase tracking-wide text-ocean-dark">2 · {copy.paxLuggage}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stepper label={copy.adults} value={adults} min={1} onChange={(value) => { setAdults(value); trackEvent("transfer_passengers_changed", { booking_type: "transfer", traveler_count: value + children + infants }); }} />
          <Stepper label={copy.children} value={children} min={0} onChange={(value) => { setChildren(value); trackEvent("transfer_passengers_changed", { booking_type: "transfer", traveler_count: adults + value + infants }); }} />
          <Stepper label={copy.infants} value={infants} min={0} onChange={(value) => { setInfants(value); trackEvent("transfer_passengers_changed", { booking_type: "transfer", traveler_count: adults + children + value }); }} />
        </div>
        <p className="mt-2 text-xs text-muted">{copy.paxNote}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stepper label={copy.largeBags} value={largeBags} min={0} icon={<Luggage size={16} />} onChange={setLargeBags} />
          <Stepper label={copy.cabinBags} value={cabinBags} min={0} icon={<Luggage size={16} />} onChange={setCabinBags} />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={oversizedOpen} onChange={(event) => setOversizedOpen(event.target.checked)} />
          {copy.oversizedToggle}
        </label>
        {oversizedOpen ? (
          <div className="mt-3 rounded-2xl border border-line p-4">
            <p className="text-xs text-muted">{copy.oversizedNote}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {OVERSIZED_TYPES.map((type) => (
                <div key={type} className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2">
                  <span className="text-sm text-ink">{copy.oversizedLabels[type]}</span>
                  <MiniStepper value={oversized[type] ?? 0} onChange={(delta) => bumpOversized(type, delta)} label={copy.oversizedLabels[type]} />
                </div>
              ))}
            </div>
            {(oversized.other ?? 0) > 0 ? (
              <label className="mt-3 block text-sm font-medium text-ink">
                {copy.otherLabel}
                <input type="text" value={otherNote} onChange={(event) => setOtherNote(event.target.value)} className="mt-1 w-full rounded-xl border border-line p-2 outline-none focus:border-ocean" />
              </label>
            ) : null}
          </div>
        ) : null}

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={seatsOpen} onChange={(event) => setSeatsOpen(event.target.checked)} />
          {copy.seatsToggle}
        </label>
        {seatsOpen ? (
          <div className="mt-3 rounded-2xl border border-line p-4">
            <p className="text-xs text-muted">{copy.seatsNote}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Stepper label={copy.infantSeat} value={infantSeat} min={0} onChange={setInfantSeat} />
              <Stepper label={copy.childSeat} value={childSeat} min={0} onChange={setChildSeat} />
              <Stepper label={copy.boosterSeat} value={boosterSeat} min={0} onChange={setBoosterSeat} />
            </div>
          </div>
        ) : null}

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-ink">{copy.wheelchair}</legend>
          <div className="mt-2 space-y-2">
            {(["none", "folding_manual", "powered_or_fixed"] as const).map((value) => (
              <label key={value} className="flex items-start gap-2 text-sm text-ink">
                <input type="radio" name="wheelchair" value={value} checked={wheelchair === value} onChange={() => setWheelchair(value)} className="mt-1" />
                <span>{value === "none" ? copy.wcNone : value === "folding_manual" ? copy.wcFolding : copy.wcPowered}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      {/* Step 3 — Vehicle & price */}
      <section aria-live="polite" className="mt-8 rounded-2xl border border-ocean-soft bg-ocean-tint p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-ocean-dark">3 · {copy.vehiclePrice}</p>
        {quote.requiresManualConfirmation ? (
          <div className="mt-3">
            <p className="text-lg font-bold text-ink">{copy.manualTitle}</p>
            {reasonKey ? <p className="mt-1 text-sm text-ink">{copy[reasonKey] as string}</p> : null}
            <p className="mt-2 text-sm leading-6 text-muted">{copy.manualBody}</p>
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {quote.allocatedVehicles.map((entry) => (
                  <p key={entry.vehicleClass} className="text-lg font-bold text-ink">
                    {entry.count}× {VEHICLE_LABELS[entry.vehicleClass] ?? entry.vehicleClass}
                  </p>
                ))}
                <p className="mt-1 text-sm text-muted">
                  {copy.yourGroup}: {totalPassengers} {copy.passengers} · {largeBags} {copy.suitcases}
                </p>
                <p className="mt-1 text-xs font-medium text-emerald-700">{copy.privateNotShared}</p>
              </div>
              <div className="text-end">
                <p className="text-sm text-muted">{copy.totalLabel}</p>
                <p className="text-3xl font-black text-ocean-dark">${quote.total.toFixed(2)}</p>
                <p className="text-xs text-muted">{copy.total}</p>
              </div>
            </div>
            {quote.vehicleCount > 1 ? <p className="mt-3 text-sm font-semibold text-ink">{copy.twoVehicles}</p> : null}
            {quote.warnings.length ? (
              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-ink">
                {quote.warnings.map((warning) => {
                  const key = `warn_${warning}` as keyof CopyShape;
                  return copy[key] ? <li key={warning}>• {copy[key] as string}</li> : null;
                })}
              </ul>
            ) : null}
          </div>
        )}
      </section>

      {/* Step 4 — Customer details */}
      <fieldset className="mt-8">
        <legend className="text-sm font-bold uppercase tracking-wide text-ocean-dark">4 · {copy.contact}</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Labelled icon={<Users />} label={copy.name} required>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
          </Labelled>
          <Labelled icon={<MessageCircle />} label={copy.phone} required>
            <PhoneNumberInput defaultCountry="EG" value={phone} onChange={setPhone} language={language} required ariaLabel={copy.phone} />
            <p className="mt-2 text-xs leading-5 text-muted">{copy.phoneHint}</p>
          </Labelled>
          <Labelled icon={<MessageCircle />} label={copy.email} required>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required />
          </Labelled>
        </div>
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="transfer-notes">{copy.notes}</label>
        <textarea id="transfer-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-line bg-white p-3 text-ink outline-none placeholder:text-muted focus:border-ocean" />
      </fieldset>

      {/* Step 5 — Review & submit */}
      <p className="mt-6 rounded-xl border border-line bg-surface-muted p-3 text-xs leading-5 text-muted">
        {copy.cancellationBefore}{" "}
        <Link href={localePath(language, "/terms-conditions#cancellations")} target="_blank" className="font-bold text-ocean-dark underline">{copy.cancellation}</Link>. {copy.agree}
      </p>
      <button type="submit" disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
        <MessageCircle size={20} />
        {submitting ? copy.submitting : quote.requiresManualConfirmation ? copy.submit : `${copy.submit} · $${quote.total.toFixed(2)}`}
      </button>
    </form>
  );
}

function Labelled({ icon, label, children, required = false }: { icon: ReactNode; label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-ink">
      <span className="mb-2 flex items-center gap-2 text-ink">
        <span className="text-ocean">{icon}</span>
        {label}
        {required ? <span aria-hidden="true" className="text-rose-600">*</span> : null}
      </span>
      <div className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-line [&>input]:p-3 [&>input]:outline-none [&>input]:focus:border-ocean [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-line [&>select]:bg-white [&>select]:p-3 [&>select]:outline-none [&>select]:focus:border-ocean">
        {children}
      </div>
    </label>
  );
}

function Stepper({ label, value, min, onChange, icon }: { label: string; value: number; min: number; onChange: (value: number) => void; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <span className="flex items-center gap-1.5 text-sm font-medium text-ink">{icon}{label}</span>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" aria-label={`${label} −`} onClick={() => onChange(Math.max(min, value - 1))} className="h-9 w-9 rounded-lg border border-line text-lg font-bold text-ink hover:bg-surface-muted">−</button>
        <span aria-live="polite" className="min-w-8 text-center text-lg font-bold text-ink">{value}</span>
        <button type="button" aria-label={`${label} +`} onClick={() => onChange(value + 1)} className="h-9 w-9 rounded-lg border border-line text-lg font-bold text-ink hover:bg-surface-muted">+</button>
      </div>
    </div>
  );
}

function MiniStepper({ value, onChange, label }: { value: number; onChange: (delta: number) => void; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <button type="button" aria-label={`${label} −`} onClick={() => onChange(-1)} className="h-7 w-7 rounded-md border border-line font-bold text-ink hover:bg-white">−</button>
      <span aria-live="polite" className="min-w-6 text-center text-sm font-bold text-ink">{value}</span>
      <button type="button" aria-label={`${label} +`} onClick={() => onChange(1)} className="h-7 w-7 rounded-md border border-line font-bold text-ink hover:bg-white">+</button>
    </span>
  );
}
