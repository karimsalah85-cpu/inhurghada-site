"use client";

import { Fish, MapPin, ShieldCheck, Sun, Utensils } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsContext";

const copy = {
  en: {
    eyebrow: "Plan your Red Sea experience",
    title: "Things to do across the Red Sea",
    intro: "Every Red Sea destination has its own character, from island boat trips, snorkeling and diving to desert adventures, cultural day trips and practical private transfers. Choose the destination that matches your hotel and travel plans.",
    detail: "Hurghada and Marsa Alam sit on Egypt’s Red Sea coast, and Jeddah opens up the Saudi side of the same sea, with more destinations to come. Compare destination, duration, inclusions, pickup details and transparent prices before you book.",
    items: [
      ["On the water", "The Red Sea is known for warm, clear water and coral reefs close to shore. Choose snorkeling and diving experiences that match your confidence level and the day’s sea conditions."],
      ["Beyond the beach", "Each destination is more than its coastline. Island days and marinas, old-town quarters, markets and historical sites are usually within easy reach of your hotel."],
      ["Local culture", "Hospitality around the Red Sea is warm and social. Try the regional cooking, eat where locals eat, and dress respectfully away from the beach."],
      ["Plan comfortably", "Pack light layers, swimwear, a hat, sunglasses and reef-safe sun protection. Check your pickup details the day before your activity."],
      ["Respect the sea", "Do not touch coral or marine life, follow the crew’s safety briefing, and only dive within your training and experience."],
    ],
  },
  de: {
    eyebrow: "Plane dein Erlebnis am Roten Meer",
    title: "Aktivitäten rund ums Rote Meer",
    intro: "Jedes Reiseziel am Roten Meer hat seinen eigenen Charakter – von Inseltouren, Schnorcheln und Tauchen bis zu Wüstenabenteuern, kulturellen Tagesausflügen und praktischen Privattransfers. Wähle das Reiseziel, das zu deinem Hotel und deinen Plänen passt.",
    detail: "Hurghada und Marsa Alam liegen an der ägyptischen Küste des Roten Meeres, Jeddah erschließt die saudische Seite desselben Meeres – weitere Ziele folgen. Vergleiche Reiseziel, Dauer, Leistungen, Abholdetails und transparente Preise vor der Buchung.",
    items: [
      ["Auf dem Wasser", "Das Rote Meer ist bekannt für warmes, klares Wasser und Korallenriffe nahe der Küste. Wähle Schnorchel- und Taucherlebnisse passend zu deiner Erfahrung und den Meeresbedingungen des Tages."],
      ["Mehr als Strand", "Jedes Reiseziel ist mehr als seine Küste. Inseltage und Marinas, Altstadtviertel, Märkte und historische Orte liegen meist in Reichweite deines Hotels."],
      ["Lokale Kultur", "Die Gastfreundschaft am Roten Meer ist herzlich und gesellig. Probiere die regionale Küche, iss dort, wo die Einheimischen essen, und kleide dich abseits des Strandes respektvoll."],
      ["Bequem planen", "Packe leichte Kleidung, Badesachen, Hut, Sonnenbrille und riffsicheren Sonnenschutz ein. Prüfe die Abholdetails am Vortag deiner Aktivität."],
      ["Das Meer schützen", "Berühre keine Korallen oder Meerestiere, befolge die Sicherheitseinweisung der Crew und tauche nur im Rahmen deiner Ausbildung und Erfahrung."],
    ],
  },
  ru: {
    eyebrow: "Спланируйте отдых на Красном море",
    title: "Чем заняться на Красном море",
    intro: "У каждого направления на Красном море свой характер: морские прогулки к островам, сноркелинг и дайвинг, приключения в пустыне, экскурсии к достопримечательностям и удобные частные трансферы. Выберите направление, которое подходит вашему отелю и планам поездки.",
    detail: "Хургада и Марса-Алам расположены на египетском побережье Красного моря, а Джидда открывает саудовскую сторону того же моря; новые направления появятся позже. Перед бронированием сравните направление, продолжительность, услуги, детали трансфера и прозрачные цены.",
    items: [
      ["На воде", "Красное море известно тёплой прозрачной водой и коралловыми рифами недалеко от берега. Выбирайте сноркелинг и дайвинг с учётом вашего опыта и состояния моря в этот день."],
      ["Не только пляж", "Каждое направление — это не только побережье. Острова и марины, старые кварталы, рынки и исторические места обычно находятся рядом с отелем."],
      ["Местная культура", "Гостеприимство на Красном море тёплое и открытое. Попробуйте местную кухню, ешьте там, где едят местные, и одевайтесь уважительно за пределами пляжа."],
      ["Комфортное планирование", "Возьмите лёгкую одежду, купальные принадлежности, головной убор, солнцезащитные очки и безопасный для рифов крем. Проверьте детали трансфера накануне."],
      ["Берегите море", "Не трогайте кораллы и морских животных, соблюдайте инструктаж команды и погружайтесь только в пределах своей подготовки и опыта."],
    ],
  },
  ar: {
    eyebrow: "خطط لتجربتك في البحر الأحمر",
    title: "أنشطة وتجارب على البحر الأحمر",
    intro: "لكل وجهة على البحر الأحمر طابعها الخاص، من رحلات الجزر والسنوركلينج والغوص إلى مغامرات الصحراء والجولات الثقافية والتنقلات الخاصة العملية. اختر الوجهة الأنسب لموقع فندقك وخطة سفرك.",
    detail: "تقع الغردقة ومرسى علم على الساحل المصري للبحر الأحمر، وتفتح جدة الجانب السعودي من البحر نفسه، مع وجهات أخرى قادمة لاحقًا. قارن بين الوجهة والمدة والخدمات المشمولة وتفاصيل الاستلام والأسعار الواضحة قبل الحجز.",
    items: [
      ["على الماء", "يشتهر البحر الأحمر بمياهه الدافئة الصافية وشعابه المرجانية القريبة من الشاطئ. اختر تجربة السنوركلينج أو الغوص المناسبة لمستوى خبرتك وحالة البحر في يوم الرحلة."],
      ["أكثر من مجرد شاطئ", "كل وجهة أكثر من ساحلها؛ فأيام الجزر والمارينا والأحياء القديمة والأسواق والمواقع التاريخية عادةً ما تكون قريبة من فندقك."],
      ["الثقافة المحلية", "الضيافة على البحر الأحمر دافئة واجتماعية. جرّب المطبخ المحلي، وتناول الطعام حيث يأكل السكان المحليون، واحرص على ارتداء ملابس مناسبة بعيدًا عن الشاطئ."],
      ["خطط براحة", "أحضر ملابس خفيفة وملابس سباحة وقبعة ونظارة شمسية وواقي شمس آمنًا للشعاب المرجانية. راجع تفاصيل الاستلام في اليوم السابق للنشاط."],
      ["احمِ البحر", "لا تلمس الشعاب المرجانية أو الكائنات البحرية، واتبع تعليمات السلامة من الطاقم، ولا تغص إلا ضمن حدود تدريبك وخبرتك."],
    ],
  },
  pl: {
    eyebrow: "Zaplanuj pobyt nad Morzem Czerwonym",
    title: "Atrakcje nad Morzem Czerwonym",
    intro: "Każdy kierunek nad Morzem Czerwonym ma swój charakter — od rejsów na wyspy, snorkelingu i nurkowania po pustynne przygody, wycieczki krajoznawcze i wygodne prywatne transfery. Wybierz kierunek pasujący do lokalizacji hotelu i planu podróży.",
    detail: "Hurghada i Marsa Alam leżą na egipskim wybrzeżu Morza Czerwonego, a Dżudda otwiera saudyjską stronę tego samego morza; kolejne kierunki wkrótce. Przed rezerwacją porównaj kierunek, czas trwania, świadczenia, szczegóły odbioru i przejrzyste ceny.",
    items: [
      ["Na wodzie", "Morze Czerwone słynie z ciepłej, przejrzystej wody i raf koralowych blisko brzegu. Wybierz snorkeling lub nurkowanie odpowiednie do doświadczenia i warunków na morzu danego dnia."],
      ["Więcej niż plaża", "Każdy kierunek to coś więcej niż wybrzeże. Dni na wyspach i mariny, stare dzielnice, targi i miejsca historyczne zwykle są blisko hotelu."],
      ["Lokalna kultura", "Gościnność nad Morzem Czerwonym jest serdeczna i otwarta. Spróbuj regionalnej kuchni, jedz tam, gdzie miejscowi, a poza plażą ubieraj się z szacunkiem."],
      ["Wygodne planowanie", "Spakuj lekkie ubrania, strój kąpielowy, kapelusz, okulary i bezpieczny dla raf krem przeciwsłoneczny. Dzień wcześniej sprawdź szczegóły odbioru."],
      ["Szanuj morze", "Nie dotykaj koralowców ani zwierząt morskich, przestrzegaj instrukcji załogi i nurkuj wyłącznie w granicach swoich uprawnień i doświadczenia."],
    ],
  },
  zh: {
    eyebrow: "规划您的红海体验",
    title: "红海沿岸游玩指南",
    intro: "红海的每个目的地都各具特色，从海岛游船、浮潜和潜水，到沙漠探险、文化一日游和实用的私人接送。请根据酒店位置和旅行计划选择合适的目的地。",
    detail: "赫尔格达和马萨阿拉姆位于埃及的红海海岸，吉达则通向同一片海的沙特一侧，未来还会有更多目的地。预订前请比较目的地、时长、包含项目、接送详情和透明价格。",
    items: [
      ["水上活动", "红海以温暖清澈的海水和近岸珊瑚礁闻名。请根据自身经验和当天海况选择浮潜或潜水体验。"],
      ["不止海滩", "每个目的地都不只是海岸线——海岛行程与码头、老城区、集市和历史遗迹通常都在酒店附近。"],
      ["当地文化", "红海沿岸待客热情而随和。可以品尝当地菜肴，去本地人常去的地方用餐；离开海滩后请注意衣着得体。"],
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
