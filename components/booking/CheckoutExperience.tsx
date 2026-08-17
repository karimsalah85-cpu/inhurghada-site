"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, CalendarRange, CreditCard, MessageCircle, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import type { BookingRecord } from "@/lib/booking-service";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import type { Language } from "@/components/settings/SiteSettingsContext";

type Copy = {
  eyebrow: string;
  heroTitle: string;
  heroText: string;
  bookingReadyEyebrow: string;
  noBookingEyebrow: string;
  bookingHeading: (reference: string) => string;
  noBookingHeading: string;
  yourRequestFallback: string;
  confirmationSuccess: (reference: string) => string;
  confirmationCancelled: string;
  bookingStatusEyebrow: string;
  paymentConfirmedHeading: string;
  paymentCancelledHeading: string;
  downloadInvoice: string;
  reservationSnapshotEyebrow: string;
  guestLabel: string;
  phoneLabel: string;
  statusLabel: string;
  amountLabel: string;
  toBeConfirmed: string;
  dateLabel: string;
  pickupLabel: string;
  reservationAppearHeading: string;
  reservationAppearText: string;
  errorLoadBooking: string;
  errorReachService: string;
  browseTours: string;
  manageBooking: string;
  howItWorksEyebrow: string;
  simpleCheckoutHeading: string;
  steps: string[];
  whyChooseEyebrow: string;
  secureEffortlessHeading: string;
  perks: string[];
  paymentOptionsEyebrow: string;
  bookNowPayArrivalHeading: string;
  paymentOptionsText: string;
};

