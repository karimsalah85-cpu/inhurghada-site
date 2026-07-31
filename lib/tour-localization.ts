import type { Tour } from "@/data/tours";

const arabicTourOverrides: Record<string, Partial<Tour>> = {
  "orange-bay": {
    title: "رحلة أورانج باي البحرية مع السنوركلينج", location: "الغردقة، مصر", duration: "8 ساعات", category: "رحلة جزيرة",
    description: "استمتع بيوم كامل في أورانج باي يشمل رحلة يخت مريحة، محطتين للسنوركلينج، غداء على القارب ووقتاً على الشاطئ.",
    highlights: ["جزيرة أورانج باي", "محطتان للسنوركلينج", "غداء ومشروبات", "الاستلام من الفندق"],
    included: ["الاستلام والتوصيل من الفندق", "رحلة القارب", "دخول أورانج باي", "معدات السنوركلينج", "الغداء والمشروبات"],
    notIncluded: ["الصور والفيديو", "المناشف", "المصاريف الشخصية"], notes: ["يتم تأكيد وقت الاستلام عبر واتساب.", "أحضر جواز السفر أو صورة منه وتصريح السباحة والمنشفة."],
  },
  "mahmya-island": {
    title: "رحلة بحرية إلى جزيرة محمية", location: "الغردقة، مصر", duration: "يوم كامل", category: "رحلة جزيرة",
    description: "استرخِ على الرمال البيضاء واسبح في المياه الصافية داخل محمية جزر الجفتون، مع رحلة بحرية وسنوركلينج وغداء.",
    highlights: ["شاطئ رملي أبيض", "مياه صافية", "سنوركلينج", "غداء", "توصيل من الفندق"],
    included: ["توصيل الفندق", "القارب", "دخول الجزيرة", "الغداء والمشروبات"], notIncluded: ["المصاريف الشخصية", "الصور والفيديو"],
  },
  "full-day-snorkeling": {
    title: "رحلة سنوركلينج ليوم كامل", location: "الغردقة، مصر", duration: "8 ساعات", category: "سنوركلينج",
    description: "اكتشف الشعاب المرجانية في البحر الأحمر خلال رحلة قارب مع محطتين للسنوركلينج وغداء ومشروبات.",
    highlights: ["محطتان للسنوركلينج", "شعاب مرجانية", "غداء", "معدات السنوركلينج", "توصيل الفندق"],
    included: ["توصيل الفندق", "القارب", "معدات السنوركلينج", "الغداء والمشروبات"], notIncluded: ["زيارة جزيرة", "المصاريف الشخصية"],
  },
  "full-day-diving": {
    title: "رحلة غوص ليوم كامل", location: "الغردقة، مصر", duration: "8 ساعات", category: "غوص",
    description: "اكتشف عالم البحر الأحمر تحت الماء مع غطستين بصحبة مدرب محترف وغداء على القارب.",
    highlights: ["غطستان بإرشاد مدرب", "غداء على القارب", "توصيل الفندق", "إمكانية استئجار المعدات"],
    included: ["توصيل الفندق", "القارب", "مدرب الغوص", "الغداء والمشروبات"], notIncluded: ["معدات الغوص – 30 دولاراً", "المصاريف الشخصية"],
    notes: ["يجب أن يحمل كل غواص شهادة غوص سارية ويحضر إثباتها.", "تُختار مواقع الغوص حسب حالة البحر."],
  },
  "professional-underwater-photographer": {
    title: "مصور محترف تحت الماء", location: "الغردقة، مصر", duration: "يوم كامل", category: "تصوير",
    description: "احتفظ بذكريات البحر الأحمر مع مصور محترف يرافقك أثناء الغوص أو السنوركلينج أو الرحلة البحرية.",
    highlights: ["مصور خاص", "صور تحت الماء وعلى السطح", "صور رقمية معدلة"], included: ["مصور ليوم كامل", "معدات تصوير تحت الماء", "مجموعة صور رقمية"], notIncluded: ["تكلفة النشاط", "التوصيل إن لم يتم الاتفاق عليه"],
  },
  safari: {
    title: "مغامرة سفاري في الصحراء", location: "صحراء الغردقة", duration: "5 ساعات", category: "سفاري صحراوي",
    description: "استمتع بقيادة الكواد وركوب الجمل وزيارة قرية بدوية وشاي بدوي في صحراء الغردقة.",
    highlights: ["قيادة كواد", "ركوب جمل", "قرية بدوية", "غروب الصحراء"],
  },
  "quad-safari-morning": {
    title: "سفاري كواد صباحي", location: "صحراء الغردقة", duration: "5 ساعات", category: "سفاري صحراوي",
    description: "ابدأ يومك بمغامرة كواد في الصحراء الشرقية مع مناظر الجبال وزيارة مخيم بدوي.",
    highlights: ["قيادة كواد", "مخيم بدوي", "شاي", "مناظر الجبال"], notes: ["الحد الأدنى للعمر 9 سنوات.", "يجب الالتزام بتعليمات السلامة."],
  },
  "quad-safari-sunset": {
    title: "سفاري كواد وقت الغروب", location: "صحراء الغردقة", duration: "5 ساعات", category: "سفاري صحراوي",
    description: "قد الكواد بين جبال صحراء الغردقة وقت الغروب واستمتع بالضيافة البدوية التقليدية.",
    highlights: ["قيادة وقت الغروب", "كواد", "مخيم بدوي", "شاي"], notes: ["الحد الأدنى للعمر 9 سنوات.", "يتم تأكيد وقت الاستلام عبر واتساب."],
  },
  "luxor-private-day-trip": {
    title: "رحلة خاصة إلى الأقصر من الغردقة", location: "الأقصر، مصر", duration: "يوم تقريباً", category: "رحلة تاريخية",
    description: "اكتشف وادي الملوك ومعبد حتشبسوت وتمثالي ممنون ومعبد الكرنك بسيارة خاصة ومرشد متخصص، مع الغداء والتذاكر.",
    highlights: ["سيارة ومرشد خاص", "وادي الملوك", "معبد حتشبسوت", "معبد الكرنك", "الغداء"],
    included: ["توصيل خاص", "سيارة مكيفة", "التذاكر الأساسية", "مرشد", "الغداء والمياه"], notIncluded: ["مقبرة توت عنخ آمون", "المشروبات", "الإكراميات"],
  },
  "hurghada-airport-transfer": {
    title: "توصيل خاص من مطار الغردقة", location: "مطار الغردقة الدولي", duration: "مرن", category: "توصيل المطار",
    description: "توصيل خاص باتجاه واحد بسعر ثابت 20 دولاراً داخل الغردقة، مع إضافة 7 دولارات لمناطق المنتجعات.",
    highlights: ["سعر ثابت", "استقبال في المطار", "متابعة الرحلة", "سيارة خاصة مكيفة"],
  },
  "senzo-transfer": {
    title: "توصيل خاص إلى سنزو مول", location: "الغردقة، مصر", duration: "مرن", category: "توصيل خاص",
    description: "توصيل خاص باتجاه واحد إلى سنزو مول بسعر 10 دولارات داخل الغردقة، مع إضافة 7 دولارات لمناطق المنتجعات.",
    highlights: ["سعر ثابت", "سيارة خاصة", "استلام من الفندق", "موعد مرن"],
  },
};

