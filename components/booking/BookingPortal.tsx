"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarRange, CheckCircle2, Clock3, MessageCircle, ShieldCheck, Smartphone, Ticket } from "lucide-react";
import type { BookingRecord } from "@/lib/booking-service";
import { trackEvent } from "@/lib/analytics";
import { contactEmail, displayPhoneNumber, whatsappNumber, whatsappUrl } from "@/lib/contact";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";
import type { Language } from "@/components/settings/SiteSettingsContext";

type Action = { title: string; description: string };
type Faq = { question: string; answer: string };

type Copy = {
  eyebrow: string;
  heroTitle: string;
  heroText: string;
  secureBadge: string;
  supportBadge: string;
  findHeading: string;
  findText: string;
  refLabel: string;
  emailLabel: string;
  searching: string;
  findButton: string;
  helperText: string;
  validationError: string;
  notFoundError: string;
  successMessage: (reference: string) => string;
  serviceError: string;
  bookingDetailsHeading: string;
  referenceLabel: string;
  guestLabel: string;
  phoneLabel: string;
  statusLabel: string;
  dateLabel: string;
  pickupLabel: string;
  assignedLabel: (role: string) => string;
  guideLabel: string;
  driverLabel: string;
  guideOrDriverFallback: string;
  needHelpEyebrow: string;
  talkToTeamHeading: string;
  whatsappSupport: string;
  fastestReply: string;
  emailUs: string;
  callUs: string;
  whatYouCanDoEyebrow: string;
  everythingHeading: string;
  actions: Action[];
  secureSimpleEyebrow: string;
  infoProtectedHeading: string;
  infoProtectedText: string;
  encryptedBadge: string;
  faqEyebrow: string;
  faqs: Faq[];
  footerHome: string;
  footerTransfers: string;
  footerBookingPortal: string;
};