const COPY: Record<Language, Copy> = {
  en: {
    eyebrow: "Checkout",
    heroTitle: "Your booking journey, beautifully organized",
    heroText: "Review your trip details, confirm your date and pickup, and continue with a smooth, premium booking flow designed for Hurghada tours and transfers.",
    bookingReadyEyebrow: "Booking ready",
    noBookingEyebrow: "No booking in progress",
    bookingHeading: (reference) => `Booking ${reference}`,
    noBookingHeading: "Choose a tour and press Book now to start",
    yourRequestFallback: "your request",
    confirmationSuccess: (reference) => `Payment confirmed for booking ${reference}. We will send your voucher shortly.`,
    confirmationCancelled: "Your payment was cancelled. You can try again or contact us for help.",
    bookingStatusEyebrow: "Booking status",
    paymentConfirmedHeading: "Payment confirmed",
    paymentCancelledHeading: "Payment cancelled",
    downloadInvoice: "Download invoice (PDF)",
    reservationSnapshotEyebrow: "Reservation snapshot",
    guestLabel: "Guest",
    phoneLabel: "Phone",
    statusLabel: "Status",
    amountLabel: "Amount",
    toBeConfirmed: "To be confirmed",
    dateLabel: "Date:",
    pickupLabel: "Pickup:",
    reservationAppearHeading: "Your reservation will appear here",
    reservationAppearText: "Start with a tour from our collection and we will guide you through the checkout flow with pickup details, traveler information and a clear confirmation.",
    errorLoadBooking: "We could not load this booking.",
    errorReachService: "We could not reach the booking service.",
    browseTours: "Browse tours",
    manageBooking: "Manage booking",
    howItWorksEyebrow: "How it works",
    simpleCheckoutHeading: "A simple checkout from start to finish",
    steps: [
      "Choose a tour and pick your date",
      "Add travelers, pickup details, and notes",
      "Confirm everything on WhatsApp and pay safely",
      "Receive your voucher and support anytime",
    ],
    whyChooseEyebrow: "Why travelers choose us",
    secureEffortlessHeading: "Secure and effortless",
    perks: [
      "Fast WhatsApp confirmation",
      "Flexible pickup and change requests",
      "Secure payments and protected bookings",
      "Trusted local support 24/7",
    ],
    paymentOptionsEyebrow: "Payment options",
    bookNowPayArrivalHeading: "Book now or pay on arrival",
    paymentOptionsText: "Reserve your experience online or complete the final step on arrival. Our support team is ready to help whenever you need it.",
  },
  ar: {
    eyebrow: "إتمام الحجز",
    heroTitle: "رحلة حجزك، منظمة بعناية",
    heroText: "راجع تفاصيل رحلتك، وأكّد التاريخ ووقت الاستلام، وتابع عملية حجز سلسة ومميزة مصممة خصيصًا لرحلات وتنقلات الغردقة.",
    bookingReadyEyebrow: "الحجز جاهز",
    noBookingEyebrow: "لا يوجد حجز قيد التنفيذ",
    bookingHeading: (reference) => `الحجز رقم ${reference}`,
    noBookingHeading: "اختر رحلة واضغط على احجز الآن للبدء",
    yourRequestFallback: "طلبك",
    confirmationSuccess: (reference) => `تم تأكيد الدفع لحجز رقم ${reference}. سنرسل لك القسيمة قريبًا.`,
    confirmationCancelled: "تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى أو التواصل معنا للمساعدة.",
    bookingStatusEyebrow: "حالة الحجز",
    paymentConfirmedHeading: "تم تأكيد الدفع",
    paymentCancelledHeading: "تم إلغاء الدفع",
    downloadInvoice: "تنزيل الفاتورة (PDF)",
    reservationSnapshotEyebrow: "ملخص الحجز",
    guestLabel: "الضيف",
    phoneLabel: "رقم الهاتف",
    statusLabel: "الحالة",
    amountLabel: "المبلغ",
    toBeConfirmed: "سيتم تأكيده لاحقًا",
    dateLabel: "التاريخ:",
    pickupLabel: "الاستلام:",
    reservationAppearHeading: "سيظهر حجزك هنا",
    reservationAppearText: "ابدأ باختيار رحلة من مجموعتنا، وسنرشدك خلال عملية الحجز بتفاصيل الاستلام ومعلومات المسافرين وتأكيد واضح.",
    errorLoadBooking: "تعذّر تحميل بيانات هذا الحجز.",
    errorReachService: "تعذّر الوصول إلى خدمة الحجوزات.",
    browseTours: "تصفح الرحلات",
    manageBooking: "إدارة الحجز",
    howItWorksEyebrow: "كيف تتم العملية",
    simpleCheckoutHeading: "خطوات حجز بسيطة من البداية إلى النهاية",
    steps: [
      "اختر رحلة وحدد تاريخك",
      "أضف بيانات المسافرين وتفاصيل الاستلام وملاحظاتك",
      "أكّد كل شيء عبر واتساب وادفع بأمان",
      "استلم قسيمتك واحصل على الدعم في أي وقت",
    ],
    whyChooseEyebrow: "لماذا يختارنا المسافرون",
    secureEffortlessHeading: "آمن وسهل",
    perks: [
      "تأكيد سريع عبر واتساب",
      "مرونة في الاستلام وطلبات التغيير",
      "مدفوعات آمنة وحجوزات محمية",
      "دعم محلي موثوق على مدار الساعة",
    ],
    paymentOptionsEyebrow: "خيارات الدفع",
    bookNowPayArrivalHeading: "احجز الآن أو ادفع عند الوصول",
    paymentOptionsText: "احجز تجربتك عبر الإنترنت أو أكمل الخطوة الأخيرة عند الوصول. فريق الدعم لدينا جاهز لمساعدتك في أي وقت.",
  },
  de: {
    eyebrow: "Kasse",
    heroTitle: "Deine Buchungsreise, wunderbar organisiert",
    heroText: "Überprüfe deine Reisedetails, bestätige Datum und Abholung und fahre mit einem reibungslosen, erstklassigen Buchungsablauf für Ausflüge und Transfers in Hurghada fort.",
    bookingReadyEyebrow: "Buchung bereit",
    noBookingEyebrow: "Keine laufende Buchung",
    bookingHeading: (reference) => `Buchung ${reference}`,
    noBookingHeading: "Wähle einen Ausflug und klicke auf Jetzt buchen, um zu starten",
    yourRequestFallback: "deine Anfrage",
    confirmationSuccess: (reference) => `Zahlung für Buchung ${reference} bestätigt. Wir senden dir deinen Gutschein in Kürze.`,
    confirmationCancelled: "Deine Zahlung wurde storniert. Du kannst es erneut versuchen oder uns für Hilfe kontaktieren.",
    bookingStatusEyebrow: "Buchungsstatus",
    paymentConfirmedHeading: "Zahlung bestätigt",
    paymentCancelledHeading: "Zahlung storniert",
    downloadInvoice: "Rechnung herunterladen (PDF)",
    reservationSnapshotEyebrow: "Buchungsübersicht",
    guestLabel: "Gast",
    phoneLabel: "Telefon",
    statusLabel: "Status",
    amountLabel: "Betrag",
    toBeConfirmed: "Wird noch bestätigt",
    dateLabel: "Datum:",
    pickupLabel: "Abholung:",
    reservationAppearHeading: "Deine Reservierung erscheint hier",
    reservationAppearText: "Beginne mit einem Ausflug aus unserer Auswahl, und wir führen dich durch den Buchungsablauf mit Abholdetails, Reisendeninformationen und einer klaren Bestätigung.",
    errorLoadBooking: "Diese Buchung konnte nicht geladen werden.",
    errorReachService: "Der Buchungsservice konnte nicht erreicht werden.",
    browseTours: "Ausflüge ansehen",
    manageBooking: "Buchung verwalten",
    howItWorksEyebrow: "So funktioniert's",
    simpleCheckoutHeading: "Ein einfacher Buchungsablauf von Anfang bis Ende",
    steps: [
      "Wähle einen Ausflug und dein Datum",
      "Füge Reisende, Abholdetails und Anmerkungen hinzu",
      "Bestätige alles per WhatsApp und bezahle sicher",
      "Erhalte deinen Gutschein und Support jederzeit",
    ],
    whyChooseEyebrow: "Warum Reisende uns wählen",
    secureEffortlessHeading: "Sicher und mühelos",
    perks: [
      "Schnelle Bestätigung per WhatsApp",
      "Flexible Abholung und Änderungswünsche",
      "Sichere Zahlungen und geschützte Buchungen",
      "Vertrauenswürdiger lokaler Support rund um die Uhr",
    ],
    paymentOptionsEyebrow: "Zahlungsoptionen",
    bookNowPayArrivalHeading: "Jetzt buchen oder bei Ankunft bezahlen",
    paymentOptionsText: "Reserviere dein Erlebnis online oder erledige den letzten Schritt bei Ankunft. Unser Support-Team hilft dir jederzeit gerne weiter.",
  },
  ru: {
    eyebrow: "Оформление",
    heroTitle: "Ваше бронирование — организовано безупречно",
    heroText: "Проверьте детали поездки, подтвердите дату и место встречи и продолжите с удобным премиальным оформлением бронирования для туров и трансферов в Хургаде.",
    bookingReadyEyebrow: "Бронирование готово",
    noBookingEyebrow: "Нет активного бронирования",
    bookingHeading: (reference) => `Бронирование ${reference}`,
    noBookingHeading: "Выберите тур и нажмите «Забронировать», чтобы начать",
    yourRequestFallback: "ваш запрос",
    confirmationSuccess: (reference) => `Оплата подтверждена для бронирования ${reference}. Мы вышлем ваучер в ближайшее время.`,
    confirmationCancelled: "Оплата была отменена. Вы можете попробовать снова или связаться с нами за помощью.",
    bookingStatusEyebrow: "Статус бронирования",
    paymentConfirmedHeading: "Оплата подтверждена",
    paymentCancelledHeading: "Оплата отменена",
    downloadInvoice: "Скачать счёт (PDF)",
    reservationSnapshotEyebrow: "Сводка бронирования",
    guestLabel: "Гость",
    phoneLabel: "Телефон",
    statusLabel: "Статус",
    amountLabel: "Сумма",
    toBeConfirmed: "Будет подтверждено",
    dateLabel: "Дата:",
    pickupLabel: "Трансфер:",
    reservationAppearHeading: "Здесь появится ваше бронирование",
    reservationAppearText: "Начните с выбора тура из нашей коллекции, и мы проведём вас через процесс оформления с деталями трансфера, информацией о путешественниках и понятным подтверждением.",
    errorLoadBooking: "Не удалось загрузить это бронирование.",
    errorReachService: "Не удалось подключиться к сервису бронирования.",
    browseTours: "Смотреть туры",
    manageBooking: "Управление бронированием",
    howItWorksEyebrow: "Как это работает",
    simpleCheckoutHeading: "Простое оформление от начала до конца",
    steps: [
      "Выберите тур и дату",
      "Добавьте данные путешественников, детали трансфера и заметки",
      "Подтвердите всё в WhatsApp и оплатите безопасно",
      "Получите ваучер и поддержку в любое время",
    ],
    whyChooseEyebrow: "Почему путешественники выбирают нас",
    secureEffortlessHeading: "Безопасно и без усилий",
    perks: [
      "Быстрое подтверждение в WhatsApp",
      "Гибкий трансфер и изменение заявок",
      "Безопасные платежи и защищённые бронирования",
      "Надёжная местная поддержка 24/7",
    ],
    paymentOptionsEyebrow: "Способы оплаты",
    bookNowPayArrivalHeading: "Забронируйте сейчас или оплатите по прибытии",
    paymentOptionsText: "Забронируйте поездку онлайн или завершите последний шаг по прибытии. Наша команда поддержки готова помочь в любое время.",
  },
  pl: {
    eyebrow: "Finalizacja",
    heroTitle: "Twoja podróż rezerwacyjna, zorganizowana bez zarzutu",
    heroText: "Sprawdź szczegóły swojej wycieczki, potwierdź datę i miejsce odbioru i kontynuuj płynny, komfortowy proces rezerwacji stworzony dla wycieczek i transferów w Hurghadzie.",
    bookingReadyEyebrow: "Rezerwacja gotowa",
    noBookingEyebrow: "Brak trwającej rezerwacji",
    bookingHeading: (reference) => `Rezerwacja ${reference}`,
    noBookingHeading: "Wybierz wycieczkę i kliknij Zarezerwuj teraz, aby zacząć",
    yourRequestFallback: "Twoje zgłoszenie",
    confirmationSuccess: (reference) => `Płatność za rezerwację ${reference} została potwierdzona. Wkrótce wyślemy Twój voucher.`,
    confirmationCancelled: "Twoja płatność została anulowana. Możesz spróbować ponownie lub skontaktować się z nami po pomoc.",
    bookingStatusEyebrow: "Status rezerwacji",
    paymentConfirmedHeading: "Płatność potwierdzona",
    paymentCancelledHeading: "Płatność anulowana",
    downloadInvoice: "Pobierz fakturę (PDF)",
    reservationSnapshotEyebrow: "Podsumowanie rezerwacji",
    guestLabel: "Gość",
    phoneLabel: "Telefon",
    statusLabel: "Status",
    amountLabel: "Kwota",
    toBeConfirmed: "Do potwierdzenia",
    dateLabel: "Data:",
    pickupLabel: "Odbiór:",
    reservationAppearHeading: "Tutaj pojawi się Twoja rezerwacja",
    reservationAppearText: "Zacznij od wybrania wycieczki z naszej oferty, a przeprowadzimy Cię przez proces rezerwacji ze szczegółami odbioru, danymi uczestników i jasnym potwierdzeniem.",
    errorLoadBooking: "Nie udało się wczytać tej rezerwacji.",
    errorReachService: "Nie udało się połączyć z serwisem rezerwacji.",
    browseTours: "Przeglądaj wycieczki",
    manageBooking: "Zarządzaj rezerwacją",
    howItWorksEyebrow: "Jak to działa",
    simpleCheckoutHeading: "Prosty proces rezerwacji od początku do końca",
    steps: [
      "Wybierz wycieczkę i ustal datę",
      "Dodaj uczestników, szczegóły odbioru i uwagi",
      "Potwierdź wszystko na WhatsApp i zapłać bezpiecznie",
      "Otrzymaj voucher i wsparcie w każdej chwili",
    ],
    whyChooseEyebrow: "Dlaczego podróżni wybierają nas",
    secureEffortlessHeading: "Bezpiecznie i bez wysiłku",
    perks: [
      "Szybkie potwierdzenie na WhatsApp",
      "Elastyczny odbiór i zmiana rezerwacji",
      "Bezpieczne płatności i chronione rezerwacje",
      "Zaufane lokalne wsparcie 24/7",
    ],
    paymentOptionsEyebrow: "Opcje płatności",
    bookNowPayArrivalHeading: "Zarezerwuj teraz lub zapłać na miejscu",
    paymentOptionsText: "Zarezerwuj swoją atrakcję online lub dokończ ostatni krok po przyjeździe. Nasz zespół wsparcia jest gotowy pomóc, kiedy tylko potrzebujesz.",
  },
  zh: {
    eyebrow: "结算",
    heroTitle: "您的预订之旅，井然有序",
    heroText: "查看行程详情，确认日期与接送安排，继续体验为赫尔格达旅游和接送服务量身打造的顺畅、优质预订流程。",
    bookingReadyEyebrow: "预订就绪",
    noBookingEyebrow: "暂无进行中的预订",
    bookingHeading: (reference) => `预订 ${reference}`,
    noBookingHeading: "选择一个行程并点击立即预订以开始",
    yourRequestFallback: "您的请求",
    confirmationSuccess: (reference) => `预订 ${reference} 的付款已确认。我们会尽快为您发送凭证。`,
    confirmationCancelled: "您的付款已取消。您可以重新尝试，或联系我们寻求帮助。",
    bookingStatusEyebrow: "预订状态",
    paymentConfirmedHeading: "付款已确认",
    paymentCancelledHeading: "付款已取消",
    downloadInvoice: "下载发票（PDF）",
    reservationSnapshotEyebrow: "预订概览",
    guestLabel: "客人",
    phoneLabel: "电话",
    statusLabel: "状态",
    amountLabel: "金额",
    toBeConfirmed: "待确认",
    dateLabel: "日期：",
    pickupLabel: "接送：",
    reservationAppearHeading: "您的预订将显示在这里",
    reservationAppearText: "从我们精选的行程中挑选一个开始，我们会引导您完成包含接送详情、旅客信息和明确确认的预订流程。",
    errorLoadBooking: "无法加载此预订。",
    errorReachService: "无法连接到预订服务。",
    browseTours: "浏览行程",
    manageBooking: "管理预订",
    howItWorksEyebrow: "预订流程",
    simpleCheckoutHeading: "从头到尾，简单预订",
    steps: [
      "选择行程并确定日期",
      "填写旅客信息、接送详情和备注",
      "通过 WhatsApp 确认全部信息并安全付款",
      "随时获取凭证和支持",
    ],
    whyChooseEyebrow: "旅客选择我们的理由",
    secureEffortlessHeading: "安全省心",
    perks: [
      "WhatsApp 快速确认",
      "灵活的接送和变更申请",
      "安全付款，预订有保障",
      "值得信赖的 24/7 本地支持",
    ],
    paymentOptionsEyebrow: "付款方式",
    bookNowPayArrivalHeading: "立即预订或抵达后付款",
    paymentOptionsText: "在线预订您的体验，或在抵达后完成最后一步。我们的支持团队随时准备为您提供帮助。",
  },
};

