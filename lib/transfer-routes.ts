import { isHurghadaAirport } from "@/lib/transfer-airport";
import { mapHotelToZone, mapPlaceToRmfRoute, type TransferDirection } from "@/lib/transfer-config";

export type TransferAirport = "HRG" | "RMF";
export const TRANSFER_AIRPORTS: Record<TransferAirport, string> = {
  HRG: "Hurghada Airport (HRG)",
  RMF: "Marsa Alam Airport (RMF)",
};

// Only recognised airport names qualify for an automatic airport fare. An
// arbitrary address (including an unrecognised airport) always needs a quote.
export function transferAirport(place: string): TransferAirport | null {
  if (isHurghadaAirport(place)) return "HRG";
  const normalized = place.normalize("NFKC").toLowerCase().replace(/[().,-]/g, " ").replace(/\s+/g, " ").trim();
  if (["h r g", "hrg", "hurghada airport", "hurghada international airport", "hurghada airport hrg", "مطار الغردقة", "مطار الغردقة الدولي"].includes(normalized)) return "HRG";
  if (["rmf", "marsa alam airport", "marsa alam international airport", "marsa alam airport rmf", "مطار مرسى علم", "مطار مرسى علم الدولي"].includes(normalized)) return "RMF";
  return null;
}

export function resolveTransferRoute(pickup: string, dropoff: string) {
  const pickupAirport = transferAirport(pickup);
  const dropoffAirport = transferAirport(dropoff);
  const airport = pickupAirport && dropoffAirport ? null : pickupAirport || dropoffAirport;
  const direction: TransferDirection = airport
    ? pickupAirport ? "airport_to_hotel" : "hotel_to_airport"
    : "hotel_to_hotel";
  const hotelName = airport ? pickupAirport ? dropoff.trim() : pickup.trim() : "";
  return {
    airport,
    direction,
    hotelName,
    // Zone fares apply to Hurghada Airport; Marsa Alam Airport has its own short list.
    zone: airport === "HRG" ? mapHotelToZone(hotelName) : null,
    rmfRoute: airport === "RMF" ? mapPlaceToRmfRoute(hotelName) : null,
    hasAirport: Boolean(pickupAirport || dropoffAirport),
  };
}
