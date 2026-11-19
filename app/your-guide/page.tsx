import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { destinations } from "@/lib/destinations";
import { liveFreeGuides } from "@/lib/free-guides";

export const metadata: Metadata = {
  title: "Your Destination | Free Local Guides | DailyRedSea",
  description: "Free local guides to DailyRedSea destinations: useful travel tips, places to explore and simple day plans. No registration required.",
};

export default function YourGuideHub() {
  return (
    <main className="min-h-screen bg-surface-muted px-5 pb-20 pt-32 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-teal-700">DailyRedSea · Free local guides</p>
        <h1 className="mt-2 text-4xl font-bold text-ink sm:text-5xl">Your destination, made easier.</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink/75">
          Know your area, explore public spaces and find practical travel tips. No sign-up, payment or app required.
        </p>
        <div className="mt-9 grid gap-5 sm:grid-cols-2">
          {liveFreeGuides.map((guide) => {
            const destination = destinations.find((item) => item.slug === guide.slug);
            if (!destination) return null;
            return (
              <Link key={guide.slug} href={`/your-guide/${guide.slug}`}
                className="group overflow-hidden rounded-3xl border border-line bg-white shadow-sm hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                <div className="relative h-48">
                  <Image src={destination.image} alt={destination.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-teal-700">{destination.country}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-ink">{destination.name}</h2>
                  <p className="mt-2 text-sm text-ink/70">Local essentials · Free-to-explore places · Day ideas →</p>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-8 text-sm text-ink/60">Public-space access and local conditions can change; transport, facilities and purchases may cost extra.</p>
      </div>
    </main>
  );
}