export function localizeTourArabic(tour: Tour): Tour {
  return { ...tour, ...arabicTourOverrides[tour.slug] };
}

const germanTourOverrides: Record<string, Partial<Tour>> = {
  "orange-bay": {
    title: "Orange Bay Hurghada Bootstour mit Schnorcheln", location: "Hurghada, Ägypten", duration: "8 Stunden", category: "Inselausflug",
    description: "Sichere dir deine Orange Bay Hurghada Tickets für einen entspannten Tag auf dem Roten Meer: komfortable Bootstour, zwei Schnorchelstopps an farbenfrohen Korallenriffen, Mittagessen an Bord und Freizeit am weißen Sandstrand.",
    highlights: ["Orange Bay Island und Strandzeit", "Hurghada Bootstour auf einer komfortablen Yacht", "Zwei Schnorchelstopps an Korallenriffen", "Schwimmen im türkisfarbenen Wasser", "Mittagessen und Getränke an Bord"],
    included: ["Hotelabholung und Rücktransfer", "Bootsfahrt", "Eintritt zur Orange Bay", "Zwei Schnorchelstopps", "Schnorchelausrüstung", "Mittagessen und alkoholfreie Getränke", "Crew und Sicherheitsausrüstung"],
    notIncluded: ["Unterwasserfotos und Videos", "Strandtücher", "Badebekleidung", "Sonnenschutz"],
    notes: ["Die genaue Abholzeit bestätigen wir nach der Buchung per WhatsApp.", "Nimm deinen Reisepass oder eine Kopie für die Hafengenehmigung mit.", "Bring Badebekleidung, Handtuch und Sonnenschutz mit."],
    packageName: "Orange Bay Hurghada Bootstour", packageDescription: "Ganztägige Bootstour zur Orange Bay mit Schnorcheln, Mittagessen und Hoteltransfer.", packageLabel: "Erwachsene",
    itinerary: ["Abholung vom Hotel und Fahrt zum Hafen", "Bootsfahrt über das Rote Meer", "Zwei Schnorchelstopps", "Freizeit am Strand der Orange Bay", "Mittagessen an Bord und Rückfahrt"],
  },
  safari: {
    title: "Wüstensafari-Abenteuer", location: "Wüste bei Hurghada", duration: "5 Stunden", category: "Wüstensafari",
    description: "Erlebe die Wüste bei einer abwechslungsreichen Quad Tour Hurghada mit Kamelritt, Beduinendorf, Tee und eindrucksvoller Abendstimmung.",
    highlights: ["Quadfahrt", "Kamelritt", "Beduinentee", "Sonnenuntergang in der Wüste"], availableTimes: ["Nachmittags – genaue Abholung per WhatsApp"],
  },
  "professional-underwater-photographer": {
    title: "Professioneller Unterwasserfotograf", location: "Hurghada, Ägypten", duration: "Ganzer Tag",
    description: "Halte dein Abenteuer am Roten Meer mit einem eigenen professionellen Unterwasserfotografen fest – beim Tauchen, Schnorcheln, auf einer Bootstour und über Wasser.",
    highlights: ["Eigener professioneller Fotograf", "Unterwasser- und Oberflächenaufnahmen", "Ideal für Tauch- und Schnorcheltage", "Professionell bearbeitete Erinnerungen"],
    included: ["Fotograf für einen ganzen Tag", "Unterwasser-Fotoausrüstung", "Bearbeitete digitale Bildauswahl", "Abstimmung mit deinem Ausflug"],
    notIncluded: ["Gebühren für die gebuchte Aktivität", "Hoteltransfer, sofern nicht vereinbart", "Fotoalbum und zusätzliche Bearbeitung"],
    notes: ["Frühzeitig buchen, da die Verfügbarkeit begrenzt ist.", "Teile Aktivität und Abfahrtszeit bei der Buchung mit.", "Der Preis gilt pro Fotograf und Tag."],
    packageName: "Ganztägiger Unterwasser-Fotoservice", packageDescription: "Ein professioneller Fotograf begleitet dein Erlebnis am Roten Meer einen ganzen Tag.", packageLabel: "Pro Tag", priceUnit: "pro Tag",
    availableTimes: ["Startzeit wird per WhatsApp bestätigt"], itinerary: ["Aktivität, Treffpunkt und Bildstil abstimmen", "Fotograf vor der Abfahrt treffen", "Aufnahmen über und unter Wasser", "Bearbeitete digitale Bilder erhalten"],
  },
  "luxor-private-day-trip": {
    title: "Privater Tagesausflug nach Luxor ab Hurghada", location: "Luxor, Ägypten", duration: "Etwa 1 Tag", category: "Kultureller Tagesausflug",
    description: "Entdecke Luxor privat ab Hurghada mit klimatisiertem Fahrzeug und eigenem Ägyptologen. Besuche das Tal der Könige, den Hatschepsut-Tempel, die Memnonkolosse und Karnak; Hotelabholung, Eintritt und Mittagessen sind inklusive.",
    highlights: ["Privates Fahrzeug und eigener Reiseführer", "Drei Königsgräber im Tal der Könige", "Hatschepsut-Tempel und Memnonkolosse", "Karnak-Tempel", "Sonderpreis für Familien und Gruppen", "Kostenlose Stornierung bis 24 Stunden vorher"],
    included: ["Private Abholung und Rückfahrt", "Klimatisiertes Fahrzeug", "Drei Standardgräber im Tal der Könige", "Hatschepsut-Tempel, Memnonkolosse und Karnak", "Eintrittsgelder", "Englischsprachiger Ägyptologe", "Mittagessen mit vegetarischer Option", "Mineralwasser und Genehmigungen"],
    notIncluded: ["Grab Tutanchamuns – etwa 30 $ Aufpreis", "Deutsch- und weitere fremdsprachige Reiseführer – Aufpreis", "Getränke", "Optionale Felukenfahrt", "Trinkgeld"],
    notes: ["Ein gültiger Ausweis oder Reisepass ist erforderlich.", "120 $ ist der Startpreis pro Erwachsenen; Familien- und Gruppenpreis auf Anfrage.", "Abholung etwa um 05:00 Uhr, Bestätigung per WhatsApp.", "Alle Zeiten sind Richtwerte."],
    packageName: "Privater Luxor-Tagesausflug", packageDescription: "Privater Luxor-Tag mit Transport, Ägyptologen, wichtigen Eintrittsgeldern, drei Königsgräbern und Mittagessen.", packageLabel: "Startpreis pro Erwachsenen",
    itinerary: ["05:00 – Private Hotelabholung", "09:30 – Tal der Könige", "11:30 – Memnonkolosse", "12:30 – Hatschepsut-Tempel", "13:30 – Mittagessen", "14:45 – Karnak-Tempel", "17:00 – Rückfahrt"],
  },
  "mahmya-island": {
    title: "Mahmya Island Bootstour", location: "Hurghada, Ägypten", duration: "Ganzer Tag", category: "Inselausflug",
    description: "Genieße einen hochwertigen Inseltag im Giftun-Nationalpark mit weißem Sand, kristallklarem Wasser, Schnorcheln, Bootsfahrt und Mittagessen.",
    highlights: ["Premium-Inselerlebnis", "Weißer Sandstrand", "Kristallklares Wasser", "Schnorcheln", "Mittagessen", "Hoteltransfer"],
    included: ["Hotelabholung und Rückfahrt", "Bootsfahrt", "Inseleintritt", "Mittagessen", "Alkoholfreie Getränke"], notIncluded: ["Persönliche Ausgaben", "Fotos und Videos"],
    notes: ["Abholzeit wird per WhatsApp bestätigt.", "Badebekleidung, Sonnenschutz und Handtuch mitbringen."],
    packageName: "Mahmya Island Tagesausflug", packageDescription: "Premium-Inseltag mit Abholung, Bootsfahrt und Mittagessen.", packageLabel: "Pro Person", itinerary: ["Hotelabholung", "Bootsfahrt", "Strandzeit", "Mittagessen", "Rückfahrt"],
  },
  "full-day-snorkeling": {
    title: "Ganztägige Schnorcheltour", location: "Hurghada, Ägypten", duration: "8 Stunden", category: "Schnorcheln",
    description: "Entdecke bei dieser ganztägigen Hurghada Bootstour lokale Korallenriffe. Der Kapitän wählt je nach Wind und Meer die besten Schnorchelplätze aus.",
    highlights: ["Zwei Schnorchelstopps", "Korallenriffe im Roten Meer", "Mittagsbuffet", "Getränke", "Hotelabholung", "Professionelle Begleitung"],
    included: ["Hotelabholung", "Bootsfahrt", "Schnorchelausrüstung", "Mittagessen", "Alkoholfreie Getränke"], notIncluded: ["Inselbesuch", "Persönliche Ausgaben"],
    notes: ["Kein Inselbesuch enthalten.", "Die Plätze richten sich nach Wetter und Seegang."], packageName: "Ganztägiges Riff-Schnorcheln", packageDescription: "Bootstag mit zwei Schnorchelstopps und Mittagessen.", packageLabel: "Pro Person",
  },
  "full-day-diving": {
    title: "Ganztägige Tauchtour", location: "Hurghada, Ägypten", duration: "8 Stunden", category: "Tauchen",
    description: "Entdecke die Unterwasserwelt des Roten Meeres bei zwei geführten Tauchgängen. Die Tauchplätze werden passend zu Wetter und Seegang ausgewählt.",
    highlights: ["Zwei geführte Tauchgänge", "Professioneller Tauchlehrer", "Mittagessen an Bord", "Hoteltransfer", "Ausrüstung zubuchbar"],
    included: ["Hoteltransfer", "Bootsfahrt", "Tauchlehrer", "Mittagessen", "Getränke"], notIncluded: ["Tauchausrüstung – für 30 $ zubuchbar", "Persönliche Ausgaben"],
    notes: ["Ausrüstung ist nicht im Grundpreis enthalten.", "Tauchplätze richten sich nach Wetter und Seegang."], packageName: "Zwei geführte Tauchgänge", packageDescription: "Ganztägige Bootstour mit zwei Tauchgängen.", packageLabel: "Pro Person",
  },
  "quad-safari-morning": {
    title: "Quad Tour Hurghada am Morgen", location: "Wüste bei Hurghada", duration: "5 Stunden", category: "Wüstensafari",
    description: "Starte den Tag mit einer Quad Tour Hurghada durch die östliche Wüste, vorbei an Bergpanoramen bis zu einem traditionellen Beduinencamp.",
    highlights: ["Quadfahrt", "Wüstenabenteuer", "Beduinencamp", "Tee", "Bergpanorama"], included: ["Hotelabholung", "Quadfahrt", "Sicherheitseinweisung", "Beduinentee"],
    notIncluded: ["Schal und Schutzbrille falls benötigt", "Persönliche Ausgaben"], notes: ["Sicherheitseinweisung ist verbindlich.", "Sonnenbrille und geschlossene Schuhe mitbringen."],
    packageName: "Quad-Safari am Morgen", packageDescription: "Morgendliche Wüstenfahrt mit Beduinencamp.", packageLabel: "Pro Person",
  },
  "quad-safari-sunset": {
    title: "Quad Tour Hurghada bei Sonnenuntergang", location: "Wüste bei Hurghada", duration: "5 Stunden", category: "Wüstensafari",
    description: "Fahre bei Sonnenuntergang mit dem Quad durch die Berglandschaft der Hurghada-Wüste und genieße anschließend traditionelle Gastfreundschaft im Beduinencamp.",
    highlights: ["Fahrt bei Sonnenuntergang", "Quad", "Beduinencamp", "Tee", "Wüstenpanorama"], included: ["Hotelabholung", "Quadfahrt", "Sicherheitseinweisung", "Beduinentee"],
    notIncluded: ["Persönliche Ausgaben"], notes: ["Abholung am Nachmittag, abhängig von der Sonnenuntergangszeit; genaue Zeit per WhatsApp.", "Sonnenbrille und geschlossene Schuhe mitbringen."],
    packageName: "Quad-Safari bei Sonnenuntergang", packageDescription: "Wüstenfahrt im Abendlicht mit Beduinen-Gastfreundschaft.", packageLabel: "Pro Person", availableTimes: ["Nachmittags – genaue Abholung per WhatsApp"],
  },
  "hurghada-airport-transfer": {
    title: "Privater Flughafentransfer Hurghada", location: "Internationaler Flughafen Hurghada", duration: "Flexibel", category: "Flughafentransfer",
    description: "Zuverlässiger Flughafentransfer Hurghada zum Festpreis: 20 $ pro Strecke innerhalb Hurghadas, plus 7 $ für Makadi Bay, Soma Bay, El Gouna oder Sahl Hasheesh.",
    highlights: ["Fester Preis pro Strecke", "Empfang am Flughafen", "Flugüberwachung", "Privates klimatisiertes Fahrzeug", "Passende Fahrzeuggröße"],
    included: ["Privatfahrzeug", "Fahrer", "Kraftstoff und Parkgebühren"], notIncluded: ["Zusätzliche Stopps", "Rückfahrt"],
    notes: ["1–2 Personen: Kleinwagen mit maximal 2 Koffern.", "Ab 3 Personen: größeres Fahrzeug mit bis zu 2 Koffern pro Person.", "Flugnummer und Hotel bei der Buchung angeben."],
    packageName: "Flughafentransfer pro Strecke", packageDescription: "20 $ innerhalb Hurghadas; 7 $ Zuschlag für die Ferienorte.", packageLabel: "Festpreis pro Strecke", availableTimes: ["Zeit wird anhand der Flugdaten bestätigt"],
  },
  "senzo-transfer": {
    title: "Privater Transfer zur Senzo Mall", location: "Hurghada, Ägypten", duration: "Flexibel", category: "Shopping-Transfer",
    description: "Privater Senzo-Mall-Transfer zum Festpreis: 10 $ pro Strecke innerhalb Hurghadas, plus 7 $ für Makadi Bay, Soma Bay, El Gouna oder Sahl Hasheesh.",
    highlights: ["Fester Preis pro Strecke", "Privatfahrzeug", "Hotelabholung", "Flexible Uhrzeit", "Klimatisiertes Auto"],
    included: ["Privater Transfer", "Fahrer", "Kraftstoff und Parkgebühren"], notIncluded: ["Rückfahrt", "Reisekoffer", "Einkäufe und Mahlzeiten"],
    notes: ["Maximal 4 Personen.", "Bei diesem Service sind keine Reisekoffer möglich.", "Hin- und Rückfahrt getrennt buchen."],
    packageName: "Senzo Mall Transfer pro Strecke", packageDescription: "10 $ innerhalb Hurghadas; 7 $ Zuschlag für die Ferienorte.", packageLabel: "Festpreis pro Strecke", availableTimes: ["Wunschzeit wird per WhatsApp bestätigt"],
  },
};

