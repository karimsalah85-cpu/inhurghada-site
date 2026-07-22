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
  return value.toISOString().slice(0, 10);
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
        <button type="button" aria-label={`Add ${label}`} onClick={() => onChange(value + 1)} className="p-2.5 text-blue-700 hover:bg-blue-50"><CirclePlus size={18} /></button>
      </div>
    </div>
  );
}

export default function BookingForm({ tourName, price, duration, location, participantPricing, availableTimes }: BookingFormProps) {
  const searchParams = useSearchParams();
  const { formatPrice } = useSiteSettings();
  const adultPrice = participantPricing?.adults ?? Number(price || 0);
  const youthPrice = participantPricing?.youth;
  const infantPrice = participantPricing?.infants;
  const times = availableTimes?.length ? availableTimes : ["08:00"];
  const [step, setStep] = useState<"select" | "checkout" | "success">("select");
  const [adults, setAdults] = useState(Number(searchParams.get("guests") || 1));
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

  const total = useMemo(() => adults * adultPrice + youth * (youthPrice ?? adultPrice) + infants * (infantPrice ?? 0), [adults, youth, infants, adultPrice, youthPrice, infantPrice]);
  const travelerText = `${adults} adult${adults === 1 ? "" : "s"}${youthPrice !== undefined ? ` · ${youth} youth` : ""}${infantPrice !== undefined ? ` · ${infants} infant${infants === 1 ? "" : "s"}` : ""}`;

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
          amount: total, currency: "usd",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Booking submission failed.");
      setReference(data.reference);
      setCustomerEmailSent(Boolean(data.customerEmailSent));
      setBookingConfirmationPdf(String(data.bookingConfirmationPdf || ""));
      setStep("success");
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
      <p className="mt-5 text-sm font-bold uppercase tracking-wider text-emerald-700">Booking received</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Thank you, {name.split(" ")[0]}.</h2>
      <p className="mt-3 leading-6 text-slate-600">Your reservation is confirmed as a cash-on-arrival request. {customerEmailSent ? "Your booking summary and PDF confirmation have been sent to your email." : "We will confirm the details on WhatsApp."}</p>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm"><p className="text-slate-500">Booking reference</p><p className="mt-1 font-mono font-bold text-slate-950">{reference}</p><p className="mt-3 text-slate-600">{date} at {time} · {travelerText}</p><p className="font-bold text-blue-700">{formatPrice(String(total))} cash on arrival</p></div>
      {bookingConfirmationPdf ? <button type="button" onClick={downloadConfirmation} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white hover:bg-blue-700"><Download size={18} /> Download booking confirmation PDF</button> : null}
    </div>
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">From <span className="text-2xl font-black text-slate-950">{formatPrice(String(adultPrice))}</span> / person</p><p className="mt-1 flex items-center gap-1 text-sm text-amber-600">★ {"5.0"} <span className="text-slate-500">(verified local service)</span></p></div><ShieldCheck className="text-emerald-600" /></div>
      {step === "select" ? <>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-slate-700">Date<div className="relative mt-1"><CalendarDays className="absolute left-3 top-3 text-slate-400" size={18}/><input type="date" min={tomorrow()} value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-200 px-10 py-3 font-medium outline-none focus:border-blue-500" /></div></label>
          <label className="block text-sm font-bold text-slate-700">Time<div className="relative mt-1"><Clock3 className="absolute left-3 top-3 text-slate-400" size={18}/><select value={time} onChange={(event) => setTime(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 px-10 py-3 font-medium outline-none focus:border-blue-500">{times.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="absolute right-3 top-3 text-slate-400" size={18}/></div></label>
        </div>
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 px-4"><p className="pt-4 text-sm font-bold text-slate-900">Select your package</p><Counter label="Adults" description={`${formatPrice(String(adultPrice))} each`} value={adults} onChange={setAdults}/>{youthPrice !== undefined && <Counter label="Youth (4–10)" description={`${formatPrice(String(youthPrice))} each`} value={youth} onChange={setYouth}/>} {infantPrice !== undefined && <Counter label="Infants" description="Free of charge" value={infants} onChange={setInfants}/>}</div>
        <div className="mt-5 flex items-end justify-between border-t pt-5"><div><p className="font-bold text-slate-900">Total</p><p className="text-xs text-slate-500">Cash on arrival · no online payment</p></div><p className="text-3xl font-black text-blue-700">{formatPrice(String(total))}</p></div>
        <button type="button" onClick={() => adults ? setStep("checkout") : setError("Please select at least one adult.")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700">Book now <Users size={18}/></button>
        {error && <p className="mt-3 text-center text-sm text-rose-600">{error}</p>}
      </> : <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-slate-900">{tourName}</p><p className="mt-1 text-sm text-slate-600">{date} at {time} · {travelerText}</p><p className="mt-2 font-black text-blue-700">{formatPrice(String(total))} · Cash on arrival</p></div>
        <p className="border-b pb-2 text-lg font-black text-slate-950">Tell us about yourself</p>
        <label className="block text-sm font-bold">Full name<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="Enter your full name" /></label>
        <label className="block text-sm font-bold">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="you@example.com" /></label>
        <label className="block text-sm font-bold">WhatsApp number<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="+20 100 493 3150" /></label>
        <label className="block text-sm font-bold">Pickup location<div className="relative mt-1"><Hotel className="absolute left-3 top-3 text-slate-400" size={18}/><input required value={hotel} onChange={(event) => setHotel(event.target.value)} className="w-full rounded-xl border py-3 pl-10 pr-3 font-normal" placeholder="Hotel name or full pickup address" /></div><span className="mt-1 block text-xs font-normal text-slate-500">Required so we can confirm your pickup on WhatsApp.</span></label>
        <label className="block text-sm font-bold">Preferred guide language<select value={guideLanguage} onChange={(event) => setGuideLanguage(event.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal"><option>English</option><option>Arabic</option><option>German</option></select></label>
        <label className="block text-sm font-bold">Special requests <span className="font-normal text-slate-500">(optional)</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 h-20 w-full rounded-xl border p-3 font-normal" placeholder="Anything we should know?" /></label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white disabled:opacity-60">{submitting ? "Sending booking…" : `Confirm booking · ${formatPrice(String(total))}`} <MessageCircle size={18}/></button>
        <button type="button" onClick={() => setStep("select")} className="w-full text-sm font-semibold text-slate-600 hover:text-blue-700">← Change date or travelers</button>
        <p className="text-center text-xs leading-5 text-slate-500">Your booking is reserved now. You pay cash when you arrive; we confirm pickup via WhatsApp.</p>
      </form>}
    </div>
  );
}
