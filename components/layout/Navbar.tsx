"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { currencies, languages, useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/contact";
import { localePath } from "@/lib/i18n";
import SocialLinks from "@/components/layout/SocialLinks";


export default function Navbar() {

  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const { currency, language, setCurrency, setLanguage, t } = useSiteSettings();


  function closeMenu() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    firstMobileLinkRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);


  return (

    <nav
      className="
      fixed
      top-0
      left-0
      z-50
      w-full
      border-b border-slate-200/80
      bg-white/85
      backdrop-blur-xl
      shadow-[0_10px_40px_-20px_rgba(15,23,42,0.45)]
      "
    >


      <div
        className="
        mx-auto
        flex
        max-w-7xl
        items-center
        justify-between
        px-5
        py-3
        md:px-8
        "
      >


        {/* Logo */}

        <Link
          href={localePath(language)}
          onClick={closeMenu}
          className="flex items-center gap-3 rounded-full bg-slate-950/5 px-3 py-2 transition hover:bg-slate-950/10"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 shadow-lg shadow-cyan-500/20">
            <span className="text-lg font-black text-white">DR</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">Daily Red Sea</p>
            <p className="text-xs text-slate-500">Tours & transfers</p>
          </div>
        </Link>




        {/* Desktop Menu */}

        <div
          className="
          hidden
          items-center
          gap-8
          md:flex
          "
        >

          <NavLink href={localePath(language)}>
            {t("home")}
          </NavLink>


          <NavLink href={`${localePath(language)}#tours`}>
            {t("tours")}
          </NavLink>


          <NavLink href={localePath(language, "/transfers")}>
            {t("transfers")}
          </NavLink>

          <NavLink href={localePath(language, "/booking")}>
            {t("booking")}
          </NavLink>

          <NavLink href={localePath(language, "/checkout")}>
            {t("checkout")}
          </NavLink>

          <NavLink href={localePath(language, "/about")}>
            {t("about")}
          </NavLink>



          <Link
            href={`${localePath(language)}#tours`}
            className="
            rounded-full
            bg-gradient-to-r from-cyan-600 to-blue-700
            px-6
            py-3
            font-semibold
            text-white
            shadow-lg shadow-cyan-500/20
            transition
            hover:scale-[1.02]
            hover:from-cyan-500
            hover:to-blue-800
            "
          >
            {t("bookNow")}
          </Link>

          <SettingsSelectors
            currency={currency}
            language={language}
            setCurrency={setCurrency}
            setLanguage={setLanguage}
          />

          <SocialLinks />

        </div>





        {/* Mobile Button */}


        <button
          ref={menuButtonRef}
          onClick={() => setOpen((current) => !current)}
          className="
          rounded-lg
          p-2
          md:hidden
          "
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >

          {open ? (
            <X size={30}/>
          ) : (
            <Menu size={30}/>
          )}

        </button>


      </div>





      {/* Mobile Menu */}


      {open && (

        <div
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="
          flex
          flex-col
          gap-4
          border-t
          bg-white
          px-6
          py-6
          md:hidden
          "
        >


          <MobileLink
            href={localePath(language)}
            close={closeMenu}
            linkRef={firstMobileLinkRef}
          >
            {t("home")}
          </MobileLink>


          <MobileLink
            href={`${localePath(language)}#tours`}
            close={closeMenu}
          >
            {t("tours")}
          </MobileLink>


          <MobileLink
            href={localePath(language, "/transfers")}
            close={closeMenu}
          >
            {t("transfers")}
          </MobileLink>

          <MobileLink
            href={localePath(language, "/booking")}
            close={closeMenu}
          >
            {t("booking")}
          </MobileLink>

          <MobileLink
            href={localePath(language, "/checkout")}
            close={closeMenu}
          >
            {t("checkout")}
          </MobileLink>

          <MobileLink
            href={localePath(language, "/about")}
            close={closeMenu}
          >
            {t("about")}
          </MobileLink>



          <a
            href={whatsappUrl()}
            onClick={() => trackEvent("whatsapp_click", { placement: "mobile_navigation" })}
            target="_blank"
            rel="noopener noreferrer"
            className="
            mt-2
            rounded-xl
            bg-green-600
            px-5
            py-4
            text-center
            font-semibold
            text-white
            "
          >
            {t("whatsappBooking")}
          </a>

          <SettingsSelectors
            currency={currency}
            language={language}
            setCurrency={setCurrency}
            setLanguage={setLanguage}
            mobile
          />

          <SocialLinks className="mt-1" />

        </div>

      )}


    </nav>

  );

}

function SettingsSelectors({
  currency,
  language,
  setCurrency,
  setLanguage,
  mobile = false,
}: {
  currency: (typeof currencies)[number];
  language: (typeof languages)[number]["code"];
  setCurrency: (currency: (typeof currencies)[number]) => void;
  setLanguage: (language: (typeof languages)[number]["code"]) => void;
  mobile?: boolean;
}) {
  const selectClass = mobile
    ? "w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-left text-sm"
    : "rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm";

  return (
    <div className={mobile ? "grid gap-3" : "flex items-center gap-2"}>
      <label className="sr-only" htmlFor={mobile ? "mobile-language" : "language"}>Language</label>
      <select id={mobile ? "mobile-language" : "language"} value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className={selectClass}>
        {languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select>
      <div>
        <label className="sr-only" htmlFor={mobile ? "mobile-currency" : "currency"}>Display currency</label>
        <select id={mobile ? "mobile-currency" : "currency"} value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)} className={selectClass}>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" className="mt-1 block text-center text-[9px] text-slate-400 hover:text-slate-600">Rates by Exchange Rate API</a>
      </div>
    </div>
  );
}




function NavLink({
  href,
  children
}:{
  href:string;
  children:React.ReactNode;
}) {

  return (

    <Link
      href={href}
      className="
      transition
      hover:text-blue-600
      "
    >

      {children}

    </Link>

  );

}




function MobileLink({
  href,
  children,
  close,
  linkRef,
}:{
  href:string;
  children:React.ReactNode;
  close:()=>void;
  linkRef?: React.Ref<HTMLAnchorElement>;
}) {


  return (

    <Link
      href={href}
      ref={linkRef}
      onClick={close}
      className="
      rounded-lg
      py-3
      text-lg
      font-medium
      "
    >

      {children}

    </Link>

  );

}