export function germanTourTitle(slug: string, fallback: string) {
  return germanTourOverrides[slug]?.title || fallback;
}

export function localizeTourGerman(tour: Tour): Tour {
  return { ...tour, ...germanTourOverrides[tour.slug] };
}

const russianTourOverrides: Record<string, Partial<Tour>> = {
  "orange-bay": {
    title: "Морская прогулка на Orange Bay со сноркелингом", location: "Хургада, Египет", duration: "8 часов", category: "Островная экскурсия",
    description: "Проведите день на Красном море: комфортная прогулка на яхте, две остановки для сноркелинга у коралловых рифов, обед на борту и отдых на белом пляже Orange Bay.",
    highlights: ["Остров Orange Bay и пляжный отдых", "Прогулка на комфортабельной яхте", "Две остановки для сноркелинга", "Купание в бирюзовой воде", "Обед и напитки на борту"],
    included: ["Трансфер из отеля и обратно", "Прогулка на яхте", "Вход на Orange Bay", "Снаряжение для сноркелинга", "Обед и безалкогольные напитки", "Команда и спасательное оборудование"],
    notIncluded: ["Подводные фото и видео", "Пляжные полотенца", "Купальные принадлежности", "Солнцезащитные средства"],
    notes: ["Точное время трансфера подтверждается через WhatsApp.", "Возьмите паспорт или копию для портового разрешения.", "Возьмите купальные принадлежности, полотенце и солнцезащитный крем."],
    packageName: "Морская прогулка на Orange Bay", packageDescription: "Экскурсия на целый день с пляжем, сноркелингом, обедом и трансфером.", packageLabel: "Взрослый",
    itinerary: ["Трансфер из отеля в порт", "Прогулка по Красному морю", "Две остановки для сноркелинга", "Отдых на пляже Orange Bay", "Обед на борту и возвращение"],
  },
  safari: {
    title: "Сафари в пустыне", location: "Пустыня Хургады", duration: "5 часов", category: "Сафари",
    description: "Отправьтесь в пустыню на квадроцикле, прокатитесь на верблюде, посетите бедуинскую деревню и насладитесь вечерними пейзажами.",
    highlights: ["Поездка на квадроцикле", "Катание на верблюде", "Бедуинский чай", "Закат в пустыне"], availableTimes: ["После обеда — точное время подтвердим в WhatsApp"],
  },
  "professional-underwater-photographer": {
    title: "Профессиональный подводный фотограф", location: "Хургада, Египет", duration: "Целый день",
    description: "Сохраните воспоминания о Красном море с личным профессиональным фотографом во время дайвинга, сноркелинга или морской прогулки.",
    highlights: ["Личный профессиональный фотограф", "Съёмка под водой и на поверхности", "Для дайвинга и сноркелинга", "Профессионально обработанные фотографии"],
    included: ["Фотограф на целый день", "Подводное фотооборудование", "Подборка обработанных цифровых фотографий", "Координация с вашей экскурсией"],
    notIncluded: ["Стоимость выбранной активности", "Трансфер, если не согласован", "Фотоальбом и дополнительная обработка"],
    notes: ["Бронируйте заранее: количество дат ограничено.", "Укажите активность и время отправления.", "Цена указана за фотографа на день."],
    packageName: "Подводная фотосъёмка на целый день", packageDescription: "Профессиональный фотограф сопровождает ваше приключение на Красном море.", packageLabel: "За день", priceUnit: "за день",
    availableTimes: ["Время начала подтверждается через WhatsApp"],
  },
  "luxor-private-day-trip": {
    title: "Индивидуальная поездка в Луксор из Хургады", location: "Луксор, Египет", duration: "Около 1 дня", category: "Историческая экскурсия",
    description: "Посетите Луксор на личном автомобиле с египтологом: Долина царей, храм Хатшепсут, Колоссы Мемнона и Карнакский храм, включая трансфер и обед.",
    highlights: ["Личный автомобиль и гид", "Три гробницы в Долине царей", "Храм Хатшепсут и Колоссы Мемнона", "Карнакский храм", "Цена для семей и групп", "Бесплатная отмена за 24 часа"],
    included: ["Индивидуальный трансфер", "Автомобиль с кондиционером", "Три стандартные гробницы", "Основные достопримечательности", "Входные билеты", "Англоязычный египтолог", "Обед и вода", "Разрешения"],
    notIncluded: ["Гробница Тутанхамона — около 30 $", "Гид на русском и других языках — доплата", "Напитки", "Прогулка на фелюге", "Чаевые"],
    notes: ["Необходим действующий паспорт или удостоверение личности.", "120 $ — начальная цена за взрослого; цена для семьи или группы по запросу.", "Трансфер около 05:00, подтверждение через WhatsApp.", "Время в программе ориентировочное."],
    packageName: "Индивидуальная экскурсия в Луксор", packageDescription: "Личный транспорт, египтолог, основные билеты, три гробницы и обед.", packageLabel: "Начальная цена за взрослого",
  },
  "mahmya-island": {
    title: "Морская прогулка на остров Махмея", location: "Хургада, Египет", duration: "Целый день", category: "Островная экскурсия",
    description: "Отдохните на белом песке и в прозрачной воде острова Махмея в национальном парке Гифтун: морская прогулка, сноркелинг и обед.",
    highlights: ["Премиальный островной отдых", "Белый песчаный пляж", "Прозрачная вода", "Сноркелинг", "Обед", "Трансфер из отеля"],
    included: ["Трансфер из отеля и обратно", "Морская прогулка", "Вход на остров", "Обед", "Безалкогольные напитки"], notIncluded: ["Личные расходы", "Фото и видео"],
    notes: ["Время трансфера подтверждается через WhatsApp.", "Возьмите купальные принадлежности, полотенце и солнцезащитный крем."],
    packageName: "Экскурсия на остров Махмея", packageDescription: "Премиальный островной день с трансфером, яхтой и обедом.", packageLabel: "За человека",
  },
  "full-day-snorkeling": {
    title: "Сноркелинг на весь день", location: "Хургада, Египет", duration: "8 часов", category: "Сноркелинг",
    description: "Исследуйте коралловые рифы Красного моря во время морской прогулки с двумя остановками для сноркелинга. Места выбираются с учётом погоды и состояния моря.",
    highlights: ["Две остановки для сноркелинга", "Коралловые рифы", "Обед", "Безалкогольные напитки", "Трансфер из отеля", "Профессиональный гид"],
    included: ["Трансфер из отеля", "Морская прогулка", "Снаряжение для сноркелинга", "Обед", "Безалкогольные напитки"], notIncluded: ["Посещение острова", "Личные расходы"],
    notes: ["Посещение острова не входит.", "Места зависят от погоды и состояния моря."], packageName: "Сноркелинг на рифах", packageDescription: "Морской день с двумя остановками для сноркелинга и обедом.", packageLabel: "За человека",
  },
  "full-day-diving": {
    title: "Дайвинг на весь день", location: "Хургада, Египет", duration: "8 часов", category: "Дайвинг",
    description: "Откройте подводный мир Красного моря во время двух погружений с инструктором. Места выбираются с учётом погоды и состояния моря.",
    highlights: ["Два погружения с гидом", "Профессиональный инструктор", "Обед на борту", "Напитки", "Трансфер из отеля", "Аренда снаряжения"],
    included: ["Трансфер из отеля", "Морская прогулка", "Инструктор", "Обед", "Напитки"], notIncluded: ["Аренда снаряжения — 30 $", "Личные расходы"],
    notes: ["Каждый дайвер должен иметь действующий сертификат и взять его с собой.", "Снаряжение не входит в базовую цену.", "Места погружений зависят от погоды."],
    packageName: "Два погружения в Красном море", packageDescription: "Морская прогулка с двумя погружениями. Требуется действующий сертификат.", packageLabel: "За человека",
  },
  "quad-safari-morning": {
    title: "Утреннее сафари на квадроциклах", location: "Пустыня Хургады", duration: "5 часов", category: "Сафари",
    description: "Начните день с поездки на квадроцикле по Восточной пустыне, полюбуйтесь горами и посетите традиционный бедуинский лагерь.",
    highlights: ["Поездка на квадроцикле", "Пустынное приключение", "Бедуинский лагерь", "Чай", "Горные виды"], included: ["Трансфер из отеля", "Квадроцикл", "Инструктаж", "Бедуинский чай"],
    notIncluded: ["Шарф и защитные очки при необходимости", "Личные расходы"], notes: ["Минимальный возраст участника — 9 лет.", "Необходимо соблюдать инструктаж.", "Возьмите солнцезащитные очки и закрытую обувь."],
    packageName: "Утреннее сафари", packageDescription: "Утренняя поездка по пустыне с посещением бедуинского лагеря. Минимальный возраст — 9 лет.", packageLabel: "За человека",
  },
  "quad-safari-sunset": {
    title: "Сафари на квадроциклах на закате", location: "Пустыня Хургады", duration: "5 часов", category: "Сафари",
    description: "Прокатитесь на квадроцикле по горной пустыне на закате и познакомьтесь с традиционным гостеприимством бедуинов.",
    highlights: ["Поездка на закате", "Квадроцикл", "Бедуинский лагерь", "Чай", "Панорама пустыни"], included: ["Трансфер из отеля", "Квадроцикл", "Инструктаж", "Бедуинский чай"],
    notIncluded: ["Личные расходы"], notes: ["Минимальный возраст участника — 9 лет.", "Точное время зависит от заката и подтверждается через WhatsApp.", "Возьмите закрытую обувь."],
    packageName: "Сафари на закате", packageDescription: "Поездка по пустыне на закате. Минимальный возраст — 9 лет.", packageLabel: "За человека", availableTimes: ["После обеда — точное время через WhatsApp"],
  },
  "hurghada-airport-transfer": {
    title: "Частный трансфер из аэропорта Хургады", location: "Международный аэропорт Хургады", duration: "По договорённости", category: "Трансфер из аэропорта",
    description: "Частный трансфер в одну сторону: 20 $ в пределах Хургады и доплата 7 $ для Макади-Бей, Сома-Бей, Эль-Гуны или Сахл-Хашиша.",
    highlights: ["Фиксированная цена", "Встреча в аэропорту", "Отслеживание рейса", "Частный автомобиль с кондиционером", "Размер автомобиля по группе"],
    included: ["Частный автомобиль", "Водитель", "Топливо и парковка"], notIncluded: ["Дополнительные остановки", "Обратная поездка"],
    notes: ["1–2 пассажира: небольшой автомобиль, максимум 2 чемодана.", "От 3 пассажиров: большой автомобиль, до 2 чемоданов на человека.", "Укажите номер рейса и отель."],
    packageName: "Трансфер из аэропорта в одну сторону", packageDescription: "20 $ в Хургаде; доплата 7 $ для курортных районов.", packageLabel: "Фиксированная цена", availableTimes: ["Время по данным рейса"],
  },
  "senzo-transfer": {
    title: "Частный трансфер в Senzo Mall", location: "Хургада, Египет", duration: "По договорённости", category: "Трансфер",
    description: "Частный трансфер в одну сторону: 10 $ в пределах Хургады и доплата 7 $ для Макади-Бей, Сома-Бей, Эль-Гуны или Сахл-Хашиша.",
    highlights: ["Фиксированная цена", "Частный автомобиль", "Трансфер из отеля", "Гибкое время", "Кондиционер"],
    included: ["Частный трансфер", "Водитель", "Топливо и парковка"], notIncluded: ["Обратная поездка", "Багаж", "Покупки и питание"],
    notes: ["Максимум 4 пассажира.", "Багаж не принимается.", "Поездки туда и обратно бронируются отдельно."],
    packageName: "Трансфер в Senzo Mall", packageDescription: "10 $ в Хургаде; доплата 7 $ для курортных районов.", packageLabel: "Фиксированная цена", availableTimes: ["Желаемое время подтвердим в WhatsApp"],
  },
};

