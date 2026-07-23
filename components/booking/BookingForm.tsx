"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleMinus,
  CirclePlus,
  Clock3,
  Download,
  Hotel,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";

type ParticipantPricing = { adults: number; youth?: number; infants?: number };

type BookingFormProps = {
  tourName: string;
  price?: string;
  duration?: string;
  location?: string;
  participantPricing?: ParticipantPricing;
  availableTimes?: string[];
};

const tomorrow = () => {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Counter({ label, description, value, onChange }: { label: string; description: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button type="button" aria-label={`Remove ${label}`} onClick={() => onChange(Math.max(0, value - 1))} className="p-2.5 text-slate-700 hover:bg-slate-100"><CircleMinus size={18} /></button>
        <span className="w-9 text-center font-bold text-slate-900">{value}</span>
        <button type="button" aria-label={`Add ${label}`} disabled={value >= 30} onClick={() => onChange(Math.min(30, value + 1))} className="p-2.5 text-blue-700 hover:bg-blue-50 disabled:opacity-40"><CirclePlus size={18} /></button>
      </div>
    </div>
  );
}

export default function BookingForm({ tourName, price, duration, location, participantPricing, availableTimes }: BookingFormProps) {
  const searchParams = useSearchParams();
  const { formatPrice, language } = useSiteSettings();
  const de = language === "de";
  const adultPrice = participantPricing?.adults ?? Number(price || 0);
  const youthPrice = participantPricing?.youth;
  const infantPrice = participantPricing?.infants;
  const times = availableTimes?.length ? availableTimes : ["Time confirmed by WhatsApp"];
  const [step, setStep] = useState<"select" | "checkout" | "success">("select");
  const [adults, setAdults] = useState(Math.min(30, Math.max(1, Number(searchParams.get("guests")) || 1)));
  const [youth, setYouth] = useState(0);
  const [infants, setInfants] = useState(0);
  const [date, setDate] = useState(searchParams.get("date") || tomorrow());
  const [time, setTime] = useState(times[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [guideLanguage, setGuideLanguage] = useState("English");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [customerEmailSent, setCustomerEmailSent] = useState(false);
  const [bookingConfirmationPdf, setBookingConfirmationPdf] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");

  const total = useMemo(() => adults * adultPrice + youth * (youthPrice ?? adultPrice) + infants * (infantPrice ?? 0), [adults, youth, infants, adultPrice, youthPrice, infantPrice]);
  const travelerText = de
    ? `${adults} Erwachsene${youthPrice !== undefined ? ` · ${youth} Kinder` : ""}${infantPrice !== undefined ? ` · ${infants} Kleinkinder` : ""}`
    : `${adults} adult${adults === 1 ? "" : "s"}${youthPrice !== undefined ? ` · ${youth} youth` : ""}${infantPrice !== undefined ? ` · ${infants} infant${infants === 1 ? "" : "s"}` : ""}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adults) { setError("Please select at least one adult."); return; }
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tour", customerName: name.trim(), phone: phone.trim(), customerEmail: email.trim(),
          tourName, location: location || "Hurghada", duration: duration || "Please confirm",
          price: `${formatPrice(String(total))} total`, date, guests: travelerText, hotel,
          message: `Time: ${time}\nGuide language: ${guideLanguage}${message ? `\nCustomer note: ${message}` : ""}`,
          adults, youth, infants,
          website,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Booking submission failed.");
      setReference(data.reference);
      setCustomerEmailSent(Boolean(data.customerEmailSent));
      setBookingConfirmationPdf(String(data.bookingConfirmationPdf || ""));
      setStep("success");
      trackEvent("booking_complete", { transaction_id: data.reference, value: total, currency: "USD", item_name: tourName, booking_type: "tour" });
      if (!data.whatsappSent && data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Booking submission failed.");
    } finally { setSubmitting(false); }
  }

  function downloadConfirmation() {
    if (!bookingConfirmationPdf) return;
    const bytes = Uint8Array.from(atob(bookingConfirmationPdf), (character) => character.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-red-sea-booking-${reference}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (step === "success") return (
    <div className="rounded-3xl border border-emerald-200 bg-white p-7 shadow-xl">
      <CheckCircle2 className="text-emerald-600" size={42} />
      <p className="mt-5 text-sm font-bold uppercase tracking-wider text-emerald-700">{de ? "Buchung erhalten" : "Booking received"}</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{de ? "Vielen Dank" : "Thank you"}, {name.split(" ")[0]}.</h2>
      <p className="mt-3 leading-6 text-slate-600">{de ? "Deine Reservierung mit Barzahlung bei Ankunft wurde erfasst. " : "Your reservation is confirmed as a cash-on-arrival request. "}{customerEmailSent ? (de ? "Die Buchungsübersicht und PDF-Bestätigung wurden per E-Mail versendet." : "Your booking summary and PDF confirmation have been sent to your email.") : (de ? "Wir bestätigen die Details per WhatsApp." : "We will confirm the details on WhatsApp.")}</p>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm"><p className="text-slate-500">{de ? "Buchungsnummer" : "Booking reference"}</p><p className="mt-1 font-mono font-bold text-slate-950">{reference}</p><p className="mt-3 text-slate-600">{date} {de ? "um" : "at"} {time} · {travelerText}</p><p className="font-bold text-blue-700">{formatPrice(String(total))} {de ? "Barzahlung bei Ankunft" : "cash on arrival"}</p></div>
      {bookingConfirmationPdf ? <button type="button" onClick={downloadConfirmation} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white hover:bg-blue-700"><Download size={18} /> {de ? "PDF-Buchungsbestätigung herunterladen" : "Download booking confirmation PDF"}</button> : null}
    </div>
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{de ? "Ab" : "From"} <span className="text-2xl font-black text-slate-950">{formatPrice(String(adultPrice))}</span> / {de ? "Person" : "person"}</p><p className="mt-1 text-sm font-medium text-emerald-700">{de ? "Klarer lokaler Preis · Abholung nach Buchung bestätigt" : "Clear local price · pickup confirmed after booking"}</p></div><ShieldCheck className="text-emerald-600" /></div>
      {step === "select" ? <>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-slate-700">{de ? "Datum" : "Date"}<div className="relative mt-1"><CalendarDays className="absolute left-3 top-3 text-slate-400" size={18}/><input type="date" min={tomorrow()} value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-200 px-10 py-3 font-medium outline-none focus:border-blue-500" /></div></label>
          <label className="block text-sm font-bold text-slate-700">{de ? "Uhrzeit" : "Time"}<div className="relative mt-1"><Clock3 className="absolute left-3 top-3 text-slate-400" size={18}/><select value={time} onChange={(event) => setTime(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 px-10 py-3 font-medium outline-none focus:border-blue-500">{times.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400" size={18}/></div></label>
        </div>
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 px-4"><p className="pt-4 text-sm font-bold text-slate-900">{de ? "Paket auswählen" : "Select your package"}</p><Counter label={de ? "Erwachsene" : "Adults"} description={`${formatPrice(String(adultPrice))} ${de ? "pro Person" : "each"}`} value={adults} onChange={setAdults}/>{youthPrice !== undefined && <Counter label={de ? "Kinder (4–10)" : "Youth (4–10)"} description={`${formatPrice(String(youthPrice))} ${de ? "pro Kind" : "each"}`} value={youth} onChange={setYouth}/>} {infantPrice !== undefined && <Counter label={de ? "Kleinkinder" : "Infants"} description={de ? "Kostenlos" : "Free of charge"} value={infants} onChange={setInfants}/>}</div>
        <div className="mt-5 flex items-end justify-between border-t pt-5"><div><p className="font-bold text-slate-900">{de ? "Gesamtpreis" : "Total"}</p><p className="text-xs text-slate-500">{de ? "Barzahlung bei Ankunft · keine Online-Zahlung" : "Cash on arrival · no online payment"}</p></div><p className="text-3xl font-black text-blue-700">{formatPrice(String(total))}</p></div>
        <button type="button" onClick={() => { if (!adults) return setError(de ? "Bitte wähle mindestens einen Erwachsenen." : "Please select at least one adult."); trackEvent("booking_start", { value: total, currency: "USD", item_name: tourName, booking_type: "tour" }); setStep("checkout"); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700">{de ? "Jetzt buchen" : "Book now"} <Users size={18}/></button>
        {error && <p role="alert" className="mt-3 text-center text-sm text-rose-600">{error}</p>}
      </> : <form onSubmit={submit} aria-busy={submitting} className="mt-6 space-y-4">
        <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-slate-900">{tourName}</p><p className="mt-1 text-sm text-slate-600">{date} {de ? "um" : "at"} {time} · {travelerText}</p><p className="mt-2 font-black text-blue-700">{formatPrice(String(total))} · {de ? "Barzahlung bei Ankunft" : "Cash on arrival"}</p></div>
        <p className="border-b pb-2 text-lg font-black text-slate-950">{de ? "Deine Angaben" : "Tell us about yourself"}</p>
        <label className="block text-sm font-bold">{de ? "Vollständiger Name" : "Full name"}<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder={de ? "Vollständigen Namen eingeben" : "Enter your full name"} /></label>
        <label className="block text-sm font-bold">{de ? "E-Mail-Adresse" : "Email address"}<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="you@example.com" /></label>
        <label className="block text-sm font-bold">{de ? "WhatsApp-Nummer" : "WhatsApp number"}<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="+20 100 493 3150" /></label>
        <label className="block text-sm font-bold">{de ? "Abholort" : "Pickup location"}<div className="relative mt-1"><Hotel className="absolute left-3 top-3 text-slate-400" size={18}/><input required value={hotel} onChange={(event) => setHotel(event.target.value)} className="w-full rounded-xl border py-3 pl-10 pr-3 font-normal" placeholder={de ? "Hotelname oder vollständige Abholadresse" : "Hotel name or full pickup address"} /></div><span className="mt-1 block text-xs font-normal text-slate-500">{de ? "Erforderlich, damit wir deine Abholung per WhatsApp bestätigen können." : "Required so we can confirm your pickup on WhatsApp."}</span></label>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-bold">{de ? "Ausweis oder Reisepass vor dem Ausflug erforderlich" : "ID or passport required before the trip"}</p><p className="mt-1">{de ? "Für die Reisegenehmigung ist ein gültiger Ausweis oder Reisepass erforderlich. Bitte halte ihn vor dem Ausflug bereit." : "A valid ID or passport is mandatory for trip permit reasons. Please make sure you have it available before your experience."}</p></div>
        <label className="block text-sm font-bold">{de ? "Bevorzugte Sprache des Reiseführers" : "Preferred guide language"}<select value={guideLanguage} onChange={(event) => setGuideLanguage(event.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"><option>English</option><option>Arabic</option><option>German</option><option>Russian</option><option>Polish</option><option>Chinese</option></select></label>
        <label className="block text-sm font-bold">{de ? "Besondere Wünsche" : "Special requests"} <span className="font-normal text-slate-500">({de ? "optional" : "optional"})</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 h-20 w-full rounded-xl border p-3 font-normal" placeholder={de ? "Gibt es etwas, das wir wissen sollten?" : "Anything we should know?"} /></label>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white disabled:opacity-60">{submitting ? (de ? "Buchung wird gesendet…" : "Sending booking…") : `${de ? "Buchung bestätigen" : "Confirm booking"} · ${formatPrice(String(total))}`} <MessageCircle size={18}/></button>
        <button type="button" onClick={() => setStep("select")} className="w-full text-sm font-semibold text-slate-600 hover:text-blue-700">← {de ? "Datum oder Reisende ändern" : "Change date or travelers"}</button>
        <p className="text-center text-xs leading-5 text-slate-500">{de ? "Deine Buchung ist reserviert. Du bezahlst bei Ankunft bar; wir bestätigen die Abholung per WhatsApp." : "Your booking is reserved now. You pay cash when you arrive; we confirm pickup via WhatsApp."}</p>
      </form>}
    </div>
  );
}
