import type { Tour } from "@/data/tours";
import type { Locale } from "@/lib/i18n";

type Copy = Partial<Tour>;

const pickup = {
  ar: "يشمل الاستلام من فنادق مؤهلة في منطقة مرسى علم. نؤكد الوقت الدقيق وأي رسوم للمناطق البعيدة بعد استلام موقع الفندق.",
  de: "Die Abholung ist von berechtigten Hotels im Raum Marsa Alam enthalten. Genaue Zeit und mögliche Fernzuschläge werden nach Angabe des Hotels bestätigt.",
  ru: "Трансфер включён из подходящих отелей района Марса-Алам. Точное время и возможная доплата за удалённую зону подтверждаются после получения адреса отеля.",
  pl: "Odbiór obejmuje kwalifikujące się hotele w rejonie Marsa Alam. Dokładną godzinę i ewentualną dopłatę za odległą strefę potwierdzimy po podaniu hotelu.",
  zh: "接送仅包含符合条件的马萨阿拉姆地区酒店。提供酒店位置后，我们会确认准确时间及偏远地区附加费。",
};

const common = {
  ar: { location: "مرسى علم، مصر", category: "سنوركلينج", packageLabel: "للشخص", ageBands: { adults: "سعر البالغ — حد العمر بانتظار التأكيد", children: "سعر الطفل — حد العمر بانتظار التأكيد", infants: "لم يتم تأكيد سعر للرضع" } },
  de: { location: "Marsa Alam, Ägypten", category: "Schnorcheln", packageLabel: "pro Person", ageBands: { adults: "Erwachsenenpreis – Altersgrenze noch zu bestätigen", children: "Kinderpreis – Altersgrenze noch zu bestätigen", infants: "Kein Kleinkindpreis bestätigt" } },
  ru: { location: "Марса-Алам, Египет", category: "Сноркелинг", packageLabel: "за человека", ageBands: { adults: "Цена для взрослых — возрастная граница уточняется", children: "Цена для детей — возрастная граница уточняется", infants: "Цена для младенцев не подтверждена" } },
  pl: { location: "Marsa Alam, Egipt", category: "Snorkeling", packageLabel: "za osobę", ageBands: { adults: "Cena dla dorosłych — granica wieku do potwierdzenia", children: "Cena dla dzieci — granica wieku do potwierdzenia", infants: "Brak potwierdzonej ceny dla niemowląt" } },
  zh: { location: "埃及马萨阿拉姆", category: "浮潜", packageLabel: "每人", ageBands: { adults: "成人价格——年龄界限待确认", children: "儿童价格——年龄界限待确认", infants: "婴儿价格尚未确认" } },
} satisfies Record<Exclude<Locale, "en">, Copy>;

