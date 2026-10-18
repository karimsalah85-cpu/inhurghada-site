import { eurToUsd } from "@/data/speedboat-booking";

export type ExcursionTransferTrip = "one_way" | "round_trip";

/**
 * Per-sedan ONE-WAY retail fares in EUR (owner price list, 2026-10-18).
 * A round trip is two legs, so it costs twice the one-way fare.
 * Areas listed in excursionTransferAreas without a fare here stay quote-on-request.
 */
export const ONE_WAY_SEDAN_EUR: Record<string, number> = {
  "Hurghada Hotels": 10,
  "El Ahyaa": 15,
  "Sahl Hasheesh": 15,
  "Makadi Bay": 20,
  "El Gouna": 20,
  "Soma Bay": 25,
};
/** @deprecated kept for older imports; equals 2 × the El Gouna / Makadi one-way fare. */
export const ROUND_TRIP_SEDAN_EUR = 40;
export const SEDAN_PASSENGERS = 3;

export function normalizeTransferTrip(value: unknown): ExcursionTransferTrip {
  return value === "one_way" ? "one_way" : "round_trip";
}

export function excursionTransferQuote(area: string | undefined, passengers: number, currency = "USD", trip: ExcursionTransferTrip = "round_trip") {
  const oneWay = ONE_WAY_SEDAN_EUR[area || ""];
  if (oneWay === undefined || !Number.isInteger(passengers) || passengers < 1) return null;
  const legs = trip === "one_way" ? 1 : 2;
  const cars = Math.ceil(passengers / SEDAN_PASSENGERS);
  const fareEur = oneWay * legs;
  const unitPrice = currency === "EUR" ? fareEur : eurToUsd(fareEur);
  return { cars, unitPrice, legs, trip, amount: Math.round(cars * unitPrice * 100) / 100 };
}
export const excursionTransferAreas = ["El Ahyaa", "Sahl Hasheesh", "Makadi Bay", "El Gouna", "Soma Bay", "Safaga"] as const;
export const marinaTransferAreas = ["Hurghada Hotels", ...excursionTransferAreas] as const;

export function transferTripLabel(trip: ExcursionTransferTrip) {
  return trip === "one_way" ? "One-way" : "Round-trip";
}

export function offersExcursionTransfer(tour: { destinationSlug?: string; fulfillmentType?: string; requiresMarinaTransferChoice?: boolean }) {
  return tour.requiresMarinaTransferChoice === true ||
    ((tour.destinationSlug ?? "hurghada") === "hurghada" && tour.fulfillmentType !== "meeting_point");
}

export function tourTransferNote(input: { transferRequired?: boolean; transferArea?: string; transferTrip?: ExcursionTransferTrip }, passengers: number, currency: string) {
  if (!input.transferRequired) return "";
  const trip = normalizeTransferTrip(input.transferTrip);
  const quote = excursionTransferQuote(input.transferArea, passengers, currency, trip);
  if (quote) {
    const route = trip === "one_way" ? `${input.transferArea} → trip (one way)` : `${input.transferArea} ↔ Hurghada`;
    const times = trip === "one_way" ? "Pickup time confirmed by WhatsApp." : "Pickup and return times confirmed by WhatsApp.";
    return `${transferTripLabel(trip)} sedan transfer: ${route}; ${quote.cars} car(s), up to ${SEDAN_PASSENGERS} passengers per car; ${currency} ${quote.amount.toFixed(2)} included in booking total. ${times}`;
  }
  return `Trip transfer requested: ${input.transferArea} (${transferTripLabel(trip).toLowerCase()}). Extra fee not included in trip total; quote and availability to be confirmed by WhatsApp before acceptance.`;
}

type TransferCopy = {
  title: string; notice: string; selected: string; priced: string; pricedOneWay: string;
  tripLegend: string; oneWay: string; roundTrip: string; perCarOneWay: string; perCarRoundTrip: string;
};

