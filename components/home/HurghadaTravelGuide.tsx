"use client";

import { Fish, MapPin, ShieldCheck, Sun, Utensils } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";

const copy = {
  en: {
    eyebrow: "Plan your Red Sea experience",
    title: "Things to do in Hurghada, Marsa Alam and Jeddah",
    intro: "Hurghada and Marsa Alam offer distinct Red Sea experiences, from island boat trips, snorkeling and diving to desert adventures and practical private transfers. Choose the destination that matches your hotel and travel plans.",
    detail: "Explore Hurghada for islands, desert safaris, transfers and historical day trips, or choose Marsa Alam for its own southern reef excursions. Compare destination, duration, inclusions, pickup details and transparent prices before booking.",
    items: [
      ["Red Sea days", "Hurghada’s coastline is known for clear water, sandy beaches and coral reefs. Choose snorkeling and diving experiences for your confidence level and the day’s sea conditions."],
      ["Beyond the beach", "Giftun Islands are popular for boat days, Hurghada Marina for an evening walk, and El Dahar for a more traditional local atmosphere."],
      ["Local culture", "Egyptian hospitality is warm and social. Try koshari, grilled seafood and fresh mezze, and dress respectfully away from the beach."],
      ["Plan comfortably", "Pack light layers, swimwear, a hat, sunglasses and reef-safe sun protection. Check pickup details the day before your activity."],
      ["Respect the sea", "Do not touch coral or marine life, follow the crew’s safety briefing, and only dive within your training and experience."],
    ],
  },
  de: {
    eyebrow: "Plane dein Erlebnis am Roten Meer",
    title: "Aktivitäten in Hurghada und Marsa Alam",
    intro: "Hurghada und Marsa Alam bieten unterschiedliche Erlebnisse am Roten Meer – von Bootstouren, Schnorcheln und Tauchen bis zu Wüstenabenteuern und Privattransfers. Wähle das Reiseziel passend zu deinem Hotel und deinen Plänen.",
    detail: "Entdecke in Hurghada Inseln, Wüstensafaris, Transfers und historische Tagesausflüge oder wähle Marsa Alam für eigene Ausflüge zu den südlichen Riffen. Vergleiche Reiseziel, Dauer, Leistungen, Abholdetails und transparente Preise.",
    items: [
      ["Tage am Roten Meer", "Hurghadas Küste ist für klares Wasser, Sandstrände und Korallenriffe bekannt. Wähle Schnorchel- und Taucherlebnisse passend zu deiner Erfahrung und den Meeresbedingungen."],
      ["Mehr als Strand", "Die Giftun-Inseln sind beliebt für Bootstage, die Hurghada Marina für Abendspaziergänge und El Dahar für eine traditionellere Atmosphäre."],
      ["Lokale Kultur", "Ägyptische Gastfreundschaft ist herzlich. Probiere Koshari, gegrillte Meeresfrüchte und frische Mezze und kleide dich abseits des Strandes respektvoll."],
      ["Bequem planen", "Packe leichte Kleidung, Badesachen, Hut, Sonnenbrille und riffsicheren Sonnenschutz ein. Prüfe die Abholdetails am Vortag."],
      ["Das Meer schützen", "Berühre keine Korallen oder Meerestiere, befolge die Sicherheitseinweisung und tauche nur im Rahmen deiner Ausbildung und Erfahrung."],
    ],
  },
  ru: {
    eyebrow: "Спланируйте отдых на Красном море",
    title: "Чем заняться в Хургаде и Марса-Аламе",
    intro: "Хургада и Марса-Алам предлагают разные впечатления на Красном море: морские прогулки, сноркелинг, дайвинг, пустынные приключения и частные трансферы. Выберите направление рядом с вашим отелем и подходящее вашим планам.",
    detail: "В Хургаде доступны острова, сафари, трансферы и исторические поездки, а в Марса-Аламе — отдельные экскурсии к южным рифам. Перед бронированием сравните направление, продолжительность, услуги, трансфер и цены.",
    items: [
      ["Дни на Красном море", "Побережье Хургады известно чистой водой, песчаными пляжами и коралловыми рифами. Выбирайте сноркелинг и дайвинг с учётом опыта и состояния моря."],
      ["Не только пляж", "Острова Гифтун подходят для морских прогулок, набережная Хургады — для вечерних прогулок, а Эль-Дахар — для знакомства с местной атмосферой."],
      ["Местная культура", "Египетское гостеприимство тёплое и искреннее. Попробуйте кошари, морепродукты на гриле и мезе; за пределами пляжа одевайтесь уважительно."],
      ["Комфортное планирование", "Возьмите лёгкую одежду, купальные принадлежности, головной убор, очки и безопасный для рифов крем. Проверьте трансфер накануне."],
      ["Берегите море", "Не трогайте кораллы и морских животных, соблюдайте инструктаж команды и погружайтесь только в пределах своей подготовки."],
    ],
  },
};

const icons = [Fish, MapPin, Utensils, Sun, ShieldCheck];

export default function HurghadaTravelGuide() {
  const { language } = useSiteSettings();
  const content = language === "de" ? copy.de : language === "ru" ? copy.ru : copy.en;
  return <section aria-labelledby="hurghada-guide-title" className="bg-white px-6 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="font-semibold uppercase tracking-[0.24em] text-cyan-700">{content.eyebrow}</p><h2 id="hurghada-guide-title" className="mt-3 text-4xl font-black text-slate-900">{content.title}</h2><p className="mt-5 text-lg leading-8 text-slate-600">{content.intro}</p><p className="mt-4 leading-8 text-slate-600">{content.detail}</p></div><div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{content.items.map(([title, text], index) => { const Icon = icons[index]; return <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><Icon aria-hidden="true" className="text-cyan-700" size={28}/><h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>; })}</div></div></section>;
}
