"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Mail, Share2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { buildTripShareUrl, isSharedTripUrl, tripShareText, whatsappShareUrl } from "@/lib/share-trip";
import { trackEvent } from "@/lib/analytics";

const trackedSharedLinks = new Set<string>();

export default function ShareTripButton({ locale, tourSlug, date, compact = false }: { locale: Locale; tourSlug: string; date?: string; compact?: boolean }) {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ar = locale === "ar";
  const selectedDate = date || params.get("date") || undefined;
  const url = typeof window === "undefined" ? "" : buildTripShareUrl(window.location.origin, locale, tourSlug, selectedDate);
  const text = tripShareText(locale);
  useEffect(() => {
    const key = `${tourSlug}:${window.location.search}`;
    if (isSharedTripUrl(window.location.search) && !trackedSharedLinks.has(key)) {
      trackedSharedLinks.add(key);
      trackEvent("shared_link_opened", { item_id: tourSlug, destination: "jeddah" });
    }
  }, [tourSlug]);
  async function nativeShare() {
    trackEvent("share_opened", { item_id: tourSlug, destination: "jeddah" });
    if (navigator.share) {
      try { await navigator.share({ title: ar ? "رحلة غروب جدة" : "Jeddah sunset cruise", text, url }); trackEvent("share_native", { item_id: tourSlug }); trackEvent("share_completed", { method: "native", item_id: tourSlug }); return; } catch (error) { if ((error as DOMException).name === "AbortError") return; }
    }
    setOpen((value) => !value);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); trackEvent("share_copy_link", { item_id: tourSlug }); trackEvent("share_completed", { method: "copy", item_id: tourSlug }); } catch { setCopied(false); }
  }
  return <div className="relative inline-flex">
    <button type="button" onClick={nativeShare} className={`${compact ? "p-3" : "gap-2 px-4 py-3"} inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white font-bold text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300`} aria-expanded={open}><Share2 size={18}/>{compact ? <span className="sr-only">{ar ? "مشاركة الرحلة" : "Share trip"}</span> : ar ? "مشاركة الرحلة" : "Share trip"}</button>
    {open ? <div className="absolute end-0 top-full z-40 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl" role="menu">
      <button type="button" onClick={copy} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-slate-50" role="menuitem">{copied ? <Check size={17}/> : <Copy size={17}/>} {copied ? (ar ? "تم نسخ الرابط" : "Link copied") : (ar ? "نسخ الرابط" : "Copy link")}</button>
      <a href={whatsappShareUrl(text, url)} target="_blank" rel="noopener noreferrer" onClick={() => { trackEvent("share_whatsapp", { item_id: tourSlug }); trackEvent("share_completed", { method: "whatsapp", item_id: tourSlug }); }} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-slate-50" role="menuitem">WhatsApp</a>
      <a href={`mailto:?subject=${encodeURIComponent(ar ? "رحلة غروب جدة" : "Jeddah sunset cruise")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`} onClick={() => trackEvent("share_email", { item_id: tourSlug })} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-slate-50" role="menuitem"><Mail size={17}/>{ar ? "البريد الإلكتروني" : "Email"}</a>
    </div> : null}
  </div>;
}