export function transferCopy(language: string) {
  const copy: Record<string, TransferCopy> = {
    en: { priced: "Round-trip sedan · up to 3 passengers per car · included in total. Pickup and return times confirmed by WhatsApp.", pricedOneWay: "One-way sedan · up to 3 passengers per car · included in total. Pickup time confirmed by WhatsApp.", title: "Need a transfer from outside Hurghada?", notice: "Extra transfer fee is not included in the trip total. We confirm the price and availability by WhatsApp before you accept.", selected: "Transfer requested", tripLegend: "Transfer type", oneWay: "One way", roundTrip: "Round trip", perCarOneWay: "car one way", perCarRoundTrip: "car round trip" },
    ar: { priced: "سيارة سيدان ذهاباً وإياباً · حتى ٣ ركاب لكل سيارة · مشمول في الإجمالي. نؤكد موعدي الذهاب والعودة عبر واتساب.", pricedOneWay: "سيارة سيدان اتجاه واحد · حتى ٣ ركاب لكل سيارة · مشمول في الإجمالي. نؤكد موعد الاستلام عبر واتساب.", title: "هل تحتاج إلى انتقال من خارج الغردقة؟", notice: "رسوم الانتقال الإضافية غير مشمولة في إجمالي الرحلة. سنؤكد السعر والتوفر عبر واتساب قبل موافقتك.", selected: "تم طلب الانتقال", tripLegend: "نوع الانتقال", oneWay: "اتجاه واحد", roundTrip: "ذهاب وعودة", perCarOneWay: "سيارة اتجاه واحد", perCarRoundTrip: "سيارة ذهاباً وإياباً" },
    de: { priced: "Hin- und Rücktransfer im Sedan · bis zu 3 Personen pro Auto · im Gesamtpreis enthalten. Zeiten werden per WhatsApp bestätigt.", pricedOneWay: "Einfacher Transfer im Sedan · bis zu 3 Personen pro Auto · im Gesamtpreis enthalten. Abholzeit wird per WhatsApp bestätigt.", title: "Transfer von außerhalb Hurghadas gewünscht?", notice: "Die zusätzliche Transfergebühr ist nicht im Reisepreis enthalten. Preis und Verfügbarkeit bestätigen wir vor deiner Zustimmung per WhatsApp.", selected: "Transfer angefragt", tripLegend: "Transferart", oneWay: "Einfache Fahrt", roundTrip: "Hin und zurück", perCarOneWay: "Auto einfach", perCarRoundTrip: "Auto hin und zurück" },
    ru: { priced: "Седан туда и обратно · до 3 пассажиров в машине · включено в итог. Время подачи и возврата подтвердим в WhatsApp.", pricedOneWay: "Седан в одну сторону · до 3 пассажиров в машине · включено в итог. Время подачи подтвердим в WhatsApp.", title: "Нужен трансфер из-за пределов Хургады?", notice: "Доплата за трансфер не включена в стоимость экскурсии. Цену и доступность подтвердим в WhatsApp до вашего согласия.", selected: "Трансфер запрошен", tripLegend: "Тип трансфера", oneWay: "В одну сторону", roundTrip: "Туда и обратно", perCarOneWay: "машина в одну сторону", perCarRoundTrip: "машина туда и обратно" },
    pl: { priced: "Sedan w obie strony · do 3 pasażerów na samochód · wliczony w cenę. Godziny potwierdzimy przez WhatsApp.", pricedOneWay: "Sedan w jedną stronę · do 3 pasażerów na samochód · wliczony w cenę. Godzinę odbioru potwierdzimy przez WhatsApp.", title: "Potrzebujesz transferu spoza Hurghady?", notice: "Dodatkowa opłata za transfer nie jest wliczona w cenę wycieczki. Cenę i dostępność potwierdzimy przez WhatsApp przed Twoją zgodą.", selected: "Zamówiono transfer", tripLegend: "Rodzaj transferu", oneWay: "W jedną stronę", roundTrip: "W obie strony", perCarOneWay: "samochód w jedną stronę", perCarRoundTrip: "samochód w obie strony" },
    zh: { priced: "轿车往返接送 · 每辆车最多3位乘客 · 已计入总价。接送时间通过 WhatsApp 确认。", pricedOneWay: "轿车单程接送 · 每辆车最多3位乘客 · 已计入总价。接车时间通过 WhatsApp 确认。", title: "需要从赫尔格达以外的地区接送吗？", notice: "额外接送费用不包含在行程总价中。我们将在您同意前通过 WhatsApp 确认价格和可用性。", selected: "已申请接送", tripLegend: "接送类型", oneWay: "单程", roundTrip: "往返", perCarOneWay: "每车单程", perCarRoundTrip: "每车往返" },
  };
  return copy[language] || copy.en;
}
