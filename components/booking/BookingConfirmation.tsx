"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Download, MessageCircle, ShieldCheck } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import { localePath } from "@/lib/i18n";
import { confirmationStorageKey } from "@/lib/booking-confirmation";

type ConfirmationData = {
  reference: string;
  customerName?: string;
  serviceName?: string;
  date?: string;
  time?: string;
  travelers?: string;
  total?: string;
  customerEmailSent?: boolean;
  whatsappSent?: boolean;
  bookingConfirmationPdf?: string;
};

export default function BookingConfirmation() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference")?.trim() || "";
  const { language } = useSiteSettings();
  const de = language === "de";
  const ru = language === "ru";
  const storedDetails = useSyncExternalStore(
    () => () => undefined,
    () => reference ? window.sessionStorage.getItem(confirmationStorageKey(reference)) : null,
    () => null,
  );
  const details = useMemo(() => {
    try { return storedDetails ? JSON.parse(storedDetails) as ConfirmationData : null; }
    catch { return null; }
  }, [storedDetails]);

  function downloadConfirmation() {
    if (!details?.bookingConfirmationPdf) return;
    const bytes = Uint8Array.from(atob(details.bookingConfirmationPdf), (character) => character.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-red-sea-booking-${reference}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return <main className="min-h-screen bg-slate-50 px-5 pb-20 pt-32 sm:px-8"><div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-xl sm:p-10"><CheckCircle2 className="text-emerald-600" size={48}/><p className="mt-5 text-sm font-black uppercase tracking-[0.22em] text-emerald-700">{de ? "Buchung erhalten" : ru ? "Бронирование получено" : "Booking received"}</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">{de ? "Vielen Dank" : ru ? "Спасибо" : "Thank you"}{details?.customerName ? `, ${details.customerName.split(" ")[0]}` : ""}.</h1><p className="mt-4 leading-7 text-slate-600">{de ? "Deine Buchungsanfrage wurde sicher gespeichert. Unser Team bestätigt Verfügbarkeit und Abholung per WhatsApp." : ru ? "Ваша заявка сохранена. Наша команда подтвердит наличие мест и детали трансфера в WhatsApp." : "Your booking request has been saved securely. Our team will confirm availability and pickup details on WhatsApp."}</p>
    <div className="mt-7 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{de ? "Buchungsnummer" : ru ? "Номер бронирования" : "Booking reference"}</p><p className="mt-1 break-all font-mono text-lg font-black text-slate-950">{reference || (de ? "Nicht verfügbar" : ru ? "Недоступно" : "Not available")}</p>{details?.serviceName ? <p className="mt-4 font-bold text-slate-900">{details.serviceName}</p> : null}{details?.date ? <p className="mt-1 text-sm text-slate-600">{details.date}{details.time ? ` · ${details.time}` : ""}{details.travelers ? ` · ${details.travelers}` : ""}</p> : null}{details?.total ? <p className="mt-3 font-black text-blue-700">{details.total} · {de ? "Barzahlung bei Ankunft" : ru ? "оплата наличными по прибытии" : "cash on arrival"}</p> : null}</div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-950"><MessageCircle size={20}/><p className="mt-2 font-bold">{details?.whatsappSent ? (de ? "WhatsApp-Nachricht gesendet" : ru ? "Сообщение WhatsApp отправлено" : "WhatsApp message sent") : (de ? "WhatsApp geöffnet" : ru ? "WhatsApp открыт" : "WhatsApp opened")}</p><p className="mt-1 leading-6">{de ? "Bewahre deine Buchungsnummer für Rückfragen auf." : ru ? "Сохраните номер бронирования для дальнейших обращений." : "Keep your booking reference for any follow-up."}</p></div><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><ShieldCheck size={20}/><p className="mt-2 font-bold">{details?.customerEmailSent ? (de ? "E-Mail-Bestätigung gesendet" : ru ? "Подтверждение отправлено по электронной почте" : "Email confirmation sent") : (de ? "Buchung gespeichert" : ru ? "Бронирование сохранено" : "Booking saved")}</p><p className="mt-1 leading-6">{de ? "Die Bedingungen gelten für Änderungen und Stornierungen." : ru ? "Условия применяются к изменениям и отменам бронирования." : "The terms apply to booking changes and cancellations."}</p></div></div>
    {details?.bookingConfirmationPdf ? <button type="button" onClick={downloadConfirmation} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-4 font-bold text-white hover:bg-blue-800"><Download size={18}/>{de ? "PDF-Bestätigung herunterladen" : ru ? "Скачать подтверждение PDF" : "Download PDF confirmation"}</button> : null}
    <div className="mt-4 flex flex-col gap-3 sm:flex-row"><Link href={localePath(language, "/terms-conditions#cancellations")} className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50">{de ? "Stornierungsbedingungen" : ru ? "Правила отмены" : "Cancellation policy"}</Link><Link href={localePath(language)} className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50">{de ? "Zur Startseite" : ru ? "На главную" : "Back to home"}</Link></div></div></main>;
}
