"use client";

import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { CalendarDays, Car, Clock3, Hotel, MapPin, MessageCircle, Phone, Plane, User, Users } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";

const areas = ["Hurghada Airport", "Hurghada Hotels", "Senzo Mall", "Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay"];
const resortZones = new Set(["Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay"]);
type TransferService = "airport" | "senzo";

export default function TransferBookingForm({ initialService = "airport" }: { initialService?: TransferService }) {
  const { language } = useSiteSettings();
  const de = language === "de";
  const [service, setService] = useState<TransferService>(initialService);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickup, setPickup] = useState(initialService === "airport" ? "Hurghada Airport" : "Hurghada Hotels");
  const [pickupDetails, setPickupDetails] = useState("");
  const [dropoff, setDropoff] = useState(initialService === "airport" ? "Hurghada Hotels" : "Senzo Mall");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [travelBags, setTravelBags] = useState(initialService === "airport" ? "1" : "0");
  const [flight, setFlight] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [website, setWebsite] = useState("");
  const passengerCount = Math.max(1, Number.parseInt(passengers, 10) || 1);
  const bagCount = Math.max(0, Number.parseInt(travelBags, 10) || 0);
  const baseFare = service === "airport" ? 20 : 10;
  const resortSupplement = resortZones.has(pickup) || resortZones.has(dropoff) ? 7 : 0;
  const total = baseFare + resortSupplement;
  const vehicle = service === "airport" ? (passengerCount <= 2 ? (de ? "Kleinwagen" : "Small car") : (de ? "Größeres Fahrzeug" : "Larger vehicle")) : (de ? "Privatwagen" : "Private car");
  const serviceAreas = service === "airport" ? areas.filter((area) => area !== "Senzo Mall") : areas.filter((area) => area !== "Hurghada Airport");
  const routeIsValid = useMemo(() => {
    if (pickup === dropoff) return false;
    return service === "airport"
      ? pickup === "Hurghada Airport" || dropoff === "Hurghada Airport"
      : pickup === "Senzo Mall" || dropoff === "Senzo Mall";
  }, [dropoff, pickup, service]);

  function changeService(nextService: TransferService) {
    setService(nextService);
    if (nextService === "airport") {
      setPickup("Hurghada Airport");
      setDropoff("Hurghada Hotels");
      setTravelBags("1");
    } else {
      setPickup("Hurghada Hotels");
      setDropoff("Senzo Mall");
      setPassengers((value) => String(Math.min(Number(value) || 1, 4)));
      setTravelBags("0");
    }
  }

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!routeIsValid) {
      alert(service === "airport" ? (de ? "Flughafentransfers müssen am Flughafen Hurghada beginnen oder enden." : "Airport transfers must start or finish at Hurghada Airport.") : (de ? "Senzo-Transfers müssen an der Senzo Mall beginnen oder enden." : "Senzo transfers must start or finish at Senzo Mall."));
      return;
    }
    if (service === "senzo" && passengerCount > 4) {
      alert(de ? "Senzo-Mall-Transfers sind für maximal 4 Fahrgäste möglich." : "Senzo Mall transfers allow a maximum of 4 passengers.");
      return;
    }
    if (service === "senzo" && bagCount > 0) {
      alert(de ? "Bei Senzo-Mall-Transfers sind keine Reisekoffer erlaubt." : "Senzo Mall transfers do not allow travel bags.");
      return;
    }
    if (service === "airport" && passengerCount <= 2 && bagCount > 2) {
      alert(de ? "Im Kleinwagen sind maximal 2 Reisekoffer erlaubt. Reduziere die Anzahl oder buche für mindestens 3 Fahrgäste ein größeres Fahrzeug." : "The small car allows a maximum of 2 travel bags. Reduce the bags or add a third passenger to request a larger vehicle.");
      return;
    }
    if (service === "airport" && passengerCount > 2 && bagCount > passengerCount * 2) {
      alert(de ? "Im größeren Fahrzeug sind maximal 2 Reisekoffer pro Fahrgast erlaubt." : "The larger vehicle allows a maximum of 2 travel bags per passenger.");
      return;
    }

    const serviceName = service === "airport" ? "Hurghada Airport one-way transfer" : "Senzo Mall one-way transfer";
    trackEvent("booking_start", { booking_type: "transfer", item_name: serviceName, value: total, currency: "USD" });

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          locale: de ? "de" : "en",
          customerName: name.trim(),
          phone: phone.trim(),
          customerEmail: email.trim(),
          tourName: serviceName,
          location: `${pickup} to ${dropoff}`,
          duration: "One way",
          price: `$${total.toFixed(2)} fixed one-way fare`,
          guests: passengers,
          date,
          hotel: `${pickup}: ${pickupDetails.trim()} → ${dropoff}`,
          message: `Service: ${serviceName}\nFare: $${total.toFixed(2)} (${resortSupplement ? `$${baseFare} base + $7 resort supplement` : `$${baseFare} base`})\nVehicle: ${vehicle}\nTravel bags: ${bagCount}\nNotes: ${notes.trim() || "None"}\nPassengers: ${passengers}\nFlight: ${flight.trim() || "Not provided"}\nTime: ${time}`,
          service,
          pickup,
          dropoff,
          passengers: passengerCount,
          travelBags: bagCount,
          website,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.error || "Transfer request failed. Please try again.");
        return;
      }

      trackEvent("booking_complete", { transaction_id: data.reference, booking_type: "transfer", item_name: serviceName, value: total, currency: "USD" });

      if (!data.whatsappSent) {
        window.location.href = data.whatsappUrl;
        return;
      }

      if (!data.emailSent) {
        alert(`Transfer request received. Your reference is ${data.reference}. We sent it on WhatsApp; email notification is not configured yet. Payment is cash on arrival.`);
        return;
      }

      alert(`Transfer request received. Your reference is ${data.reference}. Payment is cash on arrival. We will confirm shortly.`);
    } catch {
      alert("We could not reach the booking service. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitTransfer} aria-busy={submitting} className="rounded-3xl bg-white p-6 shadow-2xl md:p-8">
      <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700"><Car /></div>
        <div><h2 className="text-2xl font-bold text-slate-900">{de ? "Privaten Transfer buchen" : "Book a private transfer"}</h2><p className="mt-1 text-sm text-slate-600">{de ? "Wähle den Service und sieh sofort den festen Preis für eine einfache Fahrt." : "Choose your service and see the fixed one-way fare instantly."}</p></div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => changeService("airport")} className={`rounded-2xl border p-4 text-left transition ${service === "airport" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}><span className="block font-bold text-slate-900">{de ? "Flughafentransfer" : "Airport transfer"}</span><span className="mt-1 block text-sm text-slate-600">$20 {de ? "einfache Fahrt innerhalb Hurghadas" : "one way within Hurghada"}</span></button>
        <button type="button" onClick={() => changeService("senzo")} className={`rounded-2xl border p-4 text-left transition ${service === "senzo" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}><span className="block font-bold text-slate-900">{de ? "Senzo-Mall-Transfer" : "Senzo Mall transfer"}</span><span className="mt-1 block text-sm text-slate-600">$10 {de ? "einfache Fahrt innerhalb Hurghadas" : "one way within Hurghada"}</span></button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Field icon={<MapPin />} label={de ? "Abholort" : "Pickup location"}><select value={pickup} onChange={(event) => setPickup(event.target.value)} required>{serviceAreas.map((area) => <option key={area}>{area}</option>)}</select></Field>
        <Field icon={<Hotel />} label={de ? "Abholhotel / vollständige Adresse" : "Pickup hotel / full address"}><input type="text" value={pickupDetails} onChange={(event) => setPickupDetails(event.target.value)} placeholder={de ? "Erforderliche Abholdetails" : "Required pickup details"} required /></Field>
        <Field icon={<Hotel />} label={de ? "Zielort" : "Drop-off location"}><select value={dropoff} onChange={(event) => setDropoff(event.target.value)} required>{serviceAreas.map((area) => <option key={area}>{area}</option>)}</select></Field>
        <Field icon={<CalendarDays />} label={de ? "Transferdatum" : "Transfer date"}><input type="date" value={date} onChange={(event) => setDate(event.target.value)} min={new Date().toISOString().split("T")[0]} required /></Field>
        <Field icon={<Clock3 />} label={de ? "Abholzeit" : "Pickup time"}><input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></Field>
        <Field icon={<Users />} label={`${de ? "Fahrgäste" : "Passengers"}${service === "senzo" ? (de ? " (maximal 4)" : " (maximum 4)") : ""}`}><input type="number" min="1" max={service === "senzo" ? 4 : undefined} step="1" value={passengers} onChange={(event) => setPassengers(event.target.value)} required /></Field>
        <Field icon={<Car />} label={de ? "Reisekoffer" : "Travel bags"}><input type="number" min="0" max={service === "senzo" ? 0 : passengerCount <= 2 ? 2 : passengerCount * 2} step="1" value={travelBags} onChange={(event) => setTravelBags(event.target.value)} disabled={service === "senzo"} required /></Field>
        <Field icon={<Plane />} label={de ? "Flugnummer (optional)" : "Flight number (optional)"}><input type="text" value={flight} onChange={(event) => setFlight(event.target.value)} placeholder="z. B. MS 045" /></Field>
        <Field icon={<User />} label={de ? "Dein Name" : "Your name"}><input type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></Field>
        <Field icon={<Phone />} label={de ? "WhatsApp-Nummer" : "WhatsApp number"}><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required /></Field>
        <Field icon={<MessageCircle />} label={de ? "E-Mail-Adresse" : "Email address"}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></Field>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start justify-between gap-5"><div><p className="font-bold text-slate-950">{service === "airport" ? (de ? "Flughafen – einfache Fahrt" : "Airport one-way fare") : (de ? "Senzo Mall – einfache Fahrt" : "Senzo Mall one-way fare")}</p><p className="mt-1 text-sm leading-6 text-slate-600">{resortSupplement ? (de ? `Enthält den Zuschlag von $7 für ${resortZones.has(pickup) ? pickup : dropoff}.` : `Includes the $7 supplement for ${resortZones.has(pickup) ? pickup : dropoff}.`) : (de ? "Hurghada-Basiszone – kein Zuschlag." : "Hurghada base zone—no supplement.")}</p></div><p className="text-3xl font-black text-blue-700">${total.toFixed(2)}</p></div>
        <div className="mt-4 border-t border-blue-200 pt-4 text-sm text-slate-700"><p><strong>{de ? "Fahrzeug:" : "Vehicle:"}</strong> {vehicle}</p>{service === "airport" ? <p className="mt-1">{de ? "1–2 Fahrgäste: Kleinwagen, maximal 2 Koffer. Mehr als 2 Fahrgäste: größeres Fahrzeug, maximal 2 Koffer pro Person." : "1–2 passengers: small car, maximum 2 bags. More than 2 passengers: larger vehicle, maximum 2 bags per person."}</p> : <p className="mt-1">{de ? "Maximal 4 Fahrgäste. Reisekoffer sind nicht erlaubt." : "Maximum 4 passengers. Travel bags are not accepted."}</p>}</div>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="transfer-notes">{de ? "Hinweise (optional)" : "Notes (optional)"}</label>
      <textarea id="transfer-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500" placeholder={de ? "Kindersitz oder besondere Wünsche hinzufügen." : "Add luggage, child seat, or any special request."} />
      <button type="submit" disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"><MessageCircle size={20} />{submitting ? (de ? "Transferanfrage wird gesendet…" : "Sending transfer request…") : `${de ? "Einfache Fahrt buchen" : "Book one way"} · $${total.toFixed(2)}`}</button>
    </form>
  );
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700"><span className="mb-2 flex items-center gap-2 text-slate-700"><span className="text-blue-600">{icon}</span>{label}</span><div className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-200 [&>input]:p-3 [&>input]:outline-none [&>input]:focus:border-blue-500 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-200 [&>select]:bg-white [&>select]:p-3 [&>select]:outline-none [&>select]:focus:border-blue-500">{children}</div></label>;
}
