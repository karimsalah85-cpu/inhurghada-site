"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { CalendarDays, Car, Clock3, Hotel, MapPin, MessageCircle, Phone, Plane, User, Users } from "lucide-react";

const areas = ["Hurghada Airport", "Hurghada Hotels", "Makadi Bay", "Sahl Hasheesh", "El Gouna", "Soma Bay", "Other location"];

export default function TransferBookingForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickup, setPickup] = useState("Hurghada Airport");
  const [pickupDetails, setPickupDetails] = useState("");
  const [dropoff, setDropoff] = useState("Hurghada Hotels");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [flight, setFlight] = useState("");
  const [notes, setNotes] = useState("");

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pickup === dropoff) {
      alert("Please choose different pickup and drop-off locations.");
      return;
    }

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "transfer",
        customerName: name.trim(),
        phone: phone.trim(),
        customerEmail: email.trim(),
        date,
        hotel: `${pickup}: ${pickupDetails.trim()} → ${dropoff}`,
        message: `${notes.trim() || "None"}\n\nPassengers: ${passengers}\nFlight: ${flight.trim() || "Not provided"}\nPickup time: ${time}`,
        amount: 0,
        currency: "usd",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.error || "Transfer request failed. Please try again.");
      return;
    }

    if (!data.whatsappSent) {
      window.location.href = data.whatsappUrl;
      return;
    }

    if (!data.emailSent) {
      alert(`Transfer request received. Your reference is ${data.reference}. We sent it on WhatsApp; email notification is not configured yet. Payment is cash on arrival.`);
      return;
    }

    alert(`Transfer request received. Your reference is ${data.reference}. Payment is cash on arrival. We will confirm shortly.`);
  }

  return (
    <form onSubmit={submitTransfer} className="rounded-3xl bg-white p-6 shadow-2xl md:p-8">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700"><Car /></div>
        <div><h2 className="text-2xl font-bold text-slate-900">Book a private transfer</h2><p className="mt-1 text-sm text-slate-600">We’ll confirm availability and the final price on WhatsApp.</p></div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Field icon={<MapPin />} label="Pickup location"><select value={pickup} onChange={(event) => setPickup(event.target.value)} required>{areas.map((area) => <option key={area}>{area}</option>)}</select></Field>
        <Field icon={<Hotel />} label="Pickup hotel / full address"><input type="text" value={pickupDetails} onChange={(event) => setPickupDetails(event.target.value)} placeholder="Required pickup details" required /></Field>
        <Field icon={<Hotel />} label="Drop-off location"><select value={dropoff} onChange={(event) => setDropoff(event.target.value)} required>{areas.map((area) => <option key={area}>{area}</option>)}</select></Field>
        <Field icon={<CalendarDays />} label="Transfer date"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} min={new Date().toISOString().split("T")[0]} required /></Field>
        <Field icon={<Clock3 />} label="Pickup time"><input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></Field>
        <Field icon={<Users />} label="Passengers"><input type="number" min="1" step="1" value={passengers} onChange={(event) => setPassengers(event.target.value)} required /></Field>
        <Field icon={<Plane />} label="Flight number (optional)"><input type="text" value={flight} onChange={(event) => setFlight(event.target.value)} placeholder="e.g. MS 045" /></Field>
        <Field icon={<User />} label="Your name"><input type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></Field>
        <Field icon={<Phone />} label="WhatsApp number"><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required /></Field>
        <Field icon={<MessageCircle />} label="Email address"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></Field>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="transfer-notes">Notes (optional)</label>
      <textarea id="transfer-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500" placeholder="Add luggage, child seat, or any special request." />
      <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700"><MessageCircle size={20} />Send transfer request</button>
    </form>
  );
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700"><span className="mb-2 flex items-center gap-2 text-slate-700"><span className="text-blue-600">{icon}</span>{label}</span><div className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-200 [&>input]:p-3 [&>input]:outline-none [&>input]:focus:border-blue-500 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-200 [&>select]:bg-white [&>select]:p-3 [&>select]:outline-none [&>select]:focus:border-blue-500">{children}</div></label>;
}