const translations: Record<Exclude<Locale, "en">, Record<string, Copy>> = {
  ar: {
    "dolphin-house-marsa-alam": { title: "رحلة سنوركلينج ليوم كامل إلى دولفين هاوس من مرسى علم", duration: "يوم كامل", description: "رحلة قارب من مارينا مرسى علم إلى منطقة دولفين هاوس مع جلستي سنوركلينج وغداء. مشاهدة الدلافين ودخول المياه غير مضمونين ويعتمدان على سلوك الحياة البرية وحالة البحر وتعليمات السلامة.", highlights: ["الاثنين والجمعة", "جلستا سنوركلينج", "غداء على القارب", "موطن معروف للدلافين دون ضمان المشاهدة"], included: ["توصيل من الفنادق المؤهلة", "رحلة القارب", "جلستا سنوركلينج", "الغداء"], notIncluded: ["المصاريف الشخصية", "معدات لم يتم تأكيدها", "رسوم المناطق البعيدة إن وجدت"], notes: [pickup.ar, "يمنع لمس الحيوانات أو مطاردتها أو إطعامها أو محاصرتها.", "يغلق الحجز الساعة 18:00 بتوقيت القاهرة في اليوم السابق؛ هذا الوقت يحتاج إلى تأكيد تشغيلي.", "يجب تأكيد الفئة العمرية للأطفال قبل التفعيل."], itinerary: ["الاستلام نحو 07:00", "الوصول إلى المارينا نحو 08:00", "إبحار القارب نحو 08:30", "نحو ساعة إلى دولفين هاوس", "جلسة سنوركلينج أولى", "الغداء", "جلسة ثانية", "العودة إلى المارينا نحو 16:00 ثم الفندق"], faqs: [{ question: "هل مشاهدة الدلافين مضمونة؟", answer: "لا، تعتمد المشاهدة ودخول المياه على سلوك الدلافين وحالة البحر والسلامة." }], seoTitle: "رحلة دولفين هاوس من مرسى علم", metaDescription: "راجع رحلة دولفين هاوس يومي الاثنين والجمعة من مرسى علم مع جلستي سنوركلينج وغداء وتوصيل مؤهل، دون ضمان مشاهدة الدلافين." },
    "marsa-mubarak-snorkeling": { title: "رحلة سنوركلينج ليوم كامل إلى مرسى مبارك من مرسى علم", duration: "يوم كامل", description: "رحلة قارب من مارينا بورت غالب إلى مرسى مبارك مع جلستي سنوركلينج وغداء. مشاهدة السلاحف أو الأطوم أو غيرها من الحيوانات غير مضمونة.", highlights: ["يومياً عدا الاثنين والجمعة", "جلستا سنوركلينج", "الغداء ورسوم الدخول", "الإبحار من بورت غالب"], included: ["توصيل من الفنادق المؤهلة", "القارب", "جلستا سنوركلينج", "الغداء", "رسوم الدخول"], notIncluded: ["المصاريف الشخصية", "معدات لم يتم تأكيدها", "رسوم المناطق البعيدة إن وجدت"], notes: [pickup.ar, "مشاهدة الحياة البرية تعتمد على الظروف الطبيعية.", "موعد إغلاق الحجز لم يتم توفيره ويجب تأكيده.", "يجب تأكيد الفئة العمرية للأطفال."], itinerary: ["الاستلام نحو 07:00", "الوصول إلى بورت غالب نحو 08:00", "الإبحار نحو 08:30", "نحو ساعة إلى مرسى مبارك", "سنوركلينج أول", "الغداء", "سنوركلينج ثانٍ", "المارينا نحو 16:00 ثم الفندق"], faqs: [{ question: "هل مشاهدة السلاحف أو الأطوم مضمونة؟", answer: "لا، جميع المشاهدات تعتمد على الطبيعة." }], seoTitle: "رحلة مرسى مبارك للسنوركلينج", metaDescription: "راجع رحلة مرسى مبارك من بورت غالب يومياً عدا الاثنين والجمعة مع الغداء والدخول والتوصيل المؤهل." },
    "abu-dabbab-snorkeling": { title: "رحلة سنوركلينج إلى شاطئ أبو دباب بالحافلة من مرسى علم", duration: "نحو 6 ساعات", description: "توصيل مشترك إلى شاطئ أبو دباب للسنوركلينج من مدخل سهل. تبدأ رحلة العودة نحو 13:00. فرصة مشاهدة السلاحف مرتفعة لكنها غير مضمونة.", highlights: ["الاثنين والأربعاء والجمعة", "دخول سهل للشاطئ", "مناسب للعائلات مع الإشراف", "رسوم دخول الشاطئ"], included: ["توصيل من الفنادق المؤهلة", "رسوم دخول الشاطئ"], notIncluded: ["الغداء", "المصاريف الشخصية", "معدات اختيارية غير مؤكدة"], notes: [pickup.ar, "تبدأ رحلة العودة نحو 13:00، ويجب تأكيد ما إذا كان هذا وقت مغادرة الشاطئ.", "يمنع لمس السلاحف أو إطعامها أو مطاردتها.", "يغلق الحجز الساعة 18:00 في اليوم السابق؛ الوقت يحتاج إلى تأكيد.", "يجب تأكيد الفئة العمرية للأطفال."], itinerary: ["الاستلام نحو 07:00", "الوصول نحو 07:45", "وقت الشاطئ والسنوركلينج حسب الظروف", "بدء العودة نحو 13:00"], faqs: [{ question: "هل سنشاهد السلاحف؟", answer: "المشاهدة شائعة لكنها غير مضمونة." }, { question: "هل الغداء مشمول؟", answer: "لا، الغداء غير مشمول." }], seoTitle: "سنوركلينج أبو دباب من مرسى علم", metaDescription: "راجع رحلة أبو دباب أيام الاثنين والأربعاء والجمعة مع التوصيل المشترك ودخول الشاطئ، دون ضمان مشاهدة السلاحف." },
  },
  de: {}, ru: {}, pl: {}, zh: {},
};

