import type { Locale } from "@/lib/i18n";

type TransferCopy = {
  title: string; description: string; book: string; intro: string;
  pickup: string; dropoff: string; placeholder: string; routeHint: string;
  date: string; time: string; swap: string; other: string; returnHint: string;
  routeError: string; returnError: string; manualRoute: string; manualPrivate: string;
  flight: string; vehicleTitle: string; sedan: string; van: string; fleetNote: string;
  passengers: string; bags: string; cabinBags: string; routeTitle: string;
  routeGroups: { title: string; text: string }[];
  benefits: string[]; faqTitle: string; faqs: { question: string; answer: string }[];
  policyTitle: string; policyIntro: string; meeting: string; homeText: string;
};

export const transferCopy: Record<Locale, TransferCopy> = {
  en: {
    title: "Private Transfers in Hurghada & Marsa Alam",
    description: "Private journeys between airports, hotels, resorts and marinas across Hurghada and Marsa Alam. Choose your pickup and destination to see a vehicle price or request a quote.",
    book: "Book a private transfer", intro: "Your route, your private vehicle",
    pickup: "Pickup location", dropoff: "Drop-off location", placeholder: "Airport, hotel, marina or full address",
    routeHint: "Choose an airport suggestion or enter the exact hotel, marina or address. Marsa Alam Airport and other routes without a displayed fare are quoted by our team before confirmation.",
    date: "Pickup date", time: "Pickup time", swap: "Swap pickup and drop-off", other: "Hotels & marinas",
    returnHint: "The return follows the reverse route. Enter the pickup time at your destination, after the outbound journey.",
    routeError: "Enter different pickup and drop-off locations.", returnError: "Choose a return pickup after the outbound journey.",
    manualRoute: "This route needs a quote. Our team will confirm the vehicle and full price before you commit.",
    manualPrivate: "Hotel, marina and other private journeys are quoted individually.",
    flight: "Flight number (optional)", vehicleTitle: "Vehicles for your group", sedan: "Private sedan", van: "Private Hiace / van",
    fleetNote: "We match the vehicle to all passengers and luggage. Extra bags may require a larger vehicle or more than one vehicle. Make and model may vary.",
    passengers: "passengers", bags: "large suitcases", cabinBags: "cabin bags", routeTitle: "Where would you like to go?",
    routeGroups: [
      { title: "Hurghada & nearby resorts", text: "Airport, hotel and marina journeys in Hurghada, El Gouna, Sahl Hasheesh, Makadi Bay, Soma Bay and Safaga." },
      { title: "Marsa Alam & Port Ghalib", text: "Request transfers from or to Marsa Alam Airport, Port Ghalib, El Quseir and Marsa Alam hotels and marinas." },
      { title: "Between resorts & cities", text: "Hotel-to-hotel and longer private journeys along the Red Sea coast, including Hurghada to Marsa Alam, by quotation." },
    ],
    benefits: ["Private vehicle for your group", "Price per vehicle and journey", "One way or return"],
    faqTitle: "Private transfer questions",
    faqs: [
      { question: "Can I book a transfer without using an airport?", answer: "Yes. Enter your hotel, resort, marina or full address for pickup and drop-off. These journeys are quoted individually; the team confirms availability and the full price before confirming the transfer." },
      { question: "Do you arrange Marsa Alam Airport transfers?", answer: "You can request journeys to and from Marsa Alam Airport (RMF), Port Ghalib and Marsa Alam hotels. These routes need a separate quote. Hurghada Airport fares do not apply to Marsa Alam Airport." },
      { question: "Is the price per person or per vehicle?", answer: "Per vehicle and per journey. A displayed return total includes both legs and every allocated vehicle. A quote request has no confirmed price until the team replies." },
      { question: "Which vehicle will I get?", answer: "We match the vehicle to your passengers and luggage. A sedan seats up to 3 passengers and a Hiace / van up to 10. Luggage, equipment and accessibility needs may require a larger vehicle or individual confirmation." },
      { question: "Can I request child seats or bring diving equipment?", answer: "Yes. Declare all passengers, luggage and equipment in the form. Child seats are free, must be requested in advance and are subject to availability. The team confirms any special vehicle requirements." },
      { question: "How do I arrange a return journey?", answer: "Select Round trip and enter a return pickup date and time. The return reverses the pickup and drop-off locations. Use the time you want to be collected, rather than a flight departure time." },
    ],
    policyTitle: "Private Transfer Passenger & Vehicle Policy", policyIntro: "How we choose your vehicle and confirm your journey.",
    meeting: "Your driver meets you at the agreed pickup point. For airport pickups, we confirm the meeting instructions before travel.",
    homeText: "Private airport, hotel and marina transfers across Hurghada and Marsa Alam. Choose your route for a vehicle price or quote.",
  },
  de: {
    title: "Private Transfers in Hurghada & Marsa Alam",
    description: "Private Fahrten zwischen Flughäfen, Hotels, Resorts und Marinas in Hurghada und Marsa Alam. Wähle Abholort und Ziel für einen Fahrzeugpreis oder ein Angebot.",
    book: "Privaten Transfer buchen", intro: "Deine Route, dein Privatfahrzeug", pickup: "Abholort", dropoff: "Zielort", placeholder: "Flughafen, Hotel, Marina oder vollständige Adresse",
    routeHint: "Wähle einen Flughafen aus den Vorschlägen oder gib die genaue Adresse ein. Für den Flughafen Marsa Alam und Routen ohne angezeigten Preis bestätigt unser Team ein Angebot vor der Buchung.",
    date: "Abholdatum", time: "Abholzeit", swap: "Abholort und Ziel tauschen", other: "Hotels & Marinas",
    returnHint: "Die Rückfahrt führt auf der umgekehrten Route zurück. Gib die Abholzeit am Ziel nach der Hinfahrt an.", routeError: "Gib unterschiedliche Abhol- und Zielorte ein.", returnError: "Wähle eine Rückfahrt nach der Hinfahrt.",
    manualRoute: "Für diese Route ist ein Angebot nötig. Unser Team bestätigt Fahrzeug und Gesamtpreis vor einer verbindlichen Buchung.", manualPrivate: "Hotel-, Marina- und andere Privatfahrten werden individuell angeboten.", flight: "Flugnummer (optional)",
    vehicleTitle: "Fahrzeuge für deine Gruppe", sedan: "Private Limousine", van: "Privater Hiace / Van", fleetNote: "Wir wählen das Fahrzeug nach Fahrgästen und Gepäck. Mehr Gepäck kann ein größeres oder mehrere Fahrzeuge erfordern. Marke und Modell können variieren.", passengers: "Fahrgäste", bags: "große Koffer", cabinBags: "Handgepäckstücke", routeTitle: "Wohin möchtest du fahren?",
    routeGroups: [
      { title: "Hurghada & nahe Resorts", text: "Flughafen-, Hotel- und Marinafahrten in Hurghada, El Gouna, Sahl Hasheesh, Makadi Bay, Soma Bay und Safaga." },
      { title: "Marsa Alam & Port Ghalib", text: "Transfers vom oder zum Flughafen Marsa Alam, Port Ghalib, El Quseir sowie Hotels und Marinas in Marsa Alam anfragen." },
      { title: "Zwischen Resorts & Städten", text: "Hotelwechsel und längere Privatfahrten entlang der Rotmeerküste, auch Hurghada–Marsa Alam, auf Anfrage." },
    ], benefits: ["Privatfahrzeug für deine Gruppe", "Preis pro Fahrzeug und Fahrt", "Einfache Fahrt oder Hin- und Rückfahrt"], faqTitle: "Fragen zu privaten Transfers",
    faqs: [
      { question: "Sind Fahrten ohne Flughafen möglich?", answer: "Ja. Gib Hotels, Resorts, Marinas oder genaue Adressen als Abholort und Ziel ein. Unser Team bestätigt Verfügbarkeit und Gesamtpreis individuell." },
      { question: "Sind Transfers am Flughafen Marsa Alam möglich?", answer: "Du kannst Transfers vom und zum Flughafen Marsa Alam (RMF), Port Ghalib und Hotels in Marsa Alam anfragen. Dafür ist ein separates Angebot nötig; Hurghada-Flughafentarife gelten hier nicht." },
      { question: "Gilt der Preis pro Person oder Fahrzeug?", answer: "Pro Fahrzeug und Fahrt. Ein angezeigter Rückfahrt-Gesamtpreis umfasst beide Strecken und alle Fahrzeuge. Bei einer Angebotsanfrage steht der Preis erst nach der Antwort unseres Teams fest." },
      { question: "Welches Fahrzeug bekomme ich?", answer: "Je nach Fahrgästen und Gepäck: Limousine mit bis zu 3 oder Hiace / Van mit bis zu 10 Fahrgästen. Gepäck, Ausrüstung und Barrierefreiheit können eine andere Lösung erfordern." },
      { question: "Kann ich Kindersitze und Tauchausrüstung anmelden?", answer: "Ja, gib alles im Formular an. Kindersitze sind kostenlos, müssen vorab angefragt werden und sind nach Verfügbarkeit erhältlich." },
      { question: "Wie buche ich die Rückfahrt?", answer: "Wähle Hin- und Rückfahrt mit eigenem Abholdatum und eigener Uhrzeit. Die Orte werden für die Rückfahrt vertauscht. Gib die gewünschte Abholzeit an, nicht die Abflugzeit." },
    ], policyTitle: "Fahrgast- und Fahrzeugrichtlinie für private Transfers", policyIntro: "So wählen wir dein Fahrzeug und bestätigen die Fahrt.", meeting: "Dein Fahrer trifft dich am vereinbarten Abholort. Bei Flughafenabholungen bestätigen wir die Treffpunktinformationen vor der Fahrt.", homeText: "Private Flughafen-, Hotel- und Marinatransfers in Hurghada und Marsa Alam. Wähle deine Route für einen Fahrzeugpreis oder ein Angebot.",
  },
  ru: {
    title: "Частные трансферы в Хургаде и Марса-Аламе", description: "Частные поездки между аэропортами, отелями, курортами и маринами Хургады и Марса-Алама. Укажите маршрут для расчёта цены за автомобиль или запроса предложения.",
    book: "Заказать частный трансфер", intro: "Ваш маршрут, ваш автомобиль", pickup: "Место отправления", dropoff: "Место назначения", placeholder: "Аэропорт, отель, марина или полный адрес", routeHint: "Выберите аэропорт из подсказок или укажите точный адрес. Для аэропорта Марса-Алам и маршрутов без цены команда подготовит предложение до подтверждения.",
    date: "Дата подачи", time: "Время подачи", swap: "Поменять места отправления и назначения", other: "Отели и марины", returnHint: "Обратная поездка следует по маршруту в обратную сторону. Укажите время подачи после поездки туда.", routeError: "Укажите разные места отправления и назначения.", returnError: "Выберите обратную подачу после поездки туда.", manualRoute: "Для этого маршрута нужен расчёт. Команда подтвердит автомобиль и полную цену до оформления.", manualPrivate: "Поездки между отелями, маринами и другие частные маршруты рассчитываются индивидуально.", flight: "Номер рейса (необязательно)",
    vehicleTitle: "Автомобили для вашей группы", sedan: "Частный седан", van: "Частный Hiace / минивэн", fleetNote: "Подбираем автомобиль по пассажирам и багажу. Дополнительные сумки могут потребовать более крупного или нескольких автомобилей. Марка и модель могут отличаться.", passengers: "пассажиров", bags: "больших чемодана", cabinBags: "мест ручной клади", routeTitle: "Куда вы хотите поехать?",
    routeGroups: [
      { title: "Хургада и ближайшие курорты", text: "Аэропорт, отели и марины Хургады, Эль-Гуны, Сахл-Хашиша, Макади-Бей, Сома-Бей и Сафаги." },
      { title: "Марса-Алам и Порт-Галиб", text: "Запросите поездку из аэропорта Марса-Алам или в него, в Порт-Галиб, Эль-Кусейр, отели и марины Марса-Алама." },
      { title: "Между курортами и городами", text: "Смена отеля и дальние частные поездки по побережью, включая Хургаду–Марса-Алам, по индивидуальному предложению." },
    ], benefits: ["Автомобиль только для вашей группы", "Цена за автомобиль и поездку", "В одну сторону или туда-обратно"], faqTitle: "Вопросы о частных трансферах",
    faqs: [
      { question: "Можно заказать поездку без аэропорта?", answer: "Да. Укажите отель, курорт, марину или точный адрес отправления и назначения. Команда индивидуально подтвердит наличие и полную цену." },
      { question: "Есть трансферы из аэропорта Марса-Алам?", answer: "Можно запросить поездки из аэропорта Марса-Алам (RMF) и обратно, в Порт-Галиб и отели Марса-Алама. Требуется отдельный расчёт: тарифы аэропорта Хургады не применяются." },
      { question: "Цена указана за человека или автомобиль?", answer: "За автомобиль и поездку. Общая цена туда-обратно включает обе части и все выделенные машины. При запросе предложения цена подтверждается командой отдельно." },
      { question: "Какой автомобиль будет?", answer: "По числу пассажиров и багажу: седан до 3 пассажиров или Hiace / минивэн до 10. Багаж, снаряжение и доступность могут потребовать другого решения." },
      { question: "Можно запросить детские кресла и провезти дайвинг-снаряжение?", answer: "Да, укажите всё в форме. Детские кресла бесплатны, запрашиваются заранее и предоставляются при наличии." },
      { question: "Как заказать обратную поездку?", answer: "Выберите туда-обратно и отдельные дату и время подачи. Места меняются местами. Указывайте время подачи автомобиля, а не вылета." },
    ], policyTitle: "Правила для пассажиров и автомобилей частных трансферов", policyIntro: "Как мы подбираем автомобиль и подтверждаем поездку.", meeting: "Водитель встретит вас в согласованном месте. Для аэропорта сообщим инструкции по встрече до поездки.", homeText: "Частные трансферы между аэропортами, отелями и маринами Хургады и Марса-Алама. Выберите маршрут для цены за автомобиль или предложения.",
  },
  ar: {
    title: "تنقلات خاصة في الغردقة ومرسى علم", description: "تنقلات خاصة بين المطارات والفنادق والمنتجعات والمراسي في الغردقة ومرسى علم. اختر نقطة الاستلام والوجهة لعرض سعر المركبة أو طلب عرض سعر.",
    book: "احجز تنقلاً خاصاً", intro: "مسارك ومركبتك الخاصة", pickup: "نقطة الاستلام", dropoff: "الوجهة", placeholder: "المطار أو الفندق أو المرسى أو العنوان الكامل", routeHint: "اختر المطار من الاقتراحات أو أدخل اسم الفندق أو المرسى أو العنوان بالتحديد. يؤكد فريقنا سعر رحلات مطار مرسى علم والمسارات التي لا يظهر لها سعر قبل التأكيد.",
    date: "تاريخ الاستلام", time: "وقت الاستلام", swap: "تبديل نقطة الاستلام والوجهة", other: "الفنادق والمراسي", returnHint: "تسلك العودة المسار العكسي. أدخل موعد الاستلام من وجهتك بعد رحلة الذهاب.", routeError: "أدخل نقطتي استلام ووصول مختلفتين.", returnError: "اختر موعد عودة بعد رحلة الذهاب.", manualRoute: "يحتاج هذا المسار إلى عرض سعر. يؤكد فريقنا المركبة والسعر الكامل قبل الالتزام بالحجز.", manualPrivate: "تُسعّر الرحلات بين الفنادق والمراسي والمسارات الخاصة الأخرى بشكل منفصل.", flight: "رقم الرحلة الجوية (اختياري)",
    vehicleTitle: "مركبات تناسب مجموعتك", sedan: "سيارة سيدان خاصة", van: "هايس / فان خاص", fleetNote: "نختار المركبة وفق عدد الركاب والأمتعة. قد تتطلب الحقائب الإضافية مركبة أكبر أو عدة مركبات. قد تختلف الماركة والطراز.", passengers: "ركاب", bags: "حقائب كبيرة", cabinBags: "حقائب يد", routeTitle: "إلى أين ترغب في الذهاب؟",
    routeGroups: [
      { title: "الغردقة والمنتجعات القريبة", text: "رحلات المطار والفنادق والمراسي في الغردقة والجونة وسهل حشيش ومكادي باي وسوما باي وسفاجا." },
      { title: "مرسى علم وبورت غالب", text: "اطلب تنقلاً من أو إلى مطار مرسى علم وبورت غالب والقصير وفنادق ومراسي مرسى علم." },
      { title: "بين المنتجعات والمدن", text: "رحلات بين الفنادق وتنقلات خاصة طويلة على ساحل البحر الأحمر، بما فيها الغردقة إلى مرسى علم، بعرض سعر." },
    ], benefits: ["مركبة خاصة لمجموعتك", "السعر لكل مركبة ولكل رحلة", "ذهاب فقط أو ذهاب وعودة"], faqTitle: "أسئلة عن التنقلات الخاصة",
    faqs: [
      { question: "هل يمكن حجز تنقل لا يشمل المطار؟", answer: "نعم. أدخل الفندق أو المنتجع أو المرسى أو العنوان الكامل للاستلام والوصول. يؤكد فريقنا التوفر والسعر الكامل لكل مسار قبل تأكيد الحجز." },
      { question: "هل تنظمون تنقلات مطار مرسى علم؟", answer: "يمكن طلب رحلات من وإلى مطار مرسى علم (RMF) وبورت غالب وفنادق مرسى علم. تحتاج هذه المسارات إلى عرض سعر منفصل؛ لا تنطبق عليها أسعار مطار الغردقة." },
      { question: "هل السعر لكل شخص أم لكل مركبة؟", answer: "لكل مركبة ولكل رحلة. يشمل إجمالي الذهاب والعودة المعروض الاتجاهين وجميع المركبات المخصصة. لا يكون سعر طلب العرض مؤكداً حتى يرد فريقنا." },
      { question: "ما المركبة التي سأحصل عليها؟", answer: "وفق عدد الركاب والأمتعة: سيدان حتى 3 ركاب أو هايس / فان حتى 10 ركاب. قد تتطلب الأمتعة والمعدات واحتياجات الإتاحة ترتيباً مختلفاً." },
      { question: "هل يمكن طلب مقاعد أطفال ونقل معدات الغوص؟", answer: "نعم، اذكر جميع التفاصيل في النموذج. مقاعد الأطفال مجانية وتُطلب مسبقاً وهي رهن التوفر." },
      { question: "كيف أحجز رحلة العودة؟", answer: "اختر ذهاباً وعودة وحدد تاريخ ووقت الاستلام للعودة. تسلك العودة المسار العكسي. أدخل وقت استلامك المطلوب وليس موعد إقلاع الطائرة." },
    ], policyTitle: "سياسة الركاب والمركبات للتنقلات الخاصة", policyIntro: "كيف نختار مركبتك ونؤكد رحلتك.", meeting: "يقابلك السائق في نقطة الاستلام المتفق عليها. للاستقبال من المطار نؤكد تعليمات اللقاء قبل السفر.", homeText: "تنقلات خاصة بين المطارات والفنادق والمراسي في الغردقة ومرسى علم. اختر مسارك لعرض سعر المركبة أو طلب عرض سعر.",
  },
  pl: {
    title: "Prywatne transfery w Hurghadzie i Marsa Alam", description: "Prywatne przejazdy między lotniskami, hotelami, kurortami i marinami w Hurghadzie i Marsa Alam. Wybierz odbiór i cel, aby poznać cenę za pojazd lub poprosić o wycenę.",
    book: "Zarezerwuj prywatny transfer", intro: "Twoja trasa, Twój prywatny pojazd", pickup: "Miejsce odbioru", dropoff: "Miejsce docelowe", placeholder: "Lotnisko, hotel, marina lub pełny adres", routeHint: "Wybierz lotnisko z podpowiedzi lub wpisz dokładny adres. Transfery z lotniska Marsa Alam i trasy bez podanej ceny wyceni nasz zespół przed potwierdzeniem.",
    date: "Data odbioru", time: "Godzina odbioru", swap: "Zamień miejsce odbioru i cel", other: "Hotele i mariny", returnHint: "Powrót odbywa się tą samą trasą w przeciwną stronę. Podaj godzinę odbioru po przejeździe w pierwszą stronę.", routeError: "Podaj różne miejsca odbioru i docelowe.", returnError: "Wybierz powrót po przejeździe w pierwszą stronę.", manualRoute: "Ta trasa wymaga wyceny. Zespół potwierdzi pojazd i pełną cenę przed wiążącą rezerwacją.", manualPrivate: "Przejazdy między hotelami, marinami i inne prywatne trasy wyceniamy indywidualnie.", flight: "Numer lotu (opcjonalnie)",
    vehicleTitle: "Pojazdy dla Twojej grupy", sedan: "Prywatny sedan", van: "Prywatny Hiace / van", fleetNote: "Dobieramy pojazd do pasażerów i bagażu. Dodatkowe torby mogą wymagać większego lub kilku pojazdów. Marka i model mogą się różnić.", passengers: "pasażerów", bags: "duże walizki", cabinBags: "bagaże podręczne", routeTitle: "Dokąd chcesz jechać?",
    routeGroups: [
      { title: "Hurghada i pobliskie kurorty", text: "Przejazdy na lotnisko, do hoteli i marin w Hurghadzie, El Gouna, Sahl Hasheesh, Makadi Bay, Soma Bay i Safadze." },
      { title: "Marsa Alam i Port Ghalib", text: "Poproś o transfer z lub na lotnisko Marsa Alam, do Port Ghalib, El Quseir oraz hoteli i marin w Marsa Alam." },
      { title: "Między kurortami i miastami", text: "Zmiana hotelu i dłuższe prywatne przejazdy wzdłuż wybrzeża, w tym Hurghada–Marsa Alam, na zapytanie." },
    ], benefits: ["Prywatny pojazd dla Twojej grupy", "Cena za pojazd i przejazd", "W jedną stronę lub z powrotem"], faqTitle: "Pytania o prywatne transfery",
    faqs: [
      { question: "Czy można zamówić przejazd bez lotniska?", answer: "Tak. Podaj hotel, kurort, marinę lub pełny adres odbioru i celu. Zespół indywidualnie potwierdzi dostępność i pełną cenę." },
      { question: "Czy organizujecie transfery z lotniska Marsa Alam?", answer: "Możesz poprosić o przejazdy z i na lotnisko Marsa Alam (RMF), do Port Ghalib i hoteli w Marsa Alam. Potrzebna jest osobna wycena; stawki lotniska Hurghada nie mają zastosowania." },
      { question: "Cena jest za osobę czy za pojazd?", answer: "Za pojazd i przejazd. Wyświetlana cena powrotna obejmuje oba odcinki i wszystkie przydzielone pojazdy. Przy zapytaniu cenę potwierdza zespół." },
      { question: "Jaki pojazd otrzymam?", answer: "Zależnie od pasażerów i bagażu: sedan do 3 pasażerów lub Hiace / van do 10. Bagaż, sprzęt i potrzeby dostępności mogą wymagać innego rozwiązania." },
      { question: "Czy mogę zamówić foteliki i przewieźć sprzęt nurkowy?", answer: "Tak, podaj wszystko w formularzu. Foteliki są bezpłatne, wymagają wcześniejszego zamówienia i są dostępne w miarę możliwości." },
      { question: "Jak zamówić powrót?", answer: "Wybierz przejazd z powrotem i osobną datę oraz godzinę odbioru. Miejsca zamieniają się dla powrotu. Podaj godzinę odbioru, a nie odlotu." },
    ], policyTitle: "Zasady pasażerów i pojazdów przy prywatnych transferach", policyIntro: "Jak dobieramy pojazd i potwierdzamy przejazd.", meeting: "Kierowca spotka Cię w uzgodnionym miejscu. Przy odbiorze z lotniska potwierdzimy instrukcje spotkania przed podróżą.", homeText: "Prywatne transfery lotniskowe, hotelowe i do marin w Hurghadzie i Marsa Alam. Wybierz trasę, aby otrzymać cenę lub wycenę.",
  },
  zh: {
    title: "赫尔格达与马萨阿拉姆私人接送", description: "提供赫尔格达和马萨阿拉姆机场、酒店、度假村及码头之间的私人接送。选择上车地点和目的地，查看车辆价格或申请报价。",
    book: "预订私人接送", intro: "您的路线，您的专车", pickup: "上车地点", dropoff: "下车地点", placeholder: "机场、酒店、码头或完整地址", routeHint: "从建议中选择机场，或输入准确的酒店、码头或地址。马萨阿拉姆机场及未显示价格的路线由团队报价，确认后再预订。",
    date: "接送日期", time: "接送时间", swap: "交换上车和下车地点", other: "酒店与码头", returnHint: "返程按相反路线行驶。请输入去程之后在目的地的接送时间。", routeError: "请输入不同的上车和下车地点。", returnError: "请选择去程之后的返程接送时间。", manualRoute: "此路线需要报价。团队将在您确认预订前核实车辆和完整价格。", manualPrivate: "酒店、码头及其他私人路线单独报价。", flight: "航班号（可选）",
    vehicleTitle: "适合您团队的车辆", sedan: "私人轿车", van: "私人 Hiace／面包车", fleetNote: "根据乘客和行李安排车辆。额外行李可能需要更大或多辆车。品牌及型号可能不同。", passengers: "位乘客", bags: "件大行李", cabinBags: "件随身行李", routeTitle: "您想去哪里？",
    routeGroups: [
      { title: "赫尔格达及附近度假区", text: "赫尔格达、艾尔古纳、萨尔哈希什、马卡迪湾、索马湾和萨法加的机场、酒店及码头接送。" },
      { title: "马萨阿拉姆与加利卜港", text: "可申请往返马萨阿拉姆机场、加利卜港、库赛尔及马萨阿拉姆酒店和码头的接送。" },
      { title: "度假区及城市之间", text: "红海沿岸酒店间及长途私人接送，包括赫尔格达至马萨阿拉姆，单独报价。" },
    ], benefits: ["团队专享车辆", "按车辆及行程计价", "单程或往返"], faqTitle: "私人接送常见问题",
    faqs: [
      { question: "可以预订不经过机场的接送吗？", answer: "可以。输入酒店、度假村、码头或完整的上车及下车地址。团队将单独确认供应及完整价格。" },
      { question: "提供马萨阿拉姆机场接送吗？", answer: "可申请往返马萨阿拉姆机场（RMF）、加利卜港及马萨阿拉姆酒店的接送。这些路线需要单独报价，不适用赫尔格达机场价格。" },
      { question: "价格按人还是按车计算？", answer: "按车辆和行程计价。显示的往返总价包含两程及所有安排的车辆。报价申请的价格须由团队另行确认。" },
      { question: "会安排什么车辆？", answer: "根据乘客和行李安排：轿车最多3人，Hiace／面包车最多10人。行李、装备和无障碍需求可能需要其他安排。" },
      { question: "可以申请儿童座椅并携带潜水装备吗？", answer: "可以，请在表单中填写全部需求。儿童座椅免费，须提前申请并视供应情况而定。" },
      { question: "如何安排返程？", answer: "选择往返并填写单独的返程日期和时间。返程交换上车及下车地点。请输入希望接送的时间，而非航班起飞时间。" },
    ], policyTitle: "私人接送乘客与车辆政策", policyIntro: "我们如何选择车辆并确认行程。", meeting: "司机将在约定地点与您见面。机场接送的会合说明将在出行前确认。", homeText: "赫尔格达和马萨阿拉姆的机场、酒店及码头私人接送。选择路线以查看车辆价格或申请报价。",
  },
};
