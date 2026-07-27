import type { Tour } from "@/data/tours";

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
