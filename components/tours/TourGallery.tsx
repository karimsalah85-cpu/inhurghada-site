"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import ImageWatermark from "@/components/media/ImageWatermark";
import type { Locale } from "@/lib/i18n";

type TourGalleryProps = {
  title: string;
  mainImage: string;
  galleryImages: string[];
  imageAlt?: string;
  galleryImageAlts?: string[];
  imageFocalPoint?: { x: number; y: number };
  galleryImageFocalPoints?: { x: number; y: number }[];
  locale: Locale;
};

export default function TourGallery({ title, mainImage, galleryImages, imageAlt, galleryImageAlts = [], imageFocalPoint, galleryImageFocalPoints = [], locale }: TourGalleryProps) {
  const images = [mainImage, ...galleryImages];
  const imageCount = images.length;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const de = locale === "de";
  const ru = locale === "ru";
  const ar = locale === "ar";
  const closeLabel = de ? "Galerie schließen" : ru ? "Закрыть галерею" : ar ? "إغلاق المعرض" : "Close gallery";
  const previousLabel = de ? "Vorheriges Bild" : ru ? "Предыдущее изображение" : ar ? "الصورة السابقة" : "Previous image";
  const nextLabel = de ? "Nächstes Bild" : ru ? "Следующее изображение" : ar ? "الصورة التالية" : "Next image";
  const openLabel = de ? "Bild vergrößern" : ru ? "Увеличить изображение" : ar ? "تكبير الصورة" : "Enlarge image";

  const selectPrevious = useCallback(() => setSelectedIndex((current) => current === null ? null : (current - 1 + imageCount) % imageCount), [imageCount]);
  const selectNext = useCallback(() => setSelectedIndex((current) => current === null ? null : (current + 1) % imageCount), [imageCount]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowLeft") selectPrevious();
      if (event.key === "ArrowRight") selectNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectNext, selectPrevious, selectedIndex]);

  const galleryButton = (image: string, index: number, primary = false) => (
    <button
      key={`${image}-${index}`}
      type="button"
      onClick={() => setSelectedIndex(index)}
      aria-label={`${openLabel}: ${title} ${index + 1}`}
      className={`group relative overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400 ${primary ? "aspect-[4/3] sm:aspect-auto sm:min-h-64" : "aspect-[4/3] sm:aspect-auto"}`}
    >
      <Image src={image} alt={primary ? imageAlt || title : galleryImageAlts[index - 1] || `${title} — gallery image ${index + 1}`} fill sizes={primary ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 50vw, 25vw"} className="object-cover transition duration-300 group-hover:scale-105" style={{ objectPosition: `${((primary ? imageFocalPoint : galleryImageFocalPoints[index - 1])?.x ?? 0.5) * 100}% ${((primary ? imageFocalPoint : galleryImageFocalPoints[index - 1])?.y ?? 0.5) * 100}%` }} priority={primary} />
      <ImageWatermark prominent={primary} />
      <span className="absolute right-3 top-3 rounded-full bg-slate-950/70 p-2 text-white shadow-lg backdrop-blur-sm">
        <Expand size={18} aria-hidden="true" />
      </span>
    </button>
  );

  return (
    <>
      <div className={`mt-8 grid gap-3 overflow-hidden rounded-[2rem] ${galleryImages.length ? "sm:h-[420px] sm:grid-cols-2" : "sm:h-[420px]"}`}>
        {galleryButton(mainImage, 0, true)}
        {galleryImages.length ? <div className="grid grid-cols-2 gap-3">
          {galleryImages.map((image, index) => galleryButton(image, index + 1))}
        </div> : null}
      </div>

      {selectedIndex !== null ? (
        <div role="dialog" aria-modal="true" aria-label={`${title} gallery`} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-3 sm:p-8" onClick={() => setSelectedIndex(null)}>
          <button type="button" onClick={() => setSelectedIndex(null)} aria-label={closeLabel} className="absolute right-4 top-4 z-20 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition hover:bg-white/25">
            <X size={28} />
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); selectPrevious(); }} aria-label={previousLabel} className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition hover:bg-white/25 sm:left-6">
            <ChevronLeft size={30} />
          </button>
          <div className="relative h-[82vh] w-[86vw] max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image src={images[selectedIndex]} alt={selectedIndex === 0 ? imageAlt || title : galleryImageAlts[selectedIndex - 1] || `${title} — gallery image ${selectedIndex + 1}`} fill sizes="100vw" className="object-contain" priority />
          </div>
          <button type="button" onClick={(event) => { event.stopPropagation(); selectNext(); }} aria-label={nextLabel} className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition hover:bg-white/25 sm:right-6">
            <ChevronRight size={30} />
          </button>
          <p className="absolute bottom-4 rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white">{selectedIndex + 1} / {imageCount}</p>
        </div>
      ) : null}
    </>
  );
}
