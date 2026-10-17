import { eurToUsd } from "@/data/speedboat-booking";

/** Retail excursion fares, researched 2026-10-17. See output/trip-transfers/pricing-research.md. */
export const ROUND_TRIP_SEDAN_EUR = 40;
export const SEDAN_PASSENGERS = 3;

export function excursionTransferQuote(area: string | undefined, passengers: number, currency = "USD") {
  if (!["El Gouna", "Makadi Bay"].includes(area || "") || !Number.isInteger(passengers) || passengers < 1) return null;
  const cars = Math.ceil(passengers / SEDAN_PASSENGERS);
  const unitPrice = currency === "EUR" ? ROUND_TRIP_SEDAN_EUR : eurToUsd(ROUND_TRIP_SEDAN_EUR);
  return { cars, unitPrice, amount: Math.round(cars * unitPrice * 100) / 100 };
}
export const excursionTransferAreas = ["Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay", "Safaga"] as const;
export const marinaTransferAreas = ["Hurghada Hotels", ...excursionTransferAreas] as const;

export function offersExcursionTransfer(tour: { destinationSlug?: string; fulfillmentType?: string; requiresMarinaTransferChoice?: boolean }) {
  return tour.requiresMarinaTransferChoice === true ||
    ((tour.destinationSlug ?? "hurghada") === "hurghada" && tour.fulfillmentType !== "meeting_point");
}

export function tourTransferNote(input: { transferRequired?: boolean; transferArea?: string }, passengers: number, currency: string) {
  if (!input.transferRequired) return "";
  const quote = excursionTransferQuote(input.transferArea, passengers, currency);
  if (quote) return `Round-trip sedan transfer: ${input.transferArea} ↔ Hurghada; ${quote.cars} car(s), up to ${SEDAN_PASSENGERS} passengers per car; ${currency} ${quote.amount.toFixed(2)} included in booking total. Pickup and return times confirmed by WhatsApp.`;
  return input.transferRequired
    ? `Trip transfer requested: ${input.transferArea}. Extra fee not included in trip total; quote and availability to be confirmed by WhatsApp before acceptance.`
    : "";
}

export function transferCopy(language: string) {
  const copy: Record<string, { title: string; notice: string; selected: string; priced: string }> = {
    en: { priced: "Round-trip sedan · up to 3 passengers per car · included in total. Pickup and return times confirmed by WhatsApp.", title: "Need a transfer from outside Hurghada?", notice: "Extra transfer fee is not included in the trip total. We confirm the price and availability by WhatsApp before you accept.", selected: "Transfer requested" },
    ar: { priced: "سيارة سيدان ذهاباً وإياباً · حتى ٣ ركاب لكل سيارة · مشمول في الإجمالي. نؤكد موعدي الذهاب والعودة عبر واتساب.", title: "هل تحتاج إلى انتقال من خارج الغردقة؟", notice: "رسوم الانتقال الإضافية غير مشمولة في إجمالي الرحلة. سنؤكد السعر والتوفر عبر واتساب قبل موافقتك.", selected: "تم طلب الانتقال" },
    de: { priced: "Hin- und Rücktransfer im Sedan · bis zu 3 Personen pro Auto · im Gesamtpreis enthalten. Zeiten werden per WhatsApp bestätigt.", title: "Transfer von außerhalb Hurghadas gewünscht?", notice: "Die zusätzliche Transfergebühr ist nicht im Reisepreis enthalten. Preis und Verfügbarkeit bestätigen wir vor deiner Zustimmung per WhatsApp.", selected: "Transfer angefragt" },
    ru: { priced: "Седан туда и обратно · до 3 пассажиров в машине · включено в итог. Время подачи и возврата подтвердим в WhatsApp.", title: "Нужен трансфер из-за пределов Хургады?", notice: "Доплата за трансфер не включена в стоимость экскурсии. Цену и доступность подтвердим в WhatsApp до вашего согласия.", selected: "Трансфер запрошен" },
    pl: { priced: "Sedan w obie strony · do 3 pasażerów na samochód · wliczony w cenę. Godziny potwierdzimy przez WhatsApp.", title: "Potrzebujesz transferu spoza Hurghady?", notice: "Dodatkowa opłata za transfer nie jest wliczona w cenę wycieczki. Cenę i dostępność potwierdzimy przez WhatsApp przed Twoją zgodą.", selected: "Zamówiono transfer" },
    zh: { priced: "轿车往返接送 · 每辆车最多3位乘客 · 已计入总价。接送时间通过 WhatsApp 确认。", title: "需要从赫尔格达以外的地区接送吗？", notice: "额外接送费用不包含在行程总价中。我们将在您同意前通过 WhatsApp 确认价格和可用性。", selected: "已申请接送" },
  };
  return copy[language] || copy.en;
}
