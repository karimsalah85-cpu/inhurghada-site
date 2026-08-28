"use client";

import { Fish, MapPin, ShieldCheck, Sun, Utensils } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";

const copy = {
  en: {
    eyebrow: "Plan your Red Sea experience",
    title: "Things to do in Hurghada, Marsa Alam and Jeddah",
    intro: "Hurghada and Marsa Alam offer distinct Red Sea experiences, from island boat trips, snorkeling and diving to desert adventures and practical private transfers. Choose the destination that matches your hotel and travel plans.",
    detail: "Explore Hurghada for islands, desert safaris, transfers and historical day trips, or choose Marsa Alam for its own southern reef excursions. Compare destination, duration, inclusions, pickup details and transparent prices before booking.",
    items: [
      ["Red Sea days", "Hurghada’s coastline is known for clear water, sandy beaches and coral reefs. Choose snorkeling and diving experiences for your confidence level and the day’s sea conditions."],
      ["Beyond the beach", "Giftun Islands are popular for boat days, Hurghada Marina for an evening walk, and El Dahar for a more traditional local atmosphere."],
      ["Local culture", "Egyptian hospitality is warm and social. Try koshari, grilled seafood and fresh mezze, and dress respectfully away from the beach."],
      ["Plan comfortably", "Pack light layers, swimwear, a hat, sunglasses and reef-safe sun protection. Check pickup details the day before your activity."],
      ["Respect the sea", "Do not touch coral or marine life, follow the crew’s safety briefing, and only dive within your training and experience."],
    ],
  },
  de: {
    eyebrow: "Plane dein Erlebnis am Roten Meer",
    title: "Aktivitäten in Hurghada und Marsa Alam",
    intro: "Hurghada und Marsa Alam bieten unterschiedliche Erlebnisse am Roten Meer – von Bootstouren, Schnorcheln und Tauchen bis zu Wüstenabenteuern und Privattransfers. Wähle das Reiseziel passend zu deinem Hotel und deinen Plänen.",
    detail: "Entdecke in Hurghada Inseln, Wüstensafaris, Transfers und historische Tagesausflüge oder wähle Marsa Alam für eigene Ausflüge zu den südlichen Riffen. Vergleiche Reiseziel, Dauer, Leistungen, Abholdetails und transparente Preise.",
    items: [
      ["Tage am Roten Meer", "Hurghadas Küste ist für klares Wasser, Sandstrände und Korallenriffe bekannt. Wähle Schnorchel- und Taucherlebnisse passend zu deiner Erfahrung und den Meeresbedingungen."],
      ["Mehr als Strand", "Die Giftun-Inseln sind beliebt für Bootstage, die Hurghada Marina für Abendspaziergänge und El Dahar für eine traditionellere Atmosphäre."],
      ["Lokale Kultur", "Ägyptische Gastfreundschaft ist herzlich. Probiere Koshari, gegrillte Meeresfrüchte und frische Mezze und kleide dich abseits des Strandes respektvoll."],
      ["Bequem planen", "Packe leichte Kleidung, Badesachen, Hut, Sonnenbrille und riffsicheren Sonnenschutz ein. Prüfe die Abholdetails am Vortag."],
      ["Das Meer schützen", "Berühre keine Korallen oder Meerestiere, befolge die Sicherheitseinweisung und tauche nur im Rahmen deiner Ausbildung und Erfahrung."],
    ],
  },
  ru: {
    eyebrow: "Спланируйте отдых на Красном море",
    title: "Чем заняться в Хургаде и Марса-Аламе",
    intro: "Хургада и Марса-Алам предлагают разные впечатления на Красном море: морские прогулки, сноркелинг, дайвинг, пустынные приключения и частные трансферы. Выберите направление рядом с вашим отелем и подходящее вашим планам.",
    detail: "В Хургаде доступны острова, сафари, трансферы и исторические поездки, а в Марса-Аламе — отдельные экскурсии к южным рифам. Перед бронированием сравните направление, продолжительность, услуги, трансфер и цены.",
    items: [
      ["Дни на Красном море", "Побережье Хургады известно чистой водой, песчаными пляжами и коралловыми рифами. Выбирайте сноркелинг и дайвинг с учётом опыта и состояния моря."],
      ["Не только пляж", "Острова Гифтун подходят для морских прогулок, набережная Хургады — для вечерних прогулок, а Эль-Дахар — для знакомства с местной атмосферой."],
      ["Местная культура", "Египетское гостеприимство тёплое и искреннее. Попробуйте кошари, морепродукты на гриле и мезе; за пределами пляжа одевайтесь уважительно."],
      ["Комфортное планирование", "Возьмите лёгкую одежду, купальные принадлежности, головной убор, очки и безопасный для рифов крем. Проверьте трансфер накануне."],
      ["Берегите море", "Не трогайте кораллы и морских животных, соблюдайте инструктаж команды и погружайтесь только в пределах своей подготовки."],
    ],
  },
  ar: {
    eyebrow: "خطط لتجربتك في البحر الأحمر",
    title: "أنشطة وتجارب في الغردقة ومرسى علم وجدة",
    intro: "تقدم الغردقة ومرسى علم تجارب متنوعة في البحر الأحمر، من رحلات الجزر والسنوركلينج والغوص إلى مغامرات الصحراء والتنقلات الخاصة. اختر الوجهة الأنسب لموقع فندقك وخطة سفرك.",
    detail: "استكشف جزر الغردقة ورحلات السفاري والتنقلات والرحلات التاريخية، أو اختر مرسى علم لرحلات الشعاب الجنوبية المميزة. قارن بين الوجهة والمدة والخدمات المشمولة وتفاصيل الاستلام والأسعار الواضحة قبل الحجز.",
    items: [
      ["أيام البحر الأحمر", "يشتهر ساحل الغردقة بالمياه الصافية والشواطئ الرملية والشعاب المرجانية. اختر تجربة السنوركلينج أو الغوص المناسبة لمستوى خبرتك وحالة البحر في يوم الرحلة."],
      ["أكثر من مجرد شاطئ", "تشتهر جزر الجفتون بالرحلات البحرية، وتناسب مارينا الغردقة التنزه مساءً، بينما تمنحك منطقة الدهار أجواءً محلية أكثر تقليدية."],
      ["الثقافة المحلية", "الضيافة المصرية دافئة واجتماعية. جرّب الكشري والمأكولات البحرية المشوية والمقبلات الطازجة، واحرص على ارتداء ملابس مناسبة بعيدًا عن الشاطئ."],
      ["خطط براحة", "أحضر ملابس خفيفة وملابس سباحة وقبعة ونظارة شمسية وواقي شمس آمنًا للشعاب المرجانية. راجع تفاصيل الاستلام في اليوم السابق للنشاط."],
      ["احمِ البحر", "لا تلمس الشعاب المرجانية أو الكائنات البحرية، واتبع تعليمات السلامة من الطاقم، ولا تغص إلا ضمن حدود تدريبك وخبرتك."],
    ],
  },
  pl: {
    eyebrow: "Zaplanuj pobyt nad Morzem Czerwonym",
    title: "Atrakcje w Hurghadzie, Marsa Alam i Dżuddzie",
    intro: "Hurghada i Marsa Alam oferują różne atrakcje nad Morzem Czerwonym — od rejsów na wyspy, snorkelingu i nurkowania po pustynne przygody i prywatne transfery. Wybierz kierunek pasujący do lokalizacji hotelu i planu podróży.",
    detail: "W Hurghadzie odkryjesz wyspy, safari, transfery i historyczne wycieczki jednodniowe, a w Marsa Alam — południowe rafy. Przed rezerwacją porównaj kierunek, czas trwania, świadczenia, odbiór i przejrzyste ceny.",
    items: [
      ["Dni nad Morzem Czerwonym", "Wybrzeże Hurghady słynie z czystej wody, piaszczystych plaż i raf koralowych. Wybierz snorkeling lub nurkowanie odpowiednie do doświadczenia i warunków na morzu."],
      ["Więcej niż plaża", "Wyspy Giftun są popularne na rejsy, marina w Hurghadzie na wieczorny spacer, a El Dahar pozwala poznać bardziej tradycyjną atmosferę."],
      ["Lokalna kultura", "Egipska gościnność jest serdeczna. Spróbuj koshari, grillowanych owoców morza i świeżych mezze, a poza plażą ubieraj się z szacunkiem."],
      ["Wygodne planowanie", "Spakuj lekkie ubrania, strój kąpielowy, kapelusz, okulary i bezpieczny dla raf krem przeciwsłoneczny. Dzień wcześniej sprawdź szczegóły odbioru."],
      ["Szanuj morze", "Nie dotykaj koralowców ani zwierząt morskich, przestrzegaj instrukcji załogi i nurkuj wyłącznie w granicach swoich uprawnień i doświadczenia."],
    ],
  },
  zh: {
    eyebrow: "规划您的红海体验",
    title: "赫尔格达、马萨阿拉姆和吉达游玩指南",
    intro: "赫尔格达和马萨阿拉姆提供各具特色的红海体验，从海岛游船、浮潜和潜水，到沙漠探险和实用的私人接送。请根据酒店位置和旅行计划选择合适的目的地。",
    detail: "在赫尔格达探索海岛、沙漠越野、接送和历史一日游，或前往马萨阿拉姆体验南部珊瑚礁。预订前请比较目的地、时长、包含项目、接送详情和透明价格。",
    items: [
      ["红海时光", "赫尔格达海岸以清澈海水、沙滩和珊瑚礁闻名。请根据自身经验和当天海况选择浮潜或潜水体验。"],
      ["不止海滩", "吉夫顿群岛适合一日游船，赫尔格达码头适合傍晚散步，达哈区则更具传统本地氛围。"],
      ["当地文化", "埃及人热情好客。可以品尝库莎丽、烤海鲜和新鲜开胃菜；离开海滩后请注意衣着得体。"],
      ["舒适出行", "请携带轻便衣物、泳装、帽子、太阳镜和珊瑚礁友好型防晒用品，并在活动前一天确认接送详情。"],
      ["保护海洋", "请勿触摸珊瑚或海洋生物，遵守船员的安全说明，并仅在自身培训和经验范围内潜水。"],
    ],
  },
};

const icons = [Fish, MapPin, Utensils, Sun, ShieldCheck];

export default function HurghadaTravelGuide() {
  const { language } = useSiteSettings();
  const content = copy[language];
  return <section aria-labelledby="hurghada-guide-title" className="bg-white px-6 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><p className="font-semibold uppercase tracking-[0.24em] text-cyan-700">{content.eyebrow}</p><h2 id="hurghada-guide-title" className="mt-3 text-4xl font-black text-slate-900">{content.title}</h2><p className="mt-5 text-lg leading-8 text-slate-600">{content.intro}</p><p className="mt-4 leading-8 text-slate-600">{content.detail}</p></div><div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{content.items.map(([title, text], index) => { const Icon = icons[index]; return <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><Icon aria-hidden="true" className="text-cyan-700" size={28}/><h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>; })}</div></div></section>;
}