const compact: Record<Exclude<Locale, "en" | "ar">, Record<string, [string, string, string]>> = {
  de: {
    "dolphin-house-marsa-alam": ["Dolphin House Ganztages-Schnorcheltour ab Marsa Alam", "Ganztägige Bootstour mit zwei Schnorchelgängen und Mittagessen. Delfinsichtungen sind nicht garantiert.", "Dolphin House Schnorcheln ab Marsa Alam"],
    "marsa-mubarak-snorkeling": ["Marsa Mubarak Ganztages-Schnorcheltour ab Marsa Alam", "Bootstour ab Port Ghalib mit zwei Schnorchelgängen, Mittagessen und Eintritt. Wildtiersichtungen sind nicht garantiert.", "Marsa Mubarak Schnorcheltour"],
    "abu-dabbab-snorkeling": ["Abu Dabbab Strand-Schnorcheltour per Bus ab Marsa Alam", "Gemeinschaftstransfer zum leicht zugänglichen Abu-Dabbab-Strand. Schildkrötensichtungen sind nicht garantiert.", "Abu Dabbab Schnorcheln ab Marsa Alam"],
  },
  ru: {
    "dolphin-house-marsa-alam": ["Сноркелинг на весь день в Доме дельфинов из Марса-Алама", "Морская прогулка с двумя остановками для сноркелинга и обедом. Встреча с дельфинами не гарантируется.", "Дом дельфинов из Марса-Алама"],
    "marsa-mubarak-snorkeling": ["Сноркелинг на весь день в Марса-Мубарак", "Прогулка из Порт-Галиба с двумя остановками, обедом и входным билетом. Животные не гарантируются.", "Сноркелинг в Марса-Мубарак"],
    "abu-dabbab-snorkeling": ["Сноркелинг на пляже Абу-Даббаб на автобусе", "Общий трансфер к пляжу Абу-Даббаб с удобным входом. Встреча с черепахами не гарантируется.", "Абу-Даббаб из Марса-Алама"],
  },
  pl: {
    "dolphin-house-marsa-alam": ["Całodniowy rejs do Dolphin House z Marsa Alam", "Rejs z dwiema sesjami snorkelingu i lunchem. Obserwacja delfinów nie jest gwarantowana.", "Dolphin House z Marsa Alam"],
    "marsa-mubarak-snorkeling": ["Całodniowy rejs do Marsa Mubarak", "Rejs z Port Ghalib z dwiema sesjami, lunchem i wstępem. Zwierzęta nie są gwarantowane.", "Snorkeling w Marsa Mubarak"],
    "abu-dabbab-snorkeling": ["Snorkeling na plaży Abu Dabbab autobusem", "Wspólny transfer na łatwo dostępną plażę Abu Dabbab. Obserwacja żółwi nie jest gwarantowana.", "Abu Dabbab z Marsa Alam"],
  },
  zh: {
    "dolphin-house-marsa-alam": ["马萨阿拉姆出发海豚屋全天浮潜船游", "全天船游，包含两次浮潜和午餐。野生海豚目击无法保证。", "马萨阿拉姆海豚屋浮潜"],
    "marsa-mubarak-snorkeling": ["马萨阿拉姆出发穆巴拉克湾全天浮潜", "从加利卜港出发，包含两次浮潜、午餐和门票。野生动物目击无法保证。", "穆巴拉克湾浮潜船游"],
    "abu-dabbab-snorkeling": ["马萨阿拉姆出发阿布达巴布海滩巴士浮潜", "乘共享接送前往方便下水的阿布达巴布海滩。无法保证看到海龟。", "阿布达巴布海滩浮潜"],
  },
};

