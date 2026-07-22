import { Fish, MapPin, ShieldCheck, Sun, Utensils } from "lucide-react";

const highlights = [
  { icon: Fish, title: "Red Sea days", text: "Hurghada’s coastline is known for clear water, sandy beaches and access to coral reefs. Snorkelling and diving experiences are best chosen for your confidence level and the day’s sea conditions." },
  { icon: MapPin, title: "Beyond the beach", text: "Giftun Islands are popular for boat days, while Hurghada Marina is a relaxed place for an evening walk. El Dahar offers a more traditional local atmosphere and everyday shopping." },
  { icon: Utensils, title: "Local culture", text: "Egyptian hospitality is warm and social. Try local dishes such as koshari, grilled seafood and fresh mezze, and dress respectfully when visiting neighbourhoods away from the beach." },
  { icon: Sun, title: "Plan comfortably", text: "Pack light layers, swimwear, a hat, sunglasses and reef-safe sun protection. Drink water regularly and check the pickup details the day before your activity." },
  { icon: ShieldCheck, title: "Respect the sea", text: "Do not touch coral or marine life, follow your crew’s safety briefing, and only dive within your training and experience. Conditions and itineraries can change with weather." },
];

export default function HurghadaTravelGuide() {
  return <section aria-labelledby="hurghada-guide-title" className="bg-white px-6 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="font-semibold uppercase tracking-[0.24em] text-cyan-700">Travel well in Egypt</p><h2 id="hurghada-guide-title" className="mt-3 text-4xl font-black text-slate-900">A practical guide to Hurghada and the Red Sea</h2><p className="mt-5 text-lg leading-8 text-slate-600">Hurghada is a convenient Red Sea base for beach time, boat trips and underwater activities. It can also be part of a wider Egypt itinerary, although heritage destinations such as Luxor and Cairo require their own transport planning and an early start or overnight stay.</p></div><div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{highlights.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><Icon aria-hidden="true" className="text-cyan-700" size={28}/><h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></div></section>;
}
