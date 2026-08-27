"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { consentStorageKey, type ConsentPreferences, updateGoogleConsent } from "@/lib/analytics";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { publicInterfaceCopy } from "@/lib/public-interface-i18n";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID;

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null);
  const isInitialPath = useRef(true);
  const hasConfiguredAfterConsent = useRef(false);

  useEffect(() => {
    let stored: ConsentPreferences | null = null;
    try { stored = JSON.parse(localStorage.getItem(consentStorageKey) || "null"); } catch { stored = null; }
    const timeout = window.setTimeout(() => setPreferences(stored), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isInitialPath.current) {
      isInitialPath.current = false;
      return;
    }
    if (gaId) window.gtag?.("config", gaId, { page_path: pathname });
  }, [pathname]);

  useEffect(() => {
    if (!preferences) return;
    updateGoogleConsent(preferences);
    if (preferences.analytics && gaId && !hasConfiguredAfterConsent.current) {
      window.gtag?.("config", gaId, { page_path: pathname });
      hasConfiguredAfterConsent.current = true;
    }
    if (preferences.analytics && gtmId) {
      window.dataLayer?.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    }
  }, [preferences, pathname]);

  function save(next: ConsentPreferences) {
    localStorage.setItem(consentStorageKey, JSON.stringify(next));
    setPreferences(next);
  }

  const googleTagId = gaId || adsId;
  return <>
    {googleTagId ? <Script id="google-consent-default" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag("consent","default",{"ad_storage":"denied","ad_user_data":"denied","ad_personalization":"denied","analytics_storage":"denied","wait_for_update":500});window.gtag("js",new Date());${gaId ? `window.gtag("config","${gaId}");` : ""}${adsId ? `window.gtag("config","${adsId}");` : ""}`}</Script> : null}
    {googleTagId ? <Script id="google-tag" src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`} strategy="afterInteractive" /> : null}
    {preferences?.analytics && gtmId ? <Script id="google-tag-manager" src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`} strategy="afterInteractive" /> : null}
    {preferences?.marketing && pixelId ? <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}</Script> : null}
    {!preferences ? <CookieBanner onSave={save} /> : null}
  </>;
}

function CookieBanner({ onSave }: { onSave: (preferences: ConsentPreferences) => void }) {
  const { language } = useSiteSettings();
  const copy = publicInterfaceCopy[language];
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  return <section role="region" aria-labelledby="cookie-preferences-title" dir={language === "ar" ? "rtl" : "ltr"} className="fixed inset-x-4 bottom-[calc(4.75rem+1rem+env(safe-area-inset-bottom))] z-[100] mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6 xl:bottom-4"><h2 id="cookie-preferences-title" className="text-lg font-black text-slate-950">{copy.cookieTitle}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{copy.cookieText}</p><fieldset className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-800"><legend className="sr-only">{copy.optionalCookies}</legend><label className="flex items-center gap-2"><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> {copy.analytics}</label><label className="flex items-center gap-2"><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} /> {copy.marketing}</label></fieldset><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => onSave({ analytics: false, marketing: false })} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">{copy.reject}</button><button type="button" onClick={() => onSave({ analytics, marketing })} className="rounded-full border border-cyan-700 px-4 py-2 text-sm font-bold text-cyan-800">{copy.save}</button><button type="button" onClick={() => onSave({ analytics: true, marketing: true })} className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-bold text-white">{copy.accept}</button></div></section>;
}