const COPY: Record<Language, Copy> = {
  en: {
    eyebrow: "Official booking portal",
    heroTitle: "Manage your booking with confidence",
    heroText: "Find your reservation, review pickup details, download your voucher, and keep every part of your trip in one place.",
    secureBadge: "Secure reservation access",
    supportBadge: "24/7 assistance",
    findHeading: "Find my booking",
    findText: "Enter your booking reference and booking email. Requiring both protects your personal trip details.",
    refLabel: "Booking reference",
    emailLabel: "Email address",
    searching: "Searching...",
    findButton: "Find my booking",
    helperText: "Enter just one value — your reference or your email address.",
    validationError: "Enter both your booking reference and the email used for the booking.",
    notFoundError: "We could not find that booking.",
    successMessage: (reference) => `Booking ${reference} is ready to review.`,
    serviceError: "We could not reach the booking service right now. Please try again shortly.",
    bookingDetailsHeading: "Booking details",
    referenceLabel: "Reference:",
    guestLabel: "Guest:",
    phoneLabel: "Phone:",
    statusLabel: "Status:",
    dateLabel: "Date:",
    pickupLabel: "Pickup:",
    assignedLabel: (role) => `Assigned ${role}:`,
    guideLabel: "guide",
    driverLabel: "driver",
    guideOrDriverFallback: "guide/driver",
    needHelpEyebrow: "Need help?",
    talkToTeamHeading: "Talk to our travel team",
    whatsappSupport: "WhatsApp support",
    fastestReply: "Fastest reply",
    emailUs: "Email us",
    callUs: "Call us",
    whatYouCanDoEyebrow: "What you can do here",
    everythingHeading: "Everything you need to manage your trip in one place",
    actions: [
      { title: "View booking", description: "See every reservation detail, including pickup time and traveler count." },
      { title: "Download voucher", description: "Access your printable confirmation and QR voucher instantly." },
      { title: "Cancel or change", description: "Update your date, pickup point, or group size with simple support." },
    ],
    secureSimpleEyebrow: "Secure and simple",
    infoProtectedHeading: "Your booking information stays protected",
    infoProtectedText: "Only customers with the correct booking reference and matching email address can access reservation details. Your information is handled with care and translated into a clear trip overview.",
    encryptedBadge: "Encrypted connection and private access",
    faqEyebrow: "Frequently asked questions",
    faqs: [
      { question: "How do I find my booking number?", answer: "Your confirmation email and WhatsApp message both include your booking reference, usually formatted as EG-2026-01425." },
      { question: "Can I modify my reservation?", answer: "Yes. You can change the pickup point, date, or travelers through your booking profile or by contacting our team." },
      { question: "What if I forgot the email used during booking?", answer: "Send us your WhatsApp number and we can help locate the booking securely and quickly." },
    ],
    footerHome: "Home",
    footerTransfers: "Transfers",
    footerBookingPortal: "Booking portal",
  },
  ar: {
    eyebrow: "بوابة الحجز الرسمية",
    heroTitle: "أدر حجزك بثقة تامة",
    heroText: "ابحث عن حجزك، وراجع تفاصيل الاستلام، وحمّل قسيمتك، واحتفظ بكل تفاصيل رحلتك في مكان واحد.",
    secureBadge: "وصول آمن لبيانات الحجز",
    supportBadge: "دعم على مدار الساعة",
    findHeading: "ابحث عن حجزي",
    findText: "أدخل رقم الحجز والبريد الإلكتروني المستخدم في الحجز. طلب الاثنين معًا يحمي بيانات رحلتك الشخصية.",
    refLabel: "رقم الحجز",
    emailLabel: "البريد الإلكتروني",
    searching: "جارٍ البحث...",
    findButton: "ابحث عن حجزي",
    helperText: "أدخل قيمة واحدة فقط — رقم الحجز أو بريدك الإلكتروني.",
    validationError: "أدخل رقم الحجز والبريد الإلكتروني المستخدم عند الحجز معًا.",
    notFoundError: "لم نتمكن من العثور على هذا الحجز.",
    successMessage: (reference) => `الحجز رقم ${reference} جاهز للمراجعة.`,
    serviceError: "تعذّر الوصول إلى خدمة الحجوزات حاليًا. يُرجى المحاولة مرة أخرى بعد قليل.",
    bookingDetailsHeading: "تفاصيل الحجز",
    referenceLabel: "رقم الحجز:",
    guestLabel: "الضيف:",
    phoneLabel: "الهاتف:",
    statusLabel: "الحالة:",
    dateLabel: "التاريخ:",
    pickupLabel: "الاستلام:",
    assignedLabel: (role) => `المسؤول (${role}):`,
    guideLabel: "مرشد",
    driverLabel: "سائق",
    guideOrDriverFallback: "مرشد/سائق",
    needHelpEyebrow: "تحتاج مساعدة؟",
    talkToTeamHeading: "تحدث مع فريق السفر لدينا",
    whatsappSupport: "الدعم عبر واتساب",
    fastestReply: "أسرع رد",
    emailUs: "راسلنا عبر البريد الإلكتروني",
    callUs: "اتصل بنا",
    whatYouCanDoEyebrow: "ما يمكنك فعله هنا",
    everythingHeading: "كل ما تحتاجه لإدارة رحلتك في مكان واحد",
    actions: [
      { title: "عرض الحجز", description: "اطّلع على كل تفاصيل حجزك، بما في ذلك وقت الاستلام وعدد المسافرين." },
      { title: "تنزيل القسيمة", description: "احصل على تأكيدك القابل للطباعة ورمز QR فورًا." },
      { title: "الإلغاء أو التعديل", description: "عدّل التاريخ أو نقطة الاستلام أو عدد أفراد المجموعة بدعم بسيط." },
    ],
    secureSimpleEyebrow: "آمن وبسيط",
    infoProtectedHeading: "بيانات حجزك محمية دائمًا",
    infoProtectedText: "لا يمكن الوصول إلى تفاصيل الحجز إلا للعملاء الذين يمتلكون رقم الحجز الصحيح والبريد الإلكتروني المطابق. نتعامل مع بياناتك بعناية ونعرضها في ملخص واضح لرحلتك.",
    encryptedBadge: "اتصال مشفّر ووصول خاص",
    faqEyebrow: "الأسئلة الشائعة",
    faqs: [
      { question: "كيف أجد رقم حجزي؟", answer: "يتضمن كل من بريد التأكيد الإلكتروني ورسالة واتساب رقم حجزك، وغالبًا ما يكون بالصيغة EG-2026-01425." },
      { question: "هل يمكنني تعديل حجزي؟", answer: "نعم، يمكنك تغيير نقطة الاستلام أو التاريخ أو عدد المسافرين من خلال ملف حجزك أو بالتواصل مع فريقنا." },
      { question: "ماذا لو نسيت البريد الإلكتروني المستخدم في الحجز؟", answer: "أرسل لنا رقم واتساب الخاص بك، وسنساعدك في العثور على حجزك بأمان وسرعة." },
    ],
    footerHome: "الرئيسية",
    footerTransfers: "التنقلات",
    footerBookingPortal: "بوابة الحجز",
  },
  de: {
    eyebrow: "Offizielles Buchungsportal",
    heroTitle: "Verwalte deine Buchung mit Sicherheit",
    heroText: "Finde deine Reservierung, überprüfe die Abholdetails, lade deinen Gutschein herunter und behalte jeden Teil deiner Reise an einem Ort.",
    secureBadge: "Sicherer Zugriff auf deine Reservierung",
    supportBadge: "24/7-Unterstützung",
    findHeading: "Buchung finden",
    findText: "Gib deine Buchungsnummer und die bei der Buchung verwendete E-Mail-Adresse ein. Beide Angaben schützen deine persönlichen Reisedaten.",
    refLabel: "Buchungsnummer",
    emailLabel: "E-Mail-Adresse",
    searching: "Suche läuft...",
    findButton: "Buchung finden",
    helperText: "Gib nur einen Wert ein — deine Buchungsnummer oder deine E-Mail-Adresse.",
    validationError: "Gib sowohl deine Buchungsnummer als auch die bei der Buchung verwendete E-Mail-Adresse ein.",
    notFoundError: "Wir konnten diese Buchung nicht finden.",
    successMessage: (reference) => `Buchung ${reference} ist bereit zur Ansicht.`,
    serviceError: "Der Buchungsservice ist gerade nicht erreichbar. Bitte versuche es in Kürze erneut.",
    bookingDetailsHeading: "Buchungsdetails",
    referenceLabel: "Buchungsnummer:",
    guestLabel: "Gast:",
    phoneLabel: "Telefon:",
    statusLabel: "Status:",
    dateLabel: "Datum:",
    pickupLabel: "Abholung:",
    assignedLabel: (role) => `Zugewiesener ${role}:`,
    guideLabel: "Guide",
    driverLabel: "Fahrer",
    guideOrDriverFallback: "Guide/Fahrer",
    needHelpEyebrow: "Brauchst du Hilfe?",
    talkToTeamHeading: "Sprich mit unserem Reiseteam",
    whatsappSupport: "WhatsApp-Support",
    fastestReply: "Schnellste Antwort",
    emailUs: "Schreib uns eine E-Mail",
    callUs: "Ruf uns an",
    whatYouCanDoEyebrow: "Das kannst du hier tun",
    everythingHeading: "Alles, was du für die Verwaltung deiner Reise brauchst — an einem Ort",
    actions: [
      { title: "Buchung ansehen", description: "Sieh alle Reservierungsdetails, einschließlich Abholzeit und Anzahl der Reisenden." },
      { title: "Gutschein herunterladen", description: "Greife sofort auf deine druckbare Bestätigung und deinen QR-Gutschein zu." },
      { title: "Stornieren oder ändern", description: "Aktualisiere Datum, Abholort oder Gruppengröße mit unkompliziertem Support." },
    ],
    secureSimpleEyebrow: "Sicher und einfach",
    infoProtectedHeading: "Deine Buchungsdaten bleiben geschützt",
    infoProtectedText: "Nur Kunden mit der richtigen Buchungsnummer und der passenden E-Mail-Adresse können auf Reservierungsdetails zugreifen. Deine Daten werden sorgfältig behandelt und übersichtlich dargestellt.",
    encryptedBadge: "Verschlüsselte Verbindung und privater Zugriff",
    faqEyebrow: "Häufig gestellte Fragen",
    faqs: [
      { question: "Wie finde ich meine Buchungsnummer?", answer: "Sowohl deine Bestätigungs-E-Mail als auch die WhatsApp-Nachricht enthalten deine Buchungsnummer, meist im Format EG-2026-01425." },
      { question: "Kann ich meine Reservierung ändern?", answer: "Ja. Du kannst Abholort, Datum oder Reisende über dein Buchungsprofil oder durch Kontaktaufnahme mit unserem Team ändern." },
      { question: "Was, wenn ich die bei der Buchung verwendete E-Mail-Adresse vergessen habe?", answer: "Schick uns deine WhatsApp-Nummer, und wir helfen dir, deine Buchung sicher und schnell zu finden." },
    ],
    footerHome: "Startseite",
    footerTransfers: "Transfers",
    footerBookingPortal: "Buchungsportal",
  },
  ru: {
    eyebrow: "Официальный портал бронирования",
    heroTitle: "Управляйте своим бронированием с уверенностью",
    heroText: "Найдите своё бронирование, проверьте детали трансфера, скачайте ваучер и держите всю информацию о поездке в одном месте.",
    secureBadge: "Безопасный доступ к бронированию",
    supportBadge: "Поддержка 24/7",
    findHeading: "Найти моё бронирование",
    findText: "Введите номер бронирования и адрес электронной почты, указанный при бронировании. Оба значения защищают ваши личные данные о поездке.",
    refLabel: "Номер бронирования",
    emailLabel: "Адрес электронной почты",
    searching: "Идёт поиск...",
    findButton: "Найти моё бронирование",
    helperText: "Введите только одно значение — номер бронирования или адрес электронной почты.",
    validationError: "Введите и номер бронирования, и электронную почту, указанную при бронировании.",
    notFoundError: "Не удалось найти это бронирование.",
    successMessage: (reference) => `Бронирование ${reference} готово к просмотру.`,
    serviceError: "Не удалось подключиться к сервису бронирования. Пожалуйста, попробуйте снова через некоторое время.",
    bookingDetailsHeading: "Детали бронирования",
    referenceLabel: "Номер:",
    guestLabel: "Гость:",
    phoneLabel: "Телефон:",
    statusLabel: "Статус:",
    dateLabel: "Дата:",
    pickupLabel: "Трансфер:",
    assignedLabel: (role) => `Назначенный ${role}:`,
    guideLabel: "гид",
    driverLabel: "водитель",
    guideOrDriverFallback: "гид/водитель",
    needHelpEyebrow: "Нужна помощь?",
    talkToTeamHeading: "Свяжитесь с нашей командой",
    whatsappSupport: "Поддержка в WhatsApp",
    fastestReply: "Самый быстрый ответ",
    emailUs: "Напишите нам на почту",
    callUs: "Позвоните нам",
    whatYouCanDoEyebrow: "Что вы можете сделать здесь",
    everythingHeading: "Всё необходимое для управления поездкой в одном месте",
    actions: [
      { title: "Просмотр бронирования", description: "Смотрите все детали бронирования, включая время трансфера и количество путешественников." },
      { title: "Скачать ваучер", description: "Мгновенный доступ к вашему подтверждению для печати и QR-ваучеру." },
      { title: "Отмена или изменение", description: "Измените дату, место встречи или размер группы с простой поддержкой." },
    ],
    secureSimpleEyebrow: "Безопасно и просто",
    infoProtectedHeading: "Ваши данные о бронировании надёжно защищены",
    infoProtectedText: "Доступ к деталям бронирования есть только у клиентов с верным номером бронирования и совпадающим адресом электронной почты. Мы бережно обрабатываем ваши данные и представляем их в понятном обзоре поездки.",
    encryptedBadge: "Зашифрованное соединение и приватный доступ",
    faqEyebrow: "Часто задаваемые вопросы",
    faqs: [
      { question: "Как найти номер моего бронирования?", answer: "Номер бронирования указан как в письме-подтверждении, так и в сообщении WhatsApp, обычно в формате EG-2026-01425." },
      { question: "Могу ли я изменить своё бронирование?", answer: "Да. Вы можете изменить место встречи, дату или количество путешественников через профиль бронирования или связавшись с нашей командой." },
      { question: "Что делать, если я забыл(а) электронную почту, указанную при бронировании?", answer: "Отправьте нам свой номер WhatsApp, и мы поможем безопасно и быстро найти ваше бронирование." },
    ],
    footerHome: "Главная",
    footerTransfers: "Трансферы",
    footerBookingPortal: "Портал бронирования",
  },
  pl: {
    eyebrow: "Oficjalny portal rezerwacji",
    heroTitle: "Zarządzaj swoją rezerwacją z pewnością",
    heroText: "Znajdź swoją rezerwację, sprawdź szczegóły odbioru, pobierz swój voucher i miej wszystkie informacje o podróży w jednym miejscu.",
    secureBadge: "Bezpieczny dostęp do rezerwacji",
    supportBadge: "Wsparcie 24/7",
    findHeading: "Znajdź moją rezerwację",
    findText: "Podaj numer rezerwacji i adres e-mail użyty przy rezerwacji. Wymaganie obu wartości chroni Twoje dane osobowe.",
    refLabel: "Numer rezerwacji",
    emailLabel: "Adres e-mail",
    searching: "Wyszukiwanie...",
    findButton: "Znajdź moją rezerwację",
    helperText: "Podaj tylko jedną wartość — numer rezerwacji lub adres e-mail.",
    validationError: "Podaj zarówno numer rezerwacji, jak i adres e-mail użyty przy rezerwacji.",
    notFoundError: "Nie udało się znaleźć tej rezerwacji.",
    successMessage: (reference) => `Rezerwacja ${reference} jest gotowa do przeglądu.`,
    serviceError: "Nie udało się połączyć z serwisem rezerwacji. Spróbuj ponownie za chwilę.",
    bookingDetailsHeading: "Szczegóły rezerwacji",
    referenceLabel: "Numer:",
    guestLabel: "Gość:",
    phoneLabel: "Telefon:",
    statusLabel: "Status:",
    dateLabel: "Data:",
    pickupLabel: "Odbiór:",
    assignedLabel: (role) => `Przypisany ${role}:`,
    guideLabel: "przewodnik",
    driverLabel: "kierowca",
    guideOrDriverFallback: "przewodnik/kierowca",
    needHelpEyebrow: "Potrzebujesz pomocy?",
    talkToTeamHeading: "Porozmawiaj z naszym zespołem podróży",
    whatsappSupport: "Wsparcie na WhatsApp",
    fastestReply: "Najszybsza odpowiedź",
    emailUs: "Napisz do nas e-mail",
    callUs: "Zadzwoń do nas",
    whatYouCanDoEyebrow: "Co możesz tu zrobić",
    everythingHeading: "Wszystko, czego potrzebujesz do zarządzania podróżą, w jednym miejscu",
    actions: [
      { title: "Zobacz rezerwację", description: "Zobacz każdy szczegół rezerwacji, w tym godzinę odbioru i liczbę uczestników." },
      { title: "Pobierz voucher", description: "Natychmiastowy dostęp do potwierdzenia do druku i vouchera z kodem QR." },
      { title: "Anuluj lub zmień", description: "Zaktualizuj datę, miejsce odbioru lub liczbę osób dzięki prostemu wsparciu." },
    ],
    secureSimpleEyebrow: "Bezpiecznie i prosto",
    infoProtectedHeading: "Twoje dane rezerwacji pozostają chronione",
    infoProtectedText: "Tylko klienci z poprawnym numerem rezerwacji i zgodnym adresem e-mail mają dostęp do szczegółów rezerwacji. Twoje dane są traktowane z troską i przedstawione w przejrzystym podsumowaniu podróży.",
    encryptedBadge: "Szyfrowane połączenie i prywatny dostęp",
    faqEyebrow: "Najczęściej zadawane pytania",
    faqs: [
      { question: "Jak znaleźć numer mojej rezerwacji?", answer: "Zarówno e-mail potwierdzający, jak i wiadomość WhatsApp zawierają numer rezerwacji, zwykle w formacie EG-2026-01425." },
      { question: "Czy mogę zmienić swoją rezerwację?", answer: "Tak. Możesz zmienić miejsce odbioru, datę lub liczbę uczestników w profilu rezerwacji lub kontaktując się z naszym zespołem." },
      { question: "Co zrobić, jeśli zapomniałem(am) adresu e-mail użytego przy rezerwacji?", answer: "Wyślij nam swój numer WhatsApp, a pomożemy szybko i bezpiecznie odnaleźć Twoją rezerwację." },
    ],
    footerHome: "Strona główna",
    footerTransfers: "Transfery",
    footerBookingPortal: "Portal rezerwacji",
  },
  zh: {
    eyebrow: "官方预订门户",
    heroTitle: "轻松管理您的预订",
    heroText: "查找您的预订，查看接送详情，下载凭证，并将行程的所有信息集中管理。",
    secureBadge: "安全的预订访问",
    supportBadge: "24/7 全天候支持",
    findHeading: "查找我的预订",
    findText: "请输入您的预订编号和预订时使用的邮箱地址。同时提供两项信息可保护您的行程隐私。",
    refLabel: "预订编号",
    emailLabel: "电子邮箱",
    searching: "搜索中...",
    findButton: "查找我的预订",
    helperText: "只需填写其中一项——您的预订编号或邮箱地址。",
    validationError: "请同时填写您的预订编号和预订时使用的邮箱地址。",
    notFoundError: "未能找到该预订。",
    successMessage: (reference) => `预订 ${reference} 已准备好供您查看。`,
    serviceError: "目前无法连接预订服务，请稍后再试。",
    bookingDetailsHeading: "预订详情",
    referenceLabel: "预订编号：",
    guestLabel: "客人：",
    phoneLabel: "电话：",
    statusLabel: "状态：",
    dateLabel: "日期：",
    pickupLabel: "接送：",
    assignedLabel: (role) => `已指派${role}：`,
    guideLabel: "导游",
    driverLabel: "司机",
    guideOrDriverFallback: "导游/司机",
    needHelpEyebrow: "需要帮助？",
    talkToTeamHeading: "联系我们的旅行团队",
    whatsappSupport: "WhatsApp 支持",
    fastestReply: "回复最快",
    emailUs: "给我们发邮件",
    callUs: "致电我们",
    whatYouCanDoEyebrow: "您可以在这里做什么",
    everythingHeading: "管理行程所需的一切，尽在此处",
    actions: [
      { title: "查看预订", description: "查看每一项预订详情，包括接送时间和旅客人数。" },
      { title: "下载凭证", description: "即时获取可打印的确认单和二维码凭证。" },
      { title: "取消或变更", description: "轻松获得支持，更新日期、接送地点或团队人数。" },
    ],
    secureSimpleEyebrow: "安全又简单",
    infoProtectedHeading: "您的预订信息始终受到保护",
    infoProtectedText: "只有提供正确预订编号并匹配邮箱地址的客户才能查看预订详情。我们会谨慎处理您的信息，并以清晰的行程概览呈现。",
    encryptedBadge: "加密连接与隐私保护访问",
    faqEyebrow: "常见问题",
    faqs: [
      { question: "如何查找我的预订编号？", answer: "确认邮件和 WhatsApp 消息中都包含您的预订编号，格式通常为 EG-2026-01425。" },
      { question: "我可以修改我的预订吗？", answer: "可以。您可以通过预订资料或联系我们的团队来更改接送地点、日期或旅客人数。" },
      { question: "如果我忘记了预订时使用的邮箱怎么办？", answer: "请将您的 WhatsApp 号码发送给我们，我们可以安全快速地帮您找到预订。" },
    ],
    footerHome: "首页",
    footerTransfers: "接送服务",
    footerBookingPortal: "预订门户",
  },
};

