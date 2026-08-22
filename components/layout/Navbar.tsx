"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, ShoppingCart, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { currencies, languages, useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { trackEvent } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/contact";
import { localePath, localeSwitchPath } from "@/lib/i18n";
import SocialLinks from "@/components/layout/SocialLinks";
import { useCart } from "@/components/cart/CartProvider";
import { publicInterfaceCopy } from "@/lib/public-interface-i18n";
import { destinations } from "@/lib/destinations";


export default function Navbar() {

  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const { currency, language, setCurrency, t } = useSiteSettings();
  const pathname = usePathname();
  const { items } = useCart();
  const ui = publicInterfaceCopy[language];
  const destinationsLabel = language === "ar" ? "الوجهات" : language === "de" ? "Reiseziele" : language === "ru" ? "Направления" : language === "pl" ? "Kierunki" : language === "zh" ? "目的地" : "Destinations";


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
      bg-white/95
      backdrop-blur-xl
      shadow-[0_10px_40px_-20px_rgba(15,23,42,0.45)]
      "
    >


      <div
        className="
        mx-auto
        flex
        max-w-[1500px]
        items-center
        justify-between
        px-5
        py-2.5
        sm:px-8
        "
      >


        {/* Logo */}

        <Link
          href={localePath(language)}
          onClick={closeMenu}
          className="flex shrink-0 items-center rounded-2xl px-2 py-1.5 transition hover:bg-slate-100"
          aria-label={ui.home}
        >
          <Image
            src="/brand/dailyredsea-wordmark.svg?v=coral-2"
            alt="dailyredsea.com"
            width={633}
            height={98}
            priority
            className="h-auto w-[180px] sm:w-[220px]"
          />
        </Link>




        {/* Desktop Menu */}

        <div
          className="
          hidden
          items-center
          gap-3
          xl:flex
          "
        >

          <div className="flex items-center gap-1 rounded-2xl bg-slate-100/80 p-1">
          <NavLink href={localePath(language)} active={pathname === localePath(language)}>
            {t("home")}
          </NavLink>


          <NavLink href={localePath(language, "/tours")}>
            {t("tours")}
          </NavLink>

          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-xl px-4 py-2.5 font-semibold text-slate-700 hover:bg-white hover:text-blue-700">{destinationsLabel} <ChevronDown size={16} className="transition group-open:rotate-180"/></summary>
            <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {destinations.filter((destination) => destination.status === "live").map((destination) => <Link key={destination.slug} href={localePath(language, `/destinations/${destination.slug}`)} className="block rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-800">{destination.name}</Link>)}
            </div>
          </details>


          <NavLink href={localePath(language, "/transfers")} active={pathname === localePath(language, "/transfers")}>
            {t("transfers")}
          </NavLink>

          <NavLink href={localePath(language, "/about")} active={pathname === localePath(language, "/about")}>
            {t("about")}
          </NavLink>

          <NavLink href={localePath(language, "/blog")} active={pathname === localePath(language, "/blog") || pathname.startsWith(`${localePath(language, "/blog")}/`)}>
            {language === "ru" ? "Блог" : language === "ar" ? "المدونة" : language === "pl" ? "Poradnik" : language === "zh" ? "旅游指南" : "Blog"}
          </NavLink>
          </div>



          <Link
            href={localePath(language, "/booking")}
            className="
            rounded-full
            bg-gradient-to-r from-cyan-600 to-blue-700
            whitespace-nowrap
            px-5
            py-2.5
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

          <Link href={localePath(language, "/cart")} aria-label={`${items.length} ${ui.cart}`} className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700">
            <ShoppingCart size={22} />
            {items.length ? <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-xs font-bold text-white">{items.length}</span> : null}
          </Link>

          <SettingsSelectors
            currency={currency}
            language={language}
            pathname={pathname}
            setCurrency={setCurrency}
          />

          <SocialLinks />

        </div>





        {/* Mobile Button */}


        <button
          ref={menuButtonRef}
          onClick={() => setOpen((current) => !current)}
          className="
          rounded-xl
          border border-slate-200
          bg-slate-50
          p-2.5
          text-slate-800
          xl:hidden
          "
          aria-label={open ? ui.closeMenu : ui.openMenu}
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
          aria-label={ui.mobileNav}
          className="flex max-h-[calc(100vh-68px)] flex-col gap-2 overflow-y-auto border-t border-slate-200 bg-white px-6 py-5 shadow-xl xl:hidden"
        >


          <MobileLink
            href={localePath(language)}
            close={closeMenu}
            linkRef={firstMobileLinkRef}
          >
            {t("home")}
          </MobileLink>

          <MobileLink
            href={localePath(language, "/tours")}
            close={closeMenu}
          >
            {t("tours")}
          </MobileLink>

          <p className="px-4 pt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{destinationsLabel}</p>
          {destinations.filter((destination) => destination.status === "live").map((destination) => <MobileLink key={destination.slug} href={localePath(language, `/destinations/${destination.slug}`)} close={closeMenu}><span>{destination.name}</span></MobileLink>)}


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

          <MobileLink href={localePath(language, "/cart")} close={closeMenu}>
            <span className="flex items-center justify-between"><span>{language === "de" ? "Reisewarenkorb" : language === "ru" ? "Корзина поездок" : language === "ar" ? "سلة الرحلات" : language === "pl" ? "Koszyk wycieczek" : language === "zh" ? "行程购物车" : "Trip cart"}</span><span className="rounded-full bg-blue-100 px-2 py-0.5 text-sm font-bold text-blue-800">{items.length}</span></span>
          </MobileLink>

          <MobileLink
            href={localePath(language, "/about")}
            close={closeMenu}
          >
            {t("about")}
          </MobileLink>

          <MobileLink href={localePath(language, "/blog")} close={closeMenu}>
            {language === "ru" ? "Блог" : language === "ar" ? "المدونة" : language === "pl" ? "Poradnik" : language === "zh" ? "旅游指南" : "Blog"}
          </MobileLink>



          <a
            href={whatsappUrl()}
            onClick={() => trackEvent("whatsapp_click", { placement: "mobile_navigation" })}
            target="_blank"
            rel="noopener noreferrer"
            className="
            mt-3
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
            pathname={pathname}
            setCurrency={setCurrency}
            onLanguageSelect={closeMenu}
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
  pathname,
  setCurrency,
  onLanguageSelect,
  mobile = false,
}: {
  currency: (typeof currencies)[number];
  language: (typeof languages)[number]["code"];
  pathname: string;
  setCurrency: (currency: (typeof currencies)[number]) => void;
  onLanguageSelect?: () => void;
  mobile?: boolean;
}) {
  const selectClass = mobile
    ? "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium outline-none focus:border-cyan-500"
    : "rounded-xl border-0 bg-transparent px-2 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500";

  return (
    <div className={mobile ? "grid gap-3 rounded-2xl bg-slate-50 p-3" : "flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"}>
      <LanguageDropdown
        language={language}
        pathname={pathname}
        mobile={mobile}
        onLanguageSelect={onLanguageSelect}
      />
      <div className={mobile ? "" : "flex items-center border-l border-slate-200 pl-1"}>
        <label className="sr-only" htmlFor={mobile ? "mobile-currency" : "currency"}>{publicInterfaceCopy[language].currency}</label>
        <select id={mobile ? "mobile-currency" : "currency"} value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)} className={selectClass}>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" title={publicInterfaceCopy[language].ratesBy} className={mobile ? "mt-2 block text-center text-[10px] font-medium text-slate-400 hover:text-slate-600" : "rounded-lg px-1.5 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-400 hover:bg-slate-50 hover:text-slate-600"}>{mobile ? publicInterfaceCopy[language].ratesBy : publicInterfaceCopy[language].rates}</a>
      </div>
    </div>
  );
}

