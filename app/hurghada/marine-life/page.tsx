import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, pageMetadata, siteName } from "@/lib/seo";

const path = "/hurghada/marine-life";

export const metadata: Metadata = pageMetadata({
  title: "Red Sea Marine Life Guide — What You’ll See in Hurghada",
  description: "See the dolphins, turtles, reef fish and coral you may encounter snorkeling and diving in Hurghada’s Red Sea, plus tours that visit the reefs.",
  path,
});

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Diving & snorkeling", item: absoluteUrl("/hurghada/diving-snorkeling") },
        { "@type": "ListItem", position: 3, name: "Red Sea marine life guide", item: absoluteUrl(path) },
      ],
    },
    {
      "@type": "Article",
      headline: "Red Sea Marine Life Guide — What You’ll See in Hurghada",
      description: "A practical guide to dolphins, turtles, coral, reef fish, rays and moray eels around Hurghada.",
      url: absoluteUrl(path),
      inLanguage: "en",
      author: { "@type": "Organization", name: siteName },
      publisher: { "@type": "Organization", name: siteName },
    },
  ],
};

const sectionClass = "mt-10 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm";
const linkClass = "font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700";

export default function MarineLifeGuidePage() {
  return (
    <main className="bg-slate-50 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <article className="mx-auto max-w-4xl px-6 py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link href="/">Home</Link>
          <span className="px-2">/</span>
          <Link href="/hurghada/diving-snorkeling">Diving &amp; snorkeling</Link>
          <span className="px-2">/</span>
          <span>Marine life</span>
        </nav>

        <p className="mt-8 font-bold uppercase tracking-[0.28em] text-cyan-700">Below the surface · Hurghada</p>
        <h1 className="mt-4 text-4xl font-black text-slate-950 sm:text-6xl">Red Sea Marine Life Guide</h1>
        <p className="mt-6 text-xl leading-9 text-slate-700">
          The Red Sea off Hurghada is one of the world’s most biodiverse dive and snorkel destinations, home to more than 1,200 fish species and around 200 types of coral. Here is what to look for and which Daily Red Sea tours give you a chance to explore these habitats.
        </p>

        {/* TODO(content): Add 2–3 verified, licensed photos of wild spinner dolphins in the Red Sea near Hurghada. */}
        <section className={sectionClass}>
          <h2 className="text-3xl font-black text-slate-950">Dolphins</h2>
          <p className="mt-4 leading-8 text-slate-700">Wild spinner dolphins are regularly spotted around Dolphin House reef areas, where pods may rest in sheltered water during the day. Keep a respectful distance and never chase or touch them; sightings and in-water encounters are never guaranteed.</p>
          <p className="mt-5"><strong>Best tour:</strong> <Link className={linkClass} href="/tours/dolphin-house-snorkeling">Dolphin House Snorkeling Boat Trip</Link></p>
        </section>

        {/* TODO(content): Add 2–3 verified, licensed photos of green or hawksbill turtles photographed in the Egyptian Red Sea. */}
        <section className={sectionClass}>
          <h2 className="text-3xl font-black text-slate-950">Sea turtles</h2>
          <p className="mt-4 leading-8 text-slate-700">Green and hawksbill turtles graze on seagrass beds and coral reefs around the Hurghada region. They surface to breathe, but guests should stay calm, avoid blocking their path and give them plenty of room.</p>
          <p className="mt-5"><strong>Best tours:</strong> <Link className={linkClass} href="/tours/orange-bay">Orange Bay</Link>, <Link className={linkClass} href="/tours/paradise-island">Paradise Island</Link>, and <Link className={linkClass} href="/tours/full-day-diving">Full Day Diving Trip</Link>.</p>
        </section>

        {/* TODO(content): Add 2–3 verified, licensed photos of healthy hard and soft coral around Hurghada or Giftun Island. */}
        <section className={sectionClass}>
          <h2 className="text-3xl font-black text-slate-950">Coral reefs</h2>
          <p className="mt-4 leading-8 text-slate-700">Hurghada’s fringing and offshore reefs contain hard corals such as staghorn and brain coral, alongside soft corals and sea fans in deeper channels. The exact reef stop always depends on the day’s wind, visibility and sea conditions.</p>
          <p className="mt-5"><strong>Best tours:</strong> <Link className={linkClass} href="/tours/orange-bay">Orange Bay</Link>, <Link className={linkClass} href="/tours/full-day-snorkeling">Full Day Snorkeling Trip</Link>, and <Link className={linkClass} href="/tours/mahmya-island">Mahmya Island</Link>.</p>
        </section>

        {/* TODO(content): Add 2–3 verified, licensed photos of anthias, parrotfish, clownfish or Napoleon wrasse in the Red Sea. */}
        <section className={sectionClass}>
          <h2 className="text-3xl font-black text-slate-950">Reef fish</h2>
          <p className="mt-4 leading-8 text-slate-700">Look for clouds of anthias, parrotfish grazing on coral, clownfish sheltering in anemones and, occasionally, a Napoleon wrasse. Reef fish are present at most snorkeling and diving sites, although wildlife sightings vary on every trip.</p>
          <p className="mt-5"><strong>Best tours:</strong> Browse the <Link className={linkClass} href="/hurghada/diving-snorkeling">diving and snorkeling collection</Link>.</p>
        </section>

        {/* TODO(content): Add 2–3 verified, licensed photos of blue-spotted stingrays or eagle rays in the Egyptian Red Sea. */}
        <section className={sectionClass}>
          <h2 className="text-3xl font-black text-slate-950">Rays</h2>
          <p className="mt-4 leading-8 text-slate-700">Blue-spotted stingrays can rest on sandy patches beside reefs, while eagle rays are occasionally seen crossing open water on deeper dives. Give every ray space and never try to touch or corner it.</p>
          <p className="mt-5"><strong>Best tour:</strong> <Link className={linkClass} href="/tours/full-day-diving">Full Day Scuba Diving Trip</Link>.</p>
        </section>

        {/* TODO(content): Add 2–3 verified, licensed photos of moray eels in Red Sea reef crevices. */}
        <section className={sectionClass}>
          <h2 className="text-3xl font-black text-slate-950">Moray eels</h2>
          <p className="mt-4 leading-8 text-slate-700">Moray eels shelter in reef crevices, often with only their head visible. Their open-mouth movement pumps water across their gills and is not necessarily a threat display. Divers generally have a better chance of spotting them than surface snorkelers.</p>
          <p className="mt-5"><strong>Best tour:</strong> <Link className={linkClass} href="/tours/full-day-diving">Full Day Scuba Diving Trip</Link>.</p>
        </section>

        <section className="mt-10 rounded-3xl border border-cyan-200 bg-cyan-50 p-7">
          <h2 className="text-3xl font-black text-slate-950">Respect the reef</h2>
          <ul className="mt-5 list-disc space-y-3 pl-6 leading-7 text-slate-700">
            <li>Never touch or stand on coral; damaged coral can take decades to recover.</li>
            <li>Use reef-conscious sun protection and follow the boat crew’s local guidance.</li>
            <li>Keep at least a fin’s length from marine life.</li>
            <li>Do not feed fish, turtles or dolphins.</li>
          </ul>
        </section>

        <section className="mt-12 rounded-3xl bg-slate-950 p-8 text-white">
          <h2 className="text-3xl font-black">Ready to see it yourself?</h2>
          <p className="mt-4 max-w-2xl leading-8 text-slate-300">Compare reef trips, island cruises, beginner experiences and certified diving days before choosing the right Red Sea tour.</p>
          <Link href="/#tours" className="mt-6 inline-flex rounded-full bg-cyan-500 px-6 py-3 font-bold text-slate-950">Browse all boat trips and diving tours →</Link>
        </section>
      </article>
    </main>
  );
}
