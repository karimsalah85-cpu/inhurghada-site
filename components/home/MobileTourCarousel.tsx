"use client";

import { Children, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MobileTourCarousel({ children, label }: { children: ReactNode; label: string }) {
  const items = Children.toArray(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function updateActiveCard() {
    const track = trackRef.current;
    if (!track) return;
    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const [index, element] of Array.from(track.children).entries()) {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - trackCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    }
    setActiveIndex(closestIndex);
  }

  function goTo(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), items.length - 1);
    trackRef.current?.children[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActiveIndex(nextIndex);
  }

  return (
    <div aria-label={label} aria-roledescription="carousel">
      <div ref={trackRef} onScroll={updateActiveCard} className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
        {items.map((item, index) => <div key={index} className="min-w-[calc(100%-1.5rem)] snap-center md:min-w-0">{item}</div>)}
      </div>
      {items.length > 1 ? <div className="mt-3 flex items-center justify-center gap-4 md:hidden">
        <button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous tour" className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm disabled:opacity-35"><ChevronLeft size={20} /></button>
        <div className="flex gap-2" aria-label={`Tour ${activeIndex + 1} of ${items.length}`}>
          {items.map((_, index) => <button key={index} type="button" onClick={() => goTo(index)} aria-label={`Go to tour ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} className={`size-2.5 rounded-full transition ${index === activeIndex ? "bg-ocean-dark" : "bg-line"}`} />)}
        </div>
        <button type="button" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === items.length - 1} aria-label="Next tour" className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm disabled:opacity-35"><ChevronRight size={20} /></button>
      </div> : null}
    </div>
  );
}
