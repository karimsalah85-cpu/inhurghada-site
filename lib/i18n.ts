export const locales = ["en", "ar", "de", "ru", "pl", "zh"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English", ar: "العربية", de: "Deutsch", ru: "Русский", pl: "Polski", zh: "简体中文",
};

export const localeOg: Record<Locale, string> = {
  en: "en_US", ar: "ar_EG", de: "de_DE", ru: "ru_RU", pl: "pl_PL", zh: "zh_CN",
};

export const isLocale = (value: string): value is Locale => locales.includes(value as Locale);

type Dictionary = {
  siteDescription: string; home: string; tours: string; transfers: string; booking: string; about: string;
  heroTitle: string; heroDescription: string; bookNow: string; popularTours: string; from: string; perPerson: string;
  whyTitle: string; whyText: string; cash: string; support: string; local: string;
  bookingTitle: string; bookingText: string; bookingCta: string;
  transfersTitle: string; transfersText: string;
  privacyTitle: string; privacyText: string; termsTitle: string; termsText: string; legalNotice: string;
  checkoutTitle: string; checkoutText: string; included: string; contact: string; backHome: string;
};

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    siteDescription: "Book trusted Hurghada boat trips, snorkeling, diving, desert safaris and private transfers with clear prices and local support.",
    home: "Home", tours: "Tours", transfers: "Transfers", booking: "Booking", about: "About",
    heroTitle: "Discover the best tours and excursions in Hurghada", heroDescription: "Island trips, snorkeling, scuba diving, desert safaris and private transfers with simple WhatsApp booking and cash payment on arrival.",
    bookNow: "Book now", popularTours: "Popular experiences", from: "From", perPerson: "per person",
    whyTitle: "Why book with Daily Red Sea?", whyText: "Clear prices, carefully selected local operators and responsive support before and during your trip.", cash: "Cash on arrival", support: "WhatsApp support", local: "Trusted local service",
    bookingTitle: "Book your Hurghada experience", bookingText: "Tell us which experience, date, hotel and group size you prefer. Our team will confirm availability and pickup details on WhatsApp.", bookingCta: "Start booking",
    transfersTitle: "Private transfers in Hurghada", transfersText: "Reliable airport, hotel and local transfers with private vehicles, clear prices and pickup confirmation.",
    privacyTitle: "Privacy policy", privacyText: "We collect only the contact, booking and payment-related information needed to provide your requested service, communicate with you and meet legal obligations. We do not sell personal information. Contact us to request access, correction or deletion where applicable.",
    termsTitle: "Terms and conditions", termsText: "Availability is confirmed after our team reviews your request. Prices, cancellation terms, pickup details and any operator requirements are confirmed before service. Customers must provide accurate information and follow safety instructions.",
    legalNotice: "The English version is the controlling legal text. Other language versions are provided for convenience.",
    checkoutTitle: "Complete your booking", checkoutText: "Choose an experience first, then provide your date, traveler and pickup details. You will receive confirmation by email or WhatsApp.", included: "What is included", contact: "Contact our team", backHome: "Back to home",
  },
  ar: {
    siteDescription: "احجز رحلات بحرية وسنوركلينج وغوص وسفاري صحراوي وتنقلات خاصة موثوقة في الغردقة بأسعار واضحة ودعم محلي.",
    home: "الرئيسية", tours: "الرحلات", transfers: "التنقلات", booking: "الحجز", about: "من نحن",
    heroTitle: "اكتشف أفضل الرحلات والأنشطة في الغردقة", heroDescription: "رحلات جزر وسنوركلينج وغوص وسفاري صحراوي وتنقلات خاصة مع حجز سهل عبر واتساب والدفع نقدًا عند الوصول.",
    bookNow: "احجز الآن", popularTours: "التجارب الأكثر شعبية", from: "ابتداءً من", perPerson: "للشخص",
    whyTitle: "لماذا تحجز مع ديلي رِد سي؟", whyText: "أسعار واضحة ومشغلون محليون مختارون بعناية ودعم سريع قبل الرحلة وأثناءها.", cash: "الدفع عند الوصول", support: "دعم عبر واتساب", local: "خدمة محلية موثوقة",
    bookingTitle: "احجز تجربتك في الغردقة", bookingText: "أخبرنا بالتجربة والتاريخ والفندق وعدد الأشخاص. سيؤكد فريقنا التوفر وتفاصيل الاستلام عبر واتساب.", bookingCta: "ابدأ الحجز",
    transfersTitle: "تنقلات خاصة في الغردقة", transfersText: "تنقلات موثوقة من وإلى المطار والفنادق وداخل الغردقة بسيارات خاصة وأسعار واضحة وتأكيد لموعد الاستلام.",
    privacyTitle: "سياسة الخصوصية", privacyText: "نجمع فقط بيانات الاتصال والحجز والدفع اللازمة لتقديم الخدمة المطلوبة والتواصل معك والوفاء بالالتزامات القانونية. لا نبيع البيانات الشخصية. يمكنك التواصل معنا لطلب الوصول إلى بياناتك أو تصحيحها أو حذفها حيثما ينطبق.",
    termsTitle: "الشروط والأحكام", termsText: "يتم تأكيد التوفر بعد مراجعة فريقنا لطلبك. نؤكد السعر وشروط الإلغاء وتفاصيل الاستلام ومتطلبات المشغل قبل الخدمة. يجب تقديم معلومات دقيقة واتباع تعليمات السلامة.",
    legalNotice: "النص الإنجليزي هو النص القانوني المعتمد. تُقدَّم الترجمات للتسهيل فقط.",
    checkoutTitle: "أكمل حجزك", checkoutText: "اختر التجربة أولًا ثم أدخل التاريخ وعدد المسافرين ومكان الاستلام. ستصلك رسالة التأكيد عبر البريد الإلكتروني أو واتساب.", included: "ما يشمله السعر", contact: "تواصل مع فريقنا", backHome: "العودة للرئيسية",
  },
  de: {
    siteDescription: "Buche zuverlässige Bootstouren, Schnorcheln, Tauchen, Wüstensafaris und private Transfers in Hurghada mit klaren Preisen und lokaler Betreuung.",
    home: "Startseite", tours: "Ausflüge", transfers: "Transfers", booking: "Buchung", about: "Über uns",
    heroTitle: "Entdecke die besten Touren und Ausflüge in Hurghada", heroDescription: "Inseltouren, Schnorcheln, Tauchen, Wüstensafaris und private Transfers mit einfacher WhatsApp-Buchung und Barzahlung bei Ankunft.",
    bookNow: "Jetzt buchen", popularTours: "Beliebte Erlebnisse", from: "Ab", perPerson: "pro Person",
    whyTitle: "Warum bei Daily Red Sea buchen?", whyText: "Klare Preise, sorgfältig ausgewählte lokale Anbieter und schnelle Betreuung vor und während deiner Reise.", cash: "Barzahlung bei Ankunft", support: "WhatsApp-Support", local: "Zuverlässiger lokaler Service",
    bookingTitle: "Buche dein Hurghada-Erlebnis", bookingText: "Nenne uns Erlebnis, Datum, Hotel und Gruppengröße. Unser Team bestätigt Verfügbarkeit und Abholung per WhatsApp.", bookingCta: "Buchung starten",
    transfersTitle: "Private Transfers in Hurghada", transfersText: "Zuverlässige Flughafen-, Hotel- und Ortsfahrten mit Privatfahrzeugen, klaren Preisen und bestätigter Abholung.",
    privacyTitle: "Datenschutzerklärung", privacyText: "Wir erheben nur Kontakt-, Buchungs- und Zahlungsdaten, die zur Leistungserbringung, Kommunikation und Erfüllung gesetzlicher Pflichten erforderlich sind. Wir verkaufen keine personenbezogenen Daten. Kontaktiere uns für Auskunft, Berichtigung oder Löschung, soweit anwendbar.",
    termsTitle: "Allgemeine Geschäftsbedingungen", termsText: "Die Verfügbarkeit wird nach Prüfung der Anfrage bestätigt. Preise, Stornierungsbedingungen, Abholung und Anforderungen des Veranstalters werden vor der Leistung bestätigt. Kunden müssen korrekte Angaben machen und Sicherheitshinweise befolgen.",
    legalNotice: "Die englische Fassung ist rechtlich maßgeblich. Übersetzungen dienen nur der Information.",
    checkoutTitle: "Buchung abschließen", checkoutText: "Wähle zuerst ein Erlebnis und gib dann Datum, Reisende und Abholort an. Die Bestätigung erhältst du per E-Mail oder WhatsApp.", included: "Enthalten", contact: "Unser Team kontaktieren", backHome: "Zur Startseite",
  },
  ru: {
    siteDescription: "Бронируйте морские прогулки, сноркелинг, дайвинг, сафари и частные трансферы в Хургаде с понятными ценами и местной поддержкой.",
    home: "Главная", tours: "Экскурсии", transfers: "Трансферы", booking: "Бронирование", about: "О нас",
    heroTitle: "Лучшие туры и экскурсии в Хургаде", heroDescription: "Островные поездки, сноркелинг, дайвинг, сафари и частные трансферы с простым бронированием в WhatsApp и оплатой наличными по прибытии.",
    bookNow: "Забронировать", popularTours: "Популярные впечатления", from: "От", perPerson: "за человека",
    whyTitle: "Почему Daily Red Sea?", whyText: "Понятные цены, тщательно выбранные местные организаторы и быстрая поддержка до и во время поездки.", cash: "Оплата по прибытии", support: "Поддержка в WhatsApp", local: "Надёжный местный сервис",
    bookingTitle: "Забронируйте отдых в Хургаде", bookingText: "Укажите экскурсию, дату, отель и размер группы. Команда подтвердит наличие мест и трансфер в WhatsApp.", bookingCta: "Начать бронирование",
    transfersTitle: "Частные трансферы в Хургаде", transfersText: "Надёжные поездки из аэропорта, отелей и по городу на частных автомобилях с понятной ценой и подтверждением встречи.",
    privacyTitle: "Политика конфиденциальности", privacyText: "Мы собираем только контактные, платёжные и связанные с бронированием данные, необходимые для оказания услуги, связи и выполнения закона. Мы не продаём личные данные. Обратитесь к нам для доступа, исправления или удаления данных, где это применимо.",
    termsTitle: "Условия использования", termsText: "Наличие мест подтверждается после проверки заявки. Цена, отмена, место встречи и требования организатора согласуются до услуги. Клиенты обязаны предоставить точные сведения и соблюдать правила безопасности.",
    legalNotice: "Юридически обязательной является английская версия. Переводы предоставлены для удобства.",
    checkoutTitle: "Завершите бронирование", checkoutText: "Сначала выберите экскурсию, затем укажите дату, путешественников и место встречи. Подтверждение придёт по электронной почте или в WhatsApp.", included: "Что включено", contact: "Связаться с командой", backHome: "На главную",
  },
  pl: {
    siteDescription: "Rezerwuj sprawdzone rejsy, snorkeling, nurkowanie, safari i prywatne transfery w Hurghadzie z jasnymi cenami i lokalnym wsparciem.",
    home: "Strona główna", tours: "Wycieczki", transfers: "Transfery", booking: "Rezerwacja", about: "O nas",
    heroTitle: "Najlepsze wycieczki i atrakcje w Hurghadzie", heroDescription: "Wyspy, snorkeling, nurkowanie, safari i prywatne transfery z łatwą rezerwacją przez WhatsApp i płatnością gotówką na miejscu.",
    bookNow: "Zarezerwuj", popularTours: "Popularne atrakcje", from: "Od", perPerson: "za osobę",
    whyTitle: "Dlaczego Daily Red Sea?", whyText: "Jasne ceny, starannie wybrani lokalni organizatorzy i szybkie wsparcie przed wyjazdem i w jego trakcie.", cash: "Płatność na miejscu", support: "Wsparcie WhatsApp", local: "Sprawdzona lokalna obsługa",
    bookingTitle: "Zarezerwuj atrakcję w Hurghadzie", bookingText: "Podaj atrakcję, datę, hotel i liczbę osób. Nasz zespół potwierdzi dostępność i odbiór przez WhatsApp.", bookingCta: "Rozpocznij rezerwację",
    transfersTitle: "Prywatne transfery w Hurghadzie", transfersText: "Niezawodne przejazdy z lotniska, hoteli i po mieście prywatnymi samochodami, z jasną ceną i potwierdzeniem odbioru.",
    privacyTitle: "Polityka prywatności", privacyText: "Zbieramy wyłącznie dane kontaktowe, rezerwacyjne i płatnicze potrzebne do realizacji usługi, komunikacji i obowiązków prawnych. Nie sprzedajemy danych osobowych. Skontaktuj się z nami w sprawie dostępu, poprawienia lub usunięcia danych, jeśli ma to zastosowanie.",
    termsTitle: "Regulamin", termsText: "Dostępność potwierdzamy po sprawdzeniu zgłoszenia. Cena, zasady anulowania, odbiór i wymagania organizatora są potwierdzane przed usługą. Klient musi podać prawidłowe dane i przestrzegać zasad bezpieczeństwa.",
    legalNotice: "Prawnie wiążąca jest wersja angielska. Tłumaczenia udostępniamy wyłącznie pomocniczo.",
    checkoutTitle: "Dokończ rezerwację", checkoutText: "Najpierw wybierz atrakcję, a następnie podaj datę, liczbę osób i miejsce odbioru. Potwierdzenie otrzymasz e-mailem lub przez WhatsApp.", included: "W cenie", contact: "Skontaktuj się z nami", backHome: "Powrót na stronę główną",
  },
  zh: {
    siteDescription: "预订值得信赖的赫尔格达游船、浮潜、深潜、沙漠探险和私人接送服务，价格透明并提供本地支持。",
    home: "首页", tours: "旅游项目", transfers: "接送服务", booking: "预订", about: "关于我们",
    heroTitle: "探索赫尔格达最佳旅游和体验", heroDescription: "海岛游、浮潜、深潜、沙漠探险和私人接送，支持 WhatsApp 轻松预订和抵达后现金付款。",
    bookNow: "立即预订", popularTours: "热门体验", from: "起价", perPerson: "每人",
    whyTitle: "为什么选择 Daily Red Sea？", whyText: "价格透明、精心挑选的本地运营商，以及行程前和行程中的快速支持。", cash: "抵达后付款", support: "WhatsApp 支持", local: "可靠的本地服务",
    bookingTitle: "预订您的赫尔格达体验", bookingText: "请告诉我们项目、日期、酒店和人数。团队将通过 WhatsApp 确认名额和接送详情。", bookingCta: "开始预订",
    transfersTitle: "赫尔格达私人接送", transfersText: "提供机场、酒店和市内私人用车服务，价格透明并确认接送信息。",
    privacyTitle: "隐私政策", privacyText: "我们仅收集提供服务、与您沟通及履行法律义务所需的联系方式、预订和付款相关信息。我们不会出售个人信息。在适用情况下，您可以联系我们申请访问、更正或删除数据。",
    termsTitle: "条款与条件", termsText: "团队审核请求后确认名额。价格、取消条件、接送详情及运营商要求将在服务前确认。客户须提供准确信息并遵守安全指示。",
    legalNotice: "英文版本为具有法律效力的文本。其他语言版本仅为方便阅读。",
    checkoutTitle: "完成预订", checkoutText: "请先选择体验，然后填写日期、出行人数和接送地点。确认信息将通过电子邮件或 WhatsApp 发送。", included: "费用包含", contact: "联系我们的团队", backHome: "返回首页",
  },
};

export function localePath(locale: Locale, path = "") {
  const normalized = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return locale === "en" ? normalized || "/" : `/${locale}${normalized}`;
}

export function languageAlternates(path = "") {
  return Object.fromEntries(locales.map((locale) => [locale, localePath(locale, path)]));
}