export default function BookingPortal() {
  const { language } = useSiteSettings();
  const copy = COPY[language];

  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reference.trim() || !email.trim()) {
      setStatus(copy.validationError);
      setBooking(null);
      return;
    }

    setIsLoading(true);
    setStatus(null);
    setBooking(null);

    try {
      const query = `reference=${encodeURIComponent(reference.trim())}&email=${encodeURIComponent(email.trim())}`;
      const response = await fetch(`/api/bookings?${query}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus(data.error || copy.notFoundError);
        return;
      }

      setBooking(data.booking);
      setStatus(copy.successMessage(data.booking.reference));
    } catch {
      setStatus(copy.serviceError);
    } finally {
      setIsLoading(false);
    }
  }

  const assignedRoleLabel = booking?.assignedPersonRole === "guide"
    ? copy.guideLabel
    : booking?.assignedPersonRole === "driver"
      ? copy.driverLabel
      : copy.guideOrDriverFallback;

  return (
    <main dir={language === "ar" ? "rtl" : "ltr"} className="bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[url('/images/placeholders/sea-activity.svg')] bg-cover bg-center opacity-35" />
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">{copy.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-200">
              {copy.heroText}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
                <ShieldCheck size={16} className="text-cyan-300" /> {copy.secureBadge}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
                <Clock3 size={16} className="text-cyan-300" /> {copy.supportBadge}
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
              <h2 className="text-2xl font-bold">{copy.findHeading}</h2>
              <p className="mt-3 text-slate-300">
                {copy.findText}
              </p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <label className="block text-sm font-medium text-slate-200">
                  {copy.refLabel}
                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="DRS-20260722-A1B2C3"
                    required
                    className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-200">
                  {copy.emailLabel}
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70">
                  <Ticket size={18} /> {isLoading ? copy.searching : copy.findButton}
                </button>
                <p className="text-sm text-slate-300">{copy.helperText}</p>
              </form>
              {status ? (
                <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                  {status}
                </div>
              ) : null}

              {booking ? (
                <div className="mt-5 rounded-2xl border border-white/20 bg-slate-950/40 p-4 text-sm text-slate-100">
                  <p className="font-semibold text-white">{copy.bookingDetailsHeading}</p>
                  <div className="mt-3 space-y-2">
                    <p><span className="text-slate-400">{copy.referenceLabel}</span> {booking.reference}</p>
                    <p><span className="text-slate-400">{copy.guestLabel}</span> {booking.customerName}</p>
                    <p><span className="text-slate-400">{copy.phoneLabel}</span> {booking.phone}</p>
                    <p><span className="text-slate-400">{copy.statusLabel}</span> {booking.status}</p>
                    {booking.date ? <p><span className="text-slate-400">{copy.dateLabel}</span> {booking.date}</p> : null}
                    {booking.hotel ? <p><span className="text-slate-400">{copy.pickupLabel}</span> {booking.hotel}</p> : null}
                    {booking.assignedPersonName ? <p><span className="text-slate-400">{copy.assignedLabel(assignedRoleLabel)}</span> {booking.assignedPersonName}</p> : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">{copy.needHelpEyebrow}</p>
                  <h2 className="text-2xl font-bold">{copy.talkToTeamHeading}</h2>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <a href={whatsappUrl("Hi Daily Red Sea, I need help with my booking")} onClick={() => trackEvent("whatsapp_click", { placement: "booking_portal" })} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-cyan-400">
                  <span className="flex items-center gap-3 font-semibold text-slate-900"><MessageCircle className="text-green-600" /> {copy.whatsappSupport}</span>
                  <span className="text-sm text-slate-500">{copy.fastestReply}</span>
                </a>
                <a href={`mailto:${contactEmail}`} onClick={() => trackEvent("email_click", { placement: "booking_portal" })} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-cyan-400">
                  <span className="flex items-center gap-3 font-semibold text-slate-900"><CalendarRange className="text-cyan-700" /> {copy.emailUs}</span>
                  <span className="text-sm text-slate-500">{contactEmail}</span>
                </a>
                <a href={`tel:+${whatsappNumber}`} onClick={() => trackEvent("phone_click", { placement: "booking_portal" })} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-cyan-400"><span className="flex items-center gap-3 font-semibold text-slate-900"><Smartphone className="text-cyan-700" /> {copy.callUs}</span><span className="text-sm text-slate-500">{displayPhoneNumber}</span></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{copy.whatYouCanDoEyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{copy.everythingHeading}</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {copy.actions.map((action) => (
              <div key={action.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{action.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{action.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{copy.secureSimpleEyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{copy.infoProtectedHeading}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {copy.infoProtectedText}
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <ShieldCheck className="text-cyan-700" /> {copy.encryptedBadge}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{copy.faqEyebrow}</p>
            <div className="mt-6 space-y-4">
              {copy.faqs.map((faq) => (
                <details key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer font-semibold text-slate-900">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
          <Link href="/" className="font-semibold text-cyan-700">{copy.footerHome}</Link>
          <span>•</span>
          <Link href="/transfers" className="font-semibold text-cyan-700">{copy.footerTransfers}</Link>
          <span>•</span>
          <Link href="/booking" className="font-semibold text-cyan-700">{copy.footerBookingPortal}</Link>
        </div>
      </footer>
    </main>
  );
}