const detailCopy = {
  de: {
    personal: "Persönliche Ausgaben und nicht bestätigte optionale Ausrüstung", child: "Die Kinderaltersgrenze muss vor der Freischaltung bestätigt werden.", wildlifeQ: "Sind Wildtiersichtungen garantiert?", wildlifeA: "Nein. Sichtungen hängen von natürlichen Bedingungen ab.", pickup: "Hotelabholung gegen 07:00", marina: "Ankunft am Yachthafen gegen 08:00", depart: "Bootsabfahrt gegen 08:30", first: "Erster Schnorchelgang", lunch: "Mittagessen an Bord", second: "Zweiter Schnorchelgang", return: "Rückkehr zum Yachthafen gegen 16:00", beach: "Ankunft am Strand gegen 07:45", beachTime: "Strand- und Schnorchelzeit je nach Bedingungen", returnBeach: "Die Rückfahrt beginnt gegen 13:00", entry: "Eintrittsgebühr", boat: "Bootsfahrt und zwei Schnorchelgänge", noLunch: "Mittagessen ist nicht enthalten", safety: "Route und Wasserzugang hängen von Wetter, Seegang und Sicherheitsanweisungen ab.", bring: ["Ausweis oder Reisepass", "Badesachen", "Handtuch", "Sonnenschutz", "Persönliche Medikamente"], suitable: ["Schwimmfähigkeit und Aufsicht müssen zu den Tagesbedingungen passen"], cutoff: "Buchungsschluss ist 18:00 Uhr Kairo-Zeit am Vortag; diese angenommene Uhrzeit muss bestätigt werden.", noCutoff: "Ein Buchungsschluss wurde nicht mitgeteilt und muss vor der Freischaltung bestätigt werden." },
  ru: {
    personal: "Личные расходы и неподтверждённое дополнительное снаряжение", child: "Возрастной диапазон детского тарифа необходимо подтвердить до запуска.", wildlifeQ: "Гарантированы ли встречи с животными?", wildlifeA: "Нет. Наблюдения зависят от природных условий.", pickup: "Выезд из отеля около 07:00", marina: "Прибытие в марину около 08:00", depart: "Выход лодки около 08:30", first: "Первая остановка для сноркелинга", lunch: "Обед на борту", second: "Вторая остановка для сноркелинга", return: "Возвращение в марину около 16:00", beach: "Прибытие на пляж около 07:45", beachTime: "Пляж и сноркелинг с учётом условий", returnBeach: "Обратная дорога начинается около 13:00", entry: "Входной билет", boat: "Морская прогулка и две остановки для сноркелинга", noLunch: "Обед не включён", safety: "Маршрут и доступ к воде зависят от погоды, моря и указаний по безопасности.", bring: ["Паспорт или удостоверение личности", "Купальник", "Полотенце", "Защита от солнца", "Личные лекарства"], suitable: ["Умение плавать и присмотр должны соответствовать условиям дня"], cutoff: "Бронирование закрывается в 18:00 по Каиру накануне; это предполагаемое время требует подтверждения.", noCutoff: "Срок бронирования не указан и должен быть подтверждён до запуска." },
  pl: {
    personal: "Wydatki osobiste i niepotwierdzony opcjonalny sprzęt", child: "Zakres wieku dziecka trzeba potwierdzić przed uruchomieniem rezerwacji.", wildlifeQ: "Czy obserwacja zwierząt jest gwarantowana?", wildlifeA: "Nie. Obserwacje zależą od warunków naturalnych.", pickup: "Odbiór z hotelu około 07:00", marina: "Przyjazd do mariny około 08:00", depart: "Wypłynięcie około 08:30", first: "Pierwsza sesja snorkelingu", lunch: "Lunch na pokładzie", second: "Druga sesja snorkelingu", return: "Powrót do mariny około 16:00", beach: "Przyjazd na plażę około 07:45", beachTime: "Pobyt na plaży i snorkeling zależnie od warunków", returnBeach: "Podróż powrotna rozpoczyna się około 13:00", entry: "Opłata za wstęp", boat: "Rejs i dwie sesje snorkelingu", noLunch: "Lunch nie jest wliczony", safety: "Trasa i wejście do wody zależą od pogody, stanu morza i instrukcji bezpieczeństwa.", bring: ["Paszport lub dokument tożsamości", "Strój kąpielowy", "Ręcznik", "Ochrona przeciwsłoneczna", "Leki osobiste"], suitable: ["Umiejętność pływania i nadzór muszą odpowiadać warunkom dnia"], cutoff: "Rezerwacje kończą się o 18:00 czasu kairskiego dzień wcześniej; ta założona godzina wymaga potwierdzenia.", noCutoff: "Termin zamknięcia rezerwacji nie został podany i wymaga potwierdzenia przed uruchomieniem." },
  zh: {
    personal: "个人消费及未经确认的可选装备", child: "启用预订前必须确认儿童年龄范围。", wildlifeQ: "是否保证看到野生动物？", wildlifeA: "不保证；目击取决于自然条件。", pickup: "约07:00酒店接送", marina: "约08:00抵达码头", depart: "约08:30开船", first: "第一次浮潜", lunch: "船上午餐", second: "第二次浮潜", return: "约16:00返回码头", beach: "约07:45抵达海滩", beachTime: "根据当天条件安排海滩和浮潜时间", returnBeach: "约13:00开始返程", entry: "门票", boat: "船游及两次浮潜", noLunch: "不含午餐", safety: "航线和下水安排取决于天气、海况及安全指示。", bring: ["护照或身份证件", "泳衣", "毛巾", "防晒用品", "个人药物"], suitable: ["游泳能力和监护安排须符合当天条件"], cutoff: "预订于出发前一天开罗时间18:00截止；此暂定时间仍需确认。", noCutoff: "尚未提供预订截止时间，启用前必须确认。" },
} as const;