export default function CheckoutExperience() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const booking = searchParams.get("booking");
  const sessionId = searchParams.get("session_id");

  return <CheckoutContent key={booking} status={status} booking={booking} sessionId={sessionId} />;
}

function CheckoutContent({ status, booking, sessionId }: { status: string | null; booking: string | null; sessionId: string | null }) {
  const { language } = useSiteSettings();
  const copy = COPY[language];
  const copyRef = useRef(copy);
  useEffect(() => {
    copyRef.current = copy;
  }, [copy]);

  const [bookingDetails, setBookingDetails] = useState<BookingRecord | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (!booking) {
      return;
    }

    const bookingReference = booking;
    let isMounted = true;

    async function loadBooking() {
      try {
        const response = await fetch(`/api/bookings?reference=${encodeURIComponent(bookingReference)}`);
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        if (!response.ok || !data.success) {
          setBookingError(data.error || copyRef.current.errorLoadBooking);
          setBookingDetails(null);
          return;
        }

        setBookingDetails(data.booking);
        setBookingError(null);
      } catch {
        if (isMounted) {
          setBookingError(copyRef.current.errorReachService);
          setBookingDetails(null);
        }
      }
    }

    loadBooking();

    return () => {
      isMounted = false;
    };
  }, [booking]);

  const confirmationMessage = status === "success"
    ? copy.confirmationSuccess(booking || copy.yourRequestFallback)
    : status === "cancelled"
      ? copy.confirmationCancelled
      : null;

  return (
    <main dir={language === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.25),_transparent_40%)]" />
        <div className="absolute inset-0 bg-[url('/images/placeholders/sea-activity.svg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">{copy.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">{copy.heroTitle}</h1>
            <p className="mt-6 text-lg leading-8 text-slate-200">
              {copy.heroText}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_-30px_rgba(15,23,42,0.35)] sm:p-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                <Ticket size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{bookingDetails ? copy.bookingReadyEyebrow : copy.noBookingEyebrow}</p>
                <h2 className="text-3xl font-bold text-slate-900">{bookingDetails ? copy.bookingHeading(bookingDetails.reference) : copy.noBookingHeading}</h2>
              </div>
            </div>

            {confirmationMessage ? (
              <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{copy.bookingStatusEyebrow}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{status === "success" ? copy.paymentConfirmedHeading : copy.paymentCancelledHeading}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{confirmationMessage}</p>
                {status === "success" && booking && sessionId ? (
                  <a
                    href={`/api/invoices/${encodeURIComponent(booking)}?session_id=${encodeURIComponent(sessionId)}`}
                    className="mt-5 inline-flex items-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    {copy.downloadInvoice}
                  </a>
                ) : null}
              </div>
            ) : null}

            {bookingDetails ? (
              <div className="mt-8 rounded-3xl border border-cyan-200 bg-cyan-50 p-8 text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">{copy.reservationSnapshotEyebrow}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div><p className="text-sm text-slate-500">{copy.guestLabel}</p><p className="font-semibold text-slate-900">{bookingDetails.customerName}</p></div>
                  <div><p className="text-sm text-slate-500">{copy.phoneLabel}</p><p className="font-semibold text-slate-900">{bookingDetails.phone}</p></div>
                  <div><p className="text-sm text-slate-500">{copy.statusLabel}</p><p className="font-semibold text-slate-900">{bookingDetails.status}</p></div>
                  <div><p className="text-sm text-slate-500">{copy.amountLabel}</p><p className="font-semibold text-slate-900">{bookingDetails.amount ? `${bookingDetails.amount} ${bookingDetails.currency?.toUpperCase() || "USD"}` : copy.toBeConfirmed}</p></div>
                </div>
                {bookingDetails.date ? <p className="mt-4 text-sm text-slate-700"><span className="font-semibold">{copy.dateLabel}</span> {bookingDetails.date}</p> : null}
                {bookingDetails.hotel ? <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">{copy.pickupLabel}</span> {bookingDetails.hotel}</p> : null}
              </div>
            ) : (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <Sparkles size={28} />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900">{copy.reservationAppearHeading}</h3>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  {copy.reservationAppearText}
                </p>
                {bookingError ? <p className="mt-4 text-sm text-rose-600">{bookingError}</p> : null}
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700">
                    {copy.browseTours} <ArrowRight size={16} />
                  </Link>
                  <Link href="/booking" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700">
                    {copy.manageBooking} <MessageCircle size={16} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <CalendarRange size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{copy.howItWorksEyebrow}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{copy.simpleCheckoutHeading}</h3>
                </div>
              </div>
              <ul className="mt-8 space-y-4">
                {copy.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-semibold text-cyan-700">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-700">{copy.whyChooseEyebrow}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{copy.secureEffortlessHeading}</h3>
                </div>
              </div>
              <div className="mt-8 grid gap-4">
                {copy.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <BadgeCheck className="shrink-0 text-cyan-700" size={18} />
                    <span className="text-sm font-medium text-slate-700">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-cyan-300">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">{copy.paymentOptionsEyebrow}</p>
                  <h3 className="text-2xl font-bold">{copy.bookNowPayArrivalHeading}</h3>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                {copy.paymentOptionsText}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