export function localizeTourRussian(tour: Tour): Tour {
  return { ...tour, ...russianTourOverrides[tour.slug] };
}

const chineseTourOverrides: Record<string, Partial<Tour>> = {
  "orange-bay": {
    title: "橙湾浮潜游船之旅", location: "埃及赫尔格达", duration: "8 小时", category: "海岛游",
    description: "从赫尔格达乘舒适游艇前往橙湾，体验两次珊瑚礁浮潜、船上午餐，并在洁白沙滩上悠闲度过一天。",
    highlights: ["橙湾海岛时光", "豪华游艇巡航", "两次珊瑚礁浮潜", "清澈海水中游泳", "船上午餐和饮料", "酒店接送"],
    included: ["酒店往返接送", "游艇行程", "橙湾门票", "两次浮潜", "浮潜装备", "午餐和软饮", "救生及安全设备"],
    notIncluded: ["水下照片和视频", "沙滩毛巾", "泳衣和防晒用品"],
    notes: ["接送时间将在预订后通过 WhatsApp 确认。", "请携带护照或复印件、泳衣、毛巾和防晒霜。"],
    packageName: "橙湾浮潜游船之旅", packageDescription: "包含酒店接送、游艇、浮潜、海岛停留和午餐的橙湾一日游。", packageLabel: "成人",
    itinerary: ["从赫尔格达酒店接您前往码头", "乘游艇巡航红海", "在珊瑚礁进行两次浮潜", "橙湾沙滩自由活动", "船上午餐并送返酒店"],
  },
  safari: {
    title: "沙漠探险", location: "赫尔格达沙漠", duration: "5 小时", category: "沙漠探险",
    description: "驾驶四轮摩托穿越沙漠，体验骑骆驼、参观贝都因村落和品尝传统茶。",
    highlights: ["四轮摩托", "骑骆驼", "贝都因茶", "沙漠日落"], availableTimes: ["下午出发，准确接送时间通过 WhatsApp 确认"],
  },
  "professional-underwater-photographer": {
    title: "专业水下摄影师", location: "埃及赫尔格达", duration: "全天", category: "摄影服务",
    description: "由专业摄影师全天记录您的潜水、浮潜或游船体验，为您留下高质量的水下及水面影像。",
    highlights: ["专属专业摄影师", "全天水下和水面拍摄", "适合潜水、浮潜和游船", "专业修图"],
    included: ["全天专业摄影服务", "水下摄影设备", "精选数码修图照片", "与活动方协调"],
    notIncluded: ["游船、潜水或浮潜活动费用", "未另行约定的酒店接送", "相册及额外修图"],
    notes: ["请提前预订以确认摄影师档期。", "预订时请告知活动和出发时间。", "价格按每位摄影师每天计算。"],
    packageName: "全天水下摄影服务", packageDescription: "专属摄影师全天记录您的红海体验。", packageLabel: "每天", priceUnit: "每天", availableTimes: ["开始时间通过 WhatsApp 确认"],
  },
  "luxor-private-day-trip": {
    title: "赫尔格达出发的卢克索私人一日游", location: "埃及卢克索", duration: "约 1 天", category: "历史文化之旅",
    description: "乘私人空调车辆从赫尔格达前往卢克索，由埃及学导游带您参观帝王谷、哈特谢普苏特神庙、门农巨像和卡纳克神庙，含酒店接送和午餐。",
    highlights: ["私人车辆和专属导游", "帝王谷三座王陵", "哈特谢普苏特神庙", "门农巨像", "卡纳克神庙", "含午餐和主要门票"],
    included: ["赫尔格达酒店私人接送", "私人空调车辆", "帝王谷及三座普通王陵门票", "主要景点门票", "英语埃及学导游", "当地餐厅午餐", "矿泉水和旅行许可"],
    notIncluded: ["图坦卡蒙墓门票（约 30 美元）", "其他语种导游附加费", "午餐饮料", "自选帆船体验", "小费和个人消费"],
    notes: ["办理旅行许可需有效身份证件或护照。", "120 美元为成人起价，家庭或私人团体请咨询报价。", "约 05:00 接送，准确时间通过 WhatsApp 确认。", "活动开始前 24 小时可免费取消。"],
    packageName: "卢克索私人一日游", packageDescription: "包含私人交通、埃及学导游、主要门票、三座王陵和午餐。", packageLabel: "成人起价", availableTimes: ["05:00"],
    itinerary: ["05:00 从赫尔格达酒店私人接送", "参观帝王谷三座王陵", "参观门农巨像和哈特谢普苏特神庙", "享用当地午餐", "导览卡纳克神庙", "乘私人空调车辆返回酒店"],
  },
  "mahmya-island": {
    title: "马赫米亚岛游船之旅", location: "埃及赫尔格达", duration: "全天", category: "海岛游",
    description: "前往吉夫顿岛国家公园内的马赫米亚岛，在白沙滩和清澈碧海间游泳、浮潜，享受高品质海岛一日游。",
    highlights: ["高品质海岛体验", "白沙滩", "清澈海水", "浮潜", "午餐", "酒店接送"], included: ["酒店往返接送", "游船", "海岛门票", "午餐", "软饮"], notIncluded: ["个人消费", "照片和视频"],
    notes: ["接送时间通过 WhatsApp 确认。", "请携带泳衣、防晒霜和毛巾。"], packageName: "马赫米亚岛一日游", packageDescription: "包含接送、游船和午餐的高品质海岛体验。", packageLabel: "每人",
  },
  "full-day-snorkeling": {
    title: "全天浮潜之旅", location: "埃及赫尔格达", duration: "8 小时", category: "浮潜",
    description: "乘船探索红海珊瑚礁，船长会根据天气和海况选择合适的浮潜地点。",
    highlights: ["两次浮潜", "红海珊瑚礁", "自助午餐", "软饮", "酒店接送", "专业向导"], included: ["酒店接送", "游船", "浮潜装备", "午餐", "软饮"], notIncluded: ["海岛停留", "个人消费"],
    notes: ["本行程不包含海岛停留。", "地点视天气和海况而定。"], packageName: "全天珊瑚礁浮潜", packageDescription: "包含两次浮潜和午餐的轻松红海游船一日行程。", packageLabel: "每人",
  },
  "full-day-diving": {
    title: "全天深潜之旅", location: "埃及赫尔格达", duration: "8 小时", category: "深潜",
    description: "在专业教练带领下完成两次红海潜水，潜点由船长根据天气和海况选择。",
    highlights: ["两次带领潜水", "专业教练", "船上午餐", "软饮", "酒店接送", "可租装备"], included: ["酒店接送", "游船", "专业教练", "午餐", "软饮"], notIncluded: ["潜水装备租赁（30 美元）", "个人消费"],
    notes: ["每位潜水员均须持有效潜水证并随身携带证明。", "基础价格不含装备。", "潜点视天气和海况而定。"], packageName: "红海两次带领潜水", packageDescription: "包含两次潜水的全天游船行程；须持有效潜水证。", packageLabel: "每人",
  },
  "quad-safari-morning": {
    title: "清晨四轮摩托沙漠探险", location: "赫尔格达沙漠", duration: "5 小时", category: "沙漠探险",
    description: "清晨驾驶四轮摩托穿越东部沙漠，欣赏山景并参观传统贝都因营地。",
    highlights: ["四轮摩托驾驶", "沙漠探险", "贝都因营地", "传统茶", "山景"], included: ["酒店接送", "四轮摩托", "安全讲解", "贝都因茶"], notIncluded: ["如需使用的头巾和护目镜", "个人消费"],
    notes: ["最低参加年龄为 9 岁。", "驾驶者须遵守安全讲解。", "请携带太阳镜并穿包头鞋。"], packageName: "清晨沙漠四轮摩托", packageDescription: "含贝都因营地参观的清晨沙漠骑行，最低年龄 9 岁。", packageLabel: "每人",
  },
  "quad-safari-sunset": {
    title: "日落四轮摩托沙漠探险", location: "赫尔格达沙漠", duration: "5 小时", category: "沙漠探险",
    description: "在日落时驾驶四轮摩托穿越赫尔格达山地沙漠，并体验传统贝都因待客之道。",
    highlights: ["日落骑行", "四轮摩托", "贝都因营地", "传统茶", "沙漠全景"], included: ["酒店接送", "四轮摩托", "安全讲解", "贝都因茶"], notIncluded: ["个人消费"],
    notes: ["最低参加年龄为 9 岁。", "下午接送时间随日落变化，将通过 WhatsApp 确认。", "请穿包头鞋。"], packageName: "日落沙漠四轮摩托", packageDescription: "含贝都因体验的日落沙漠骑行，最低年龄 9 岁。", packageLabel: "每人", availableTimes: ["下午出发，准确时间通过 WhatsApp 确认"],
  },
  "hurghada-airport-transfer": {
    title: "赫尔格达机场私人接送", location: "赫尔格达国际机场", duration: "灵活安排", category: "机场接送",
    description: "赫尔格达市区单程私人机场接送固定价 20 美元；马卡迪湾、索马湾、艾尔古纳和萨尔哈希什加收 7 美元。",
    highlights: ["固定单程价格", "举牌迎接", "航班跟踪", "私人空调车辆", "按人数安排车型"], included: ["私人车辆", "司机", "燃油和停车费"], notIncluded: ["额外停靠", "返程"],
    notes: ["1–2 位乘客使用小型车，最多 2 件行李。", "3 位及以上安排较大车辆，每人最多 2 件行李。", "预订时请提供航班号和酒店名称。"], packageName: "机场单程私人接送", packageDescription: "赫尔格达市区 20 美元；指定度假区加收 7 美元。", packageLabel: "固定单程价格", availableTimes: ["根据航班信息确认时间"],
  },
  "senzo-transfer": {
    title: "Senzo Mall 私人接送", location: "埃及赫尔格达", duration: "灵活安排", category: "私人接送",
    description: "赫尔格达市区前往或离开 Senzo Mall 的单程私人接送固定价 10 美元；指定度假区加收 7 美元。",
    highlights: ["固定价格", "私人车辆", "酒店接送", "灵活时间", "空调车辆"], included: ["私人单程接送", "司机", "燃油和停车费"], notIncluded: ["返程", "旅行行李", "购物和餐饮"],
    notes: ["最多 4 位乘客。", "不接受旅行行李。", "往返行程需分别预订。"], packageName: "Senzo Mall 单程接送", packageDescription: "赫尔格达市区 10 美元；指定度假区加收 7 美元。", packageLabel: "固定单程价格", availableTimes: ["希望出发时间通过 WhatsApp 确认"],
  },
};

export function localizeTourChinese(tour: Tour): Tour {
  return { ...tour, ...chineseTourOverrides[tour.slug] };
}
