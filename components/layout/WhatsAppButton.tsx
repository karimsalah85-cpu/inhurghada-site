"use client";

import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function WhatsAppButton() {

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201004933150";

  const message =
    "Hello Daily Red Sea 🌊 I would like information about your tours.";

  const url =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


  return (

    <a
      href={url}
      onClick={() => trackEvent("whatsapp_click", { placement: "floating_button" })}
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed
        bottom-6
        right-6
        z-50
        flex
        items-center
        gap-3
        rounded-full
        bg-green-600
        px-6
        py-4
        font-semibold
        text-white
        shadow-xl
        transition
        hover:scale-105
        hover:bg-green-700
      "
    >

      <MessageCircle size={28}/>

      <span>
        WhatsApp
      </span>

    </a>

  );

}
