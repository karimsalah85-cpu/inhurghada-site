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
  const ar = language === "ar";
  const pl = language === "pl";
  const zh = language === "zh";
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

  return <main className="min-h-screen bg-slate-50 px-5 pb-20 pt-32 sm:px-8"><div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-xl sm:p-10"><CheckCircle2 className="text-emerald-600" size={48}/><p className="mt-5 text-sm font-black uppercase tracking-[0.22em] text-emerald-700">{de ? "Buchung erhalten" : ru ? "Бронирование получено" : ar ? "تم استلام الحجز" : pl ? "Rezerwacja otrzymana" : zh ? "已收到预订" : "Booking received"}</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">{de ? "Vielen Dank" : ru ? "Спасибо" : ar ? "شكراً لك" : pl ? "Dziękujemy" : zh ? "谢谢您" : "Thank you"}{details?.customerName ? `，${details.customerName.split(" ")[0]}` : ""}.</h1><p className="mt-4 leading-7 text-slate-600">{de ? "Deine Buchungsanfrage wurde sicher gespeichert. Unser Team bestätigt Verfügbarkeit und Abholung per WhatsApp." : ru ? "Ваша заявка сохранена. Наша команда подтвердит наличие мест и детали трансфера в WhatsApp." : ar ? "تم حفظ طلب الحجز. سيؤكد فريقنا التوفر وتفاصيل الاستلام عبر واتساب." : pl ? "Twoje zgłoszenie rezerwacji zostało bezpiecznie zapisane. Nasz zespół potwierdzi dostępność i szczegóły odbioru przez WhatsApp." : zh ? "您的预订请求已安全保存。我们的团队会通过 WhatsApp 确认名额和接送详情。" : "Your booking request has been saved securely. Our team will confirm availability and pickup details on WhatsApp."}</p>
    <div className="mt-7 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{de ? "Buchungsnummer" : ru ? "Номер бронирования" : ar ? "رقم الحجز" : pl ? "Numer rezerwacji" : zh ? "预订编号" : "Booking reference"}</p><p className="mt-1 break-all font-mono text-lg font-black text-slate-950">{reference || (de ? "Nicht verfügbar" : ru ? "Недоступно" : ar ? "غير متاح" : pl ? "Niedostępne" : zh ? "暂无" : "Not available")}</p>{details?.serviceName ? <p className="mt-4 font-bold text-slate-900">{details.serviceName}</p> : null}{details?.date ? <p className="mt-1 text-sm text-slate-600">{details.date}{details.time ? ` · ${details.time}` : ""}{details.travelers ? ` · ${details.travelers}` : ""}</p> : null}{details?.total ? <p className="mt-3 font-black text-blue-700">{details.total} · {de ? "Barzahlung bei Ankunft" : ru ? "оплата наличными по прибытии" : ar ? "الدفع نقداً عند الوصول" : pl ? "płatność gotówką na miejscu" : zh ? "抵达后现金付款" : "cash on arrival"}</p> : null}</div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-950"><MessageCircle size={20}/><p className="mt-2 font-bold">{details?.whatsappSent ? (de ? "WhatsApp-Nachricht gesendet" : ru ? "Сообщение WhatsApp отправлено" : ar ? "تم إرسال رسالة واتساب" : pl ? "Wiadomość WhatsApp wysłana" : zh ? "WhatsApp 消息已发送" : "WhatsApp message sent") : (de ? "WhatsApp geöffnet" : ru ? "WhatsApp открыт" : ar ? "تم فتح واتساب" : pl ? "WhatsApp otwarty" : zh ? "WhatsApp 已打开" : "WhatsApp opened")}</p><p className="mt-1 leading-6">{de ? "Bewahre deine Buchungsnummer für Rückfragen auf." : ru ? "Сохраните номер бронирования для дальнейших обращений." : ar ? "احتفظ برقم الحجز لأي استفسار لاحق." : pl ? "Zachowaj numer rezerwacji na potrzeby dalszego kontaktu." : zh ? "请保存预订编号，以便后续咨询。" : "Keep your booking reference for any follow-up."}</p></div><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><ShieldCheck size={20}/><p className="mt-2 font-bold">{details?.customerEmailSent ? (de ? "E-Mail-Bestätigung gesendet" : ru ? "Подтверждение отправлено по электронной почте" : ar ? "تم إرسال تأكيد البريد الإلكتروني" : pl ? "Potwierdzenie e-mail wysłane" : zh ? "确认邮件已发送" : "Email confirmation sent") : (de ? "Buchung gespeichert" : ru ? "Бронирование сохранено" : ar ? "تم حفظ الحجز" : pl ? "Rezerwacja zapisana" : zh ? "预订已保存" : "Booking saved")}</p><p className="mt-1 leading-6">{de ? "Die Bedingungen gelten für Änderungen und Stornierungen." : ru ? "Условия применяются к изменениям и отменам бронирования." : ar ? "تسري الشروط على تعديلات الحجز وإلغائه." : pl ? "Regulamin dotyczy zmian i anulowania rezerwacji." : zh ? "条款适用于预订更改和取消。" : "The terms apply to booking changes and cancellations."}</p></div></div>
    {details?.bookingConfirmationPdf ? <button type="button" onClick={downloadConfirmation} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-4 font-bold text-white hover:bg-blue-800"><Download size={18}/>{de ? "PDF-Bestätigung herunterladen" : ru ? "Скачать подтверждение PDF" : ar ? "تنزيل تأكيد PDF" : pl ? "Pobierz potwierdzenie PDF" : zh ? "下载 PDF 确认单" : "Download PDF confirmation"}</button> : null}
    <div className="mt-4 flex flex-col gap-3 sm:flex-row"><Link href={localePath(language, "/terms-conditions#cancellations")} className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50">{de ? "Stornierungsbedingungen" : ru ? "Правила отмены" : ar ? "سياسة الإلغاء" : pl ? "Zasady anulowania" : zh ? "取消政策" : "Cancellation policy"}</Link><Link href={localePath(language)} className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50">{de ? "Zur Startseite" : ru ? "На главную" : ar ? "العودة إلى الرئيسية" : pl ? "Powrót do strony głównej" : zh ? "返回首页" : "Back to home"}</Link></div></div></main>;
}