function LanguageDropdown({
  language,
  pathname,
  mobile,
  onLanguageSelect,
}: {
  language: (typeof languages)[number]["code"];
  pathname: string;
  mobile: boolean;
  onLanguageSelect?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const menuId = mobile ? "mobile-language-menu" : "desktop-language-menu";
  const currentLanguage = languages.find((item) => item.code === language) ?? languages[0];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function openAndFocusFirstLanguage() {
    setOpen(true);
    window.requestAnimationFrame(() => firstLinkRef.current?.focus());
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Choose language. Current language: ${currentLanguage.label}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openAndFocusFirstLanguage();
          }
        }}
        className={mobile
          ? "flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none transition hover:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-500"
          : "flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-500"}
      >
        <span lang={currentLanguage.code}>{currentLanguage.label}</span>
        <ChevronDown aria-hidden="true" size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <nav
        id={menuId}
        aria-label="Choose site language"
        hidden={!open}
        className={mobile
          ? "mt-2 grid grid-cols-2 gap-1"
          : "absolute right-0 top-full z-20 mt-2 grid min-w-40 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"}
      >
        {languages.map((item, index) => {
          const active = item.code === language;
          return (
            <Link
              key={item.code}
              ref={index === 0 ? firstLinkRef : undefined}
              href={localeSwitchPath(pathname, item.code)}
              hrefLang={item.code}
              lang={item.code}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                setOpen(false);
                onLanguageSelect?.();
              }}
              className={`rounded-lg px-3 py-2 text-sm outline-none transition hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-500 ${active ? "bg-cyan-50 font-bold text-cyan-900" : "text-slate-700"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}




function NavLink({
  href,
  children,
  active = false,
}:{
  href:string;
  children:React.ReactNode;
  active?: boolean;
}) {

  return (

    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? "bg-white text-blue-700 shadow-sm" : "text-slate-700 hover:bg-white/80 hover:text-blue-700"}`}
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
      className="rounded-xl px-3 py-3 text-base font-semibold text-slate-800 transition hover:bg-slate-100 hover:text-blue-700"
    >

      {children}

    </Link>

  );

}