for (const locale of ["de", "ru", "pl", "zh"] as const) {
  for (const [slug, [title, description, seoTitle]] of Object.entries(compact[locale])) {
    const marine = slug !== "abu-dabbab-snorkeling";
    const detail = detailCopy[locale];
    const hasCutoff = slug !== "marsa-mubarak-snorkeling";
    translations[locale][slug] = { ...common[locale], title, description, seoTitle, metaDescription: description, duration: marine ? (locale === "zh" ? "全天" : locale === "ru" ? "Весь день" : locale === "pl" ? "Cały dzień" : "Ganztägig") : (locale === "zh" ? "约6小时" : locale === "ru" ? "Около 6 часов" : locale === "pl" ? "Około 6 godzin" : "Etwa 6 Stunden"), highlights: [description], included: marine ? [pickup[locale], detail.boat, detail.lunch, ...(slug === "marsa-mubarak-snorkeling" ? [detail.entry] : [])] : [pickup[locale], detail.entry], notIncluded: [detail.personal, ...(!marine ? [detail.noLunch] : [])], notes: [pickup[locale], detail.safety, hasCutoff ? detail.cutoff : detail.noCutoff, detail.child], itinerary: marine ? [detail.pickup, detail.marina, detail.depart, detail.first, detail.lunch, detail.second, detail.return] : [detail.pickup, detail.beach, detail.beachTime, detail.returnBeach], whatToBring: [...detail.bring], notSuitableFor: [...detail.suitable], faqs: [{ question: detail.wildlifeQ, answer: detail.wildlifeA }] };
  }
}

export function localizeMarsaAlamTour(tour: Tour, locale: Locale): Tour {
  return locale === "en" ? tour : { ...tour, ...common[locale], ...translations[locale][tour.slug] };
}
