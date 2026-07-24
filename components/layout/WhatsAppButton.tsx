"use client";

import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { whatsappUrl } from "@/lib/contact";

export default function WhatsAppButton() {

  const message =
    "Hello Daily Red Sea 🌊 I would like information about your tours.";

  const url = whatsappUrl(message);


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
