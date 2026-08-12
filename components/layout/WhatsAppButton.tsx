"use client";

import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/contact";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { publicInterfaceCopy } from "@/lib/public-interface-i18n";

export default function WhatsAppButton() {
  const { setting, language } = useSiteSettings();

  const message = publicInterfaceCopy[language].whatsapp;

  const configuredNumber = setting<string>("whatsapp_number", "").replace(/\D/g, "");
  const url = configuredNumber ? `https://wa.me/${configuredNumber}?text=${encodeURIComponent(message)}` : whatsappUrl(message);


  return (

    <a
      href={url}
      onClick={() => trackEvent("whatsapp_click", { placement: "floating_button" })}
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed
        bottom-4
        right-4
        z-50
        flex
        items-center
        gap-2
        rounded-full
        bg-green-600
        h-14
        w-14
        justify-center
        sm:bottom-6
        sm:right-6
        sm:h-auto
        sm:w-auto
        sm:px-5
        sm:py-3.5
        font-semibold
        text-white
        shadow-xl
        transition
        hover:scale-105
        hover:bg-green-700
      "
    >

      <MessageCircle size={25}/>

      <span className="hidden sm:inline">
        WhatsApp
      </span>

    </a>

  );

}
