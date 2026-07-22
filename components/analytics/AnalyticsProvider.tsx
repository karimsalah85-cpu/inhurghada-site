"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { consentStorageKey, trackEvent, type ConsentPreferences, updateGoogleConsent } from "@/lib/analytics";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID;

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null);

  useEffect(() => {
    let stored: ConsentPreferences | null = null;
    try { stored = JSON.parse(localStorage.getItem(consentStorageKey) || "null"); } catch { stored = null; }
    const timeout = window.setTimeout(() => setPreferences(stored), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!preferences) return;
    updateGoogleConsent(preferences);
    if (preferences.analytics && gtmId) {
      window.dataLayer?.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    }
  }, [preferences]);

  useEffect(() => {
    if (preferences?.analytics) trackEvent("page_view", { page_path: pathname });
  }, [pathname, preferences?.analytics]);

  function save(next: ConsentPreferences) {
    localStorage.setItem(consentStorageKey, JSON.stringify(next));
    setPreferences(next);
  }

  const googleTagId = gaId || adsId;
  return <>
    {preferences?.analytics && googleTagId ? <Script id="google-tag" src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`} strategy="afterInteractive" onLoad={() => { window.gtag?.("js", new Date()); if (gaId) window.gtag?.("config", gaId, { send_page_view: false }); if (adsId) window.gtag?.("config", adsId); }} /> : null}
    {preferences?.analytics && gtmId ? <Script id="google-tag-manager" src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`} strategy="afterInteractive" /> : null}
    {preferences?.marketing && pixelId ? <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}</Script> : null}
    {!preferences ? <CookieBanner onSave={save} /> : null}
  </>;
}

function CookieBanner({ onSave }: { onSave: (preferences: ConsentPreferences) => void }) {
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  return <section aria-label="Cookie preferences" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"><h2 className="text-lg font-black text-slate-950">Your privacy choices</h2><p className="mt-2 text-sm leading-6 text-slate-600">We use analytics to understand bookings and optional marketing tools to measure advertising. You can change your choice by clearing this site’s stored data in your browser.</p><div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-800"><label className="flex items-center gap-2"><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> Analytics</label><label className="flex items-center gap-2"><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} /> Marketing</label></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => onSave({ analytics: false, marketing: false })} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">Reject optional</button><button type="button" onClick={() => onSave({ analytics, marketing })} className="rounded-full border border-cyan-700 px-4 py-2 text-sm font-bold text-cyan-800">Save choices</button><button type="button" onClick={() => onSave({ analytics: true, marketing: true })} className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-bold text-white">Accept all</button></div></section>;
}
