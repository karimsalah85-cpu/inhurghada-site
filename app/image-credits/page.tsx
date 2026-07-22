import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Image Credits",
  description: "Photographer credits and open-content licenses for destination images used by Daily Red Sea.",
  path: "/image-credits",
});

const credits = [
  { use: "Orange Bay", work: "Hurghada Giftun Island Orange Bay", creator: "Mahmoudxx1", source: "https://commons.wikimedia.org/wiki/File:Hurghada_gifton_island_Orange_bay.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  { use: "Mahmya Island", work: "Mahmya Island", creator: "Silar", source: "https://commons.wikimedia.org/wiki/File:02010_05712_Mahmya_Island.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  { use: "Full-day snorkeling", work: "Hurghada snorkelling – Egypt", creator: "Fanny S Forsdik", source: "https://commons.wikimedia.org/wiki/File:Hurghada_snorkelling_-_Egypt_-_panoramio.jpg", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/" },
  { use: "Full-day diving", work: "Scuba diving, Hurghada", creator: "Jerome Bon", source: "https://commons.wikimedia.org/wiki/File:Scuba_diving,_Hurghada_(2429616663).jpg", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/" },
  { use: "Underwater photographer", work: "Diver with camera at Gota Kebir, Red Sea", creator: "Derek Keats", source: "https://commons.wikimedia.org/wiki/File:Diver_with_camera_at_Gota_Kebir,_St_John%27s_reefs,_Red_Sea,_Egypt_-SCUBA_(6326262728).jpg", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/" },
  { use: "Desert safari and morning quad safari", work: "Desert Safari in Hurghada", creator: "Mostafa Abdel Samie", source: "https://commons.wikimedia.org/wiki/File:Desert_Safari_in_hurghada.jpg", license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/" },
  { use: "Sunset quad safari", work: "Dessert Safari", creator: "Norhan Elmaghrabi", source: "https://commons.wikimedia.org/wiki/File:Dessert_Safari.jpg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
  { use: "Hurghada Airport transfer", work: "Hurghada Airport", creator: "Binter~commonswiki (attribution assumed by Commons)", source: "https://commons.wikimedia.org/wiki/File:Hurghada-Airport.jpg", license: "Public domain", licenseUrl: "https://commons.wikimedia.org/wiki/Commons:Public_domain" },
  { use: "Senzo Mall transfer", work: "Senzo Mall by night – Hurghada", creator: "Almondox", source: "https://commons.wikimedia.org/wiki/File:Senzo_Mall_(by_night)_-_Hurghada_-_panoramio.jpg", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/" },
];

export default function ImageCreditsPage() {
  return <main className="mx-auto max-w-5xl px-6 py-24 lg:px-8"><div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">Open-content photography</p><h1 className="mt-4 text-4xl font-black text-slate-900">Image credits</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Daily Red Sea uses destination photographs made available through Wikimedia Commons. Website copies have only been resized, cropped by the page layout, and compressed for web delivery. Creative Commons adaptations remain available under their listed license.</p><div className="mt-10 divide-y divide-slate-200">{credits.map((credit) => <article key={credit.use} className="grid gap-2 py-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center"><div><h2 className="font-bold text-slate-900">{credit.use}</h2><p className="mt-1 text-sm text-slate-500">{credit.work}</p></div><p className="text-sm text-slate-700">Photo by {credit.creator}</p><div className="flex gap-3 text-sm font-bold"><a href={credit.source} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline">Source</a><a href={credit.licenseUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{credit.license}</a></div></article>)}</div><Link href="/" className="mt-10 inline-flex text-sm font-semibold text-cyan-700">← Back to home</Link></div></main>;
}
