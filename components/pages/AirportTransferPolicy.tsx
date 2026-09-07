import { lowestVehicleFare } from "@/lib/transfer-config";

type Locale = "en" | "de" | "ru" | "ar" | "pl" | "zh";
type Clause = { h: string; p: string };

const fromFare = `$${lowestVehicleFare()}`;

/**
 * Customer-facing "Airport Transfer Passenger & Vehicle Policy".
 * Reusable section — currently rendered on /transfers. Vehicle allocations
 * described here are typical, not a guarantee of a specific make or model.
 */
const CONTENT: Record<Locale, { title: string; intro: string; clauses: Clause[] }> = {
  en: {
    title: "Airport Transfer Passenger & Vehicle Policy",
    intro: "Plain-language rules for how we price airport transfers and choose your vehicle.",
    clauses: [
      { h: "Private transfer", p: "Your booking is private for your group. We do not add unrelated passengers." },
      { h: "Pricing", p: `Prices are per vehicle and per journey, not per person, unless a page clearly says otherwise. One-way transfers within Hurghada start from ${fromFare} per vehicle.` },
      { h: "Passenger numbers", p: "Adults, children and babies all count toward the vehicle's seating capacity." },
      { h: "Vehicle allocation", p: "We automatically select an appropriate vehicle for your passengers and luggage. Typical allocation: 1–3 guests a private sedan; 4–10 guests a private Hiace / van; 11+ guests multiple vehicles depending on the group and luggage. Vehicle make and model may vary — an equivalent or larger vehicle may be provided." },
      { h: "Luggage", p: "Standard allocation assumes normal airline luggage. Tell us if you are carrying an unusually large number of bags so we can send the right vehicle." },
      { h: "Oversized baggage", p: "Golf clubs, kite equipment, surfboards, bicycles, diving cases and similar oversized items must be declared during booking. A larger or additional vehicle may be required." },
      { h: "Babies and children", p: "Children and babies count as passengers. Infant, child and booster seats must be requested before the transfer and are subject to availability." },
      { h: "Strollers", p: "Foldable strollers are accepted but must be declared because they use luggage space." },
      { h: "Wheelchairs", p: "Foldable manual wheelchairs may be accepted when there is enough luggage space. Powered wheelchairs, mobility scooters and guests who need wheelchair-accessible transport require advance confirmation — we will not promise a suitable vehicle before our team confirms it." },
      { h: "Maximum occupancy", p: "We never exceed the legal or configured passenger capacity of a vehicle." },
      { h: "Two or more vehicles", p: "Additional vehicles are dispatched when the group exceeds one vehicle's seats, luggage exceeds safe storage, oversized equipment cannot fit, or accessibility needs require it. The displayed price reflects every allocated vehicle." },
      { h: "Flight details", p: "For airport pickups we collect your flight number so the team can check the pickup against the latest arrival information." },
      { h: "Meet & greet", p: "Your driver meets you at the agreed meeting point following current Hurghada Airport procedure, with a Daily Red Sea name sign." },
      { h: "Changes", p: "Contact us as soon as possible if your passenger numbers, luggage or equipment change — it may change the required vehicle and the price." },
    ],
  },
  de: {
    title: "Fahrgast- und Fahrzeugrichtlinie für Flughafentransfers",
    intro: "Verständliche Regeln dazu, wie wir Flughafentransfers berechnen und dein Fahrzeug auswählen.",
    clauses: [
      { h: "Privater Transfer", p: "Deine Buchung ist privat für deine Gruppe. Wir nehmen keine fremden Fahrgäste mit." },
      { h: "Preise", p: `Die Preise gelten pro Fahrzeug und pro Fahrt, nicht pro Person, sofern eine Seite es nicht ausdrücklich anders angibt. Einfache Transfers innerhalb Hurghadas ab ${fromFare} pro Fahrzeug.` },
      { h: "Fahrgastzahl", p: "Erwachsene, Kinder und Babys zählen alle zur Sitzplatzkapazität des Fahrzeugs." },
      { h: "Fahrzeugauswahl", p: "Wir wählen automatisch ein passendes Fahrzeug für Fahrgäste und Gepäck. Übliche Zuordnung: 1–3 Gäste eine private Limousine; 4–10 Gäste ein privater Hiace / Van; 11+ Gäste mehrere Fahrzeuge. Marke und Modell können abweichen — ein gleichwertiges oder größeres Fahrzeug kann gestellt werden." },
      { h: "Gepäck", p: "Die Standardzuordnung geht von üblichem Fluggepäck aus. Sag uns Bescheid, wenn du ungewöhnlich viel Gepäck hast." },
      { h: "Übergroßes Gepäck", p: "Golfschläger, Kite-Ausrüstung, Surfbretter, Fahrräder, Tauchkoffer und ähnliche übergroße Gegenstände müssen bei der Buchung angegeben werden. Ein größeres oder zusätzliches Fahrzeug kann nötig sein." },
      { h: "Babys und Kinder", p: "Kinder und Babys zählen als Fahrgäste. Baby-, Kinder- und Sitzerhöhungen müssen vor dem Transfer angefragt werden und sind nach Verfügbarkeit." },
      { h: "Kinderwagen", p: "Faltbare Kinderwagen sind erlaubt, müssen aber angegeben werden, da sie Gepäckplatz benötigen." },
      { h: "Rollstühle", p: "Faltbare manuelle Rollstühle können mitgenommen werden, wenn genügend Gepäckplatz vorhanden ist. Elektrorollstühle, Mobilitätsscooter und Gäste, die einen barrierefreien Transport benötigen, erfordern eine vorherige Bestätigung." },
      { h: "Maximale Belegung", p: "Wir überschreiten nie die zulässige Fahrgastkapazität eines Fahrzeugs." },
      { h: "Zwei oder mehr Fahrzeuge", p: "Zusätzliche Fahrzeuge werden eingesetzt, wenn die Gruppe die Sitzplätze übersteigt, das Gepäck den sicheren Stauraum übersteigt oder übergroße Ausrüstung nicht passt. Der angezeigte Preis umfasst alle Fahrzeuge." },
      { h: "Flugdaten", p: "Für Flughafenabholungen erfassen wir deine Flugnummer, damit das Team die Abholung mit den aktuellen Ankunftsdaten abgleichen kann." },
      { h: "Meet & Greet", p: "Dein Fahrer erwartet dich am vereinbarten Treffpunkt gemäß dem aktuellen Verfahren des Flughafens Hurghada, mit einem Daily-Red-Sea-Namensschild." },
      { h: "Änderungen", p: "Kontaktiere uns so früh wie möglich, wenn sich Fahrgastzahl, Gepäck oder Ausrüstung ändern — das kann Fahrzeug und Preis ändern." },
    ],
  },
  ru: {
    title: "Правила по пассажирам и транспорту для трансферов из аэропорта",
    intro: "Понятные правила о том, как мы рассчитываем трансферы и подбираем автомобиль.",
    clauses: [
      { h: "Частный трансфер", p: "Ваше бронирование частное, только для вашей группы. Мы не подсаживаем посторонних пассажиров." },
      { h: "Цены", p: `Цены указываются за автомобиль и за поездку, а не за человека, если на странице явно не указано иное. Трансферы в одну сторону по Хургаде — от ${fromFare} за автомобиль.` },
      { h: "Количество пассажиров", p: "Взрослые, дети и младенцы учитываются в пассажировместимости автомобиля." },
      { h: "Подбор автомобиля", p: "Мы автоматически подбираем подходящий автомобиль под пассажиров и багаж. Обычно: 1–3 гостя — седан; 4–10 гостей — Hiace / минивэн; 11+ гостей — несколько автомобилей. Марка и модель могут отличаться; может быть предоставлен равноценный или более вместительный автомобиль." },
      { h: "Багаж", p: "Стандартный подбор рассчитан на обычный авиабагаж. Сообщите, если у вас необычно много сумок." },
      { h: "Негабаритный багаж", p: "Клюшки для гольфа, кайт-оборудование, доски для сёрфинга, велосипеды, кофры для дайвинга и подобное необходимо указывать при бронировании. Может потребоваться более крупный или дополнительный автомобиль." },
      { h: "Младенцы и дети", p: "Дети и младенцы считаются пассажирами. Детские и бустерные кресла нужно запрашивать заранее, они предоставляются при наличии." },
      { h: "Коляски", p: "Складные коляски принимаются, но их нужно указывать, так как они занимают место багажа." },
      { h: "Инвалидные коляски", p: "Складные механические коляски могут быть приняты при наличии места. Электроколяски, скутеры и гости, которым нужен доступный транспорт, требуют предварительного подтверждения." },
      { h: "Максимальная вместимость", p: "Мы никогда не превышаем допустимую вместимость автомобиля." },
      { h: "Два и более автомобиля", p: "Дополнительные автомобили подаются, если группа превышает число мест, багаж превышает безопасный объём или негабарит не помещается. Показанная цена учитывает все автомобили." },
      { h: "Данные о рейсе", p: "Для встреч в аэропорту мы запрашиваем номер рейса, чтобы сверить подачу с актуальным временем прибытия." },
      { h: "Встреча", p: "Водитель встречает вас в согласованном месте по действующим правилам аэропорта Хургады, с табличкой Daily Red Sea." },
      { h: "Изменения", p: "Свяжитесь с нами как можно раньше, если меняются число пассажиров, багаж или оборудование — это может изменить автомобиль и цену." },
    ],
  },
  ar: {
    title: "سياسة الركاب والمركبات لخدمة نقل المطار",
    intro: "قواعد واضحة حول كيفية تسعير خدمات نقل المطار واختيار مركبتك.",
    clauses: [
      { h: "نقل خاص", p: "حجزك خاص لمجموعتك فقط. لا نضيف ركاباً من خارج مجموعتك." },
      { h: "التسعير", p: `الأسعار لكل مركبة ولكل رحلة، وليست لكل شخص، ما لم تُوضّح الصفحة خلاف ذلك. تبدأ رحلات الاتجاه الواحد داخل الغردقة من ${fromFare} لكل مركبة.` },
      { h: "عدد الركاب", p: "يُحسب البالغون والأطفال والرُّضّع جميعاً ضمن السعة المقعدية للمركبة." },
      { h: "اختيار المركبة", p: "نختار تلقائياً مركبة مناسبة لعدد الركاب والأمتعة. التوزيع المعتاد: 1–3 ضيوف سيارة سيدان خاصة؛ 4–10 ضيوف مركبة هايس / فان خاصة؛ 11 ضيفاً فأكثر عدة مركبات. قد تختلف ماركة المركبة وطرازها، وقد تُوفَّر مركبة مماثلة أو أكبر." },
      { h: "الأمتعة", p: "يفترض التوزيع القياسي أمتعة طيران عادية. أخبرنا إذا كان لديك عدد كبير غير معتاد من الحقائب." },
      { h: "الأمتعة كبيرة الحجم", p: "يجب الإفصاح عند الحجز عن مضارب الغولف ومعدات الطائرات الورقية وألواح ركوب الأمواج والدراجات وحقائب الغوص وما شابهها. قد تلزم مركبة أكبر أو إضافية." },
      { h: "الرُّضّع والأطفال", p: "يُحسب الأطفال والرُّضّع كركاب. يجب طلب مقاعد الرُّضّع والأطفال والمقاعد الداعمة قبل الرحلة، وهي رهن التوفر." },
      { h: "عربات الأطفال", p: "تُقبل عربات الأطفال القابلة للطي، لكن يجب الإفصاح عنها لأنها تشغل مساحة الأمتعة." },
      { h: "الكراسي المتحركة", p: "قد تُقبل الكراسي المتحركة اليدوية القابلة للطي عند توفر مساحة كافية للأمتعة. أما الكراسي الكهربائية وسكوترات الحركة والضيوف الذين يحتاجون نقلاً مهيأً للكراسي المتحركة فتتطلب تأكيداً مسبقاً." },
      { h: "الحد الأقصى للركاب", p: "لا نتجاوز أبداً السعة القانونية أو المحددة لعدد ركاب المركبة." },
      { h: "مركبتان أو أكثر", p: "تُرسَل مركبات إضافية عندما تتجاوز المجموعة مقاعد مركبة واحدة، أو تتجاوز الأمتعة سعة التخزين الآمنة، أو لا تتسع المعدات كبيرة الحجم. يعكس السعر المعروض جميع المركبات المخصصة." },
      { h: "تفاصيل الرحلة الجوية", p: "لعمليات الاستقبال من المطار نطلب رقم رحلتك ليتحقق الفريق من موعد الاستلام وفق أحدث معلومات الوصول." },
      { h: "الاستقبال", p: "يستقبلك السائق في نقطة اللقاء المتفق عليها وفق الإجراء المعمول به في مطار الغردقة، حاملاً لافتة باسمك من Daily Red Sea." },
      { h: "التغييرات", p: "تواصل معنا في أقرب وقت إذا تغيّر عدد الركاب أو الأمتعة أو المعدات، فقد يغيّر ذلك المركبة المطلوبة والسعر." },
    ],
  },
  pl: {
    title: "Zasady dotyczące pasażerów i pojazdów przy transferach lotniskowych",
    intro: "Zrozumiałe zasady wyceny transferów lotniskowych i doboru pojazdu.",
    clauses: [
      { h: "Transfer prywatny", p: "Twoja rezerwacja jest prywatna dla Twojej grupy. Nie dołączamy obcych pasażerów." },
      { h: "Ceny", p: `Ceny są za pojazd i za przejazd, nie za osobę, chyba że strona wyraźnie stanowi inaczej. Transfery w jedną stronę w Hurghadzie od ${fromFare} za pojazd.` },
      { h: "Liczba pasażerów", p: "Dorośli, dzieci i niemowlęta liczą się do liczby miejsc w pojeździe." },
      { h: "Dobór pojazdu", p: "Automatycznie dobieramy pojazd do liczby pasażerów i bagażu. Typowo: 1–3 gości prywatny sedan; 4–10 gości prywatny Hiace / van; 11+ gości kilka pojazdów. Marka i model mogą się różnić — może zostać podstawiony pojazd równorzędny lub większy." },
      { h: "Bagaż", p: "Standardowy dobór zakłada typowy bagaż lotniczy. Poinformuj nas o nietypowo dużej liczbie toreb." },
      { h: "Bagaż ponadwymiarowy", p: "Kije golfowe, sprzęt do kitesurfingu, deski surfingowe, rowery, walizki nurkowe i podobne przedmioty należy zgłosić przy rezerwacji. Może być potrzebny większy lub dodatkowy pojazd." },
      { h: "Niemowlęta i dzieci", p: "Dzieci i niemowlęta liczą się jako pasażerowie. Foteliki dla niemowląt, dzieci i podstawki należy zamówić przed transferem — w miarę dostępności." },
      { h: "Wózki dziecięce", p: "Składane wózki są akceptowane, ale trzeba je zgłosić, bo zajmują miejsce bagażowe." },
      { h: "Wózki inwalidzkie", p: "Składane wózki manualne mogą zostać przyjęte, gdy jest wystarczające miejsce bagażowe. Wózki elektryczne, skutery i goście wymagający transportu dostosowanego wymagają wcześniejszego potwierdzenia." },
      { h: "Maksymalne obłożenie", p: "Nigdy nie przekraczamy prawnej ani ustalonej liczby miejsc w pojeździe." },
      { h: "Dwa lub więcej pojazdów", p: "Dodatkowe pojazdy są wysyłane, gdy grupa przekracza liczbę miejsc, bagaż przekracza bezpieczną pojemność lub sprzęt ponadwymiarowy się nie mieści. Wyświetlana cena obejmuje wszystkie pojazdy." },
      { h: "Dane lotu", p: "Przy odbiorach z lotniska pobieramy numer lotu, aby zespół mógł sprawdzić odbiór względem aktualnych danych przylotu." },
      { h: "Powitanie", p: "Kierowca czeka w uzgodnionym miejscu zgodnie z aktualną procedurą lotniska w Hurghadzie, z tabliczką Daily Red Sea." },
      { h: "Zmiany", p: "Skontaktuj się z nami jak najszybciej, jeśli zmieni się liczba pasażerów, bagaż lub sprzęt — może to zmienić pojazd i cenę." },
    ],
  },
  zh: {
    title: "机场接送乘客与车辆政策",
    intro: "关于我们如何为机场接送定价并选择车辆的通俗说明。",
    clauses: [
      { h: "私人接送", p: "您的预订仅供您的团队私享，我们不会拼载无关乘客。" },
      { h: "价格", p: `除非页面另有明确说明，价格按车辆、按行程计算，而非按人计算。赫尔格达市内单程接送每车起价 ${fromFare}。` },
      { h: "乘客人数", p: "成人、儿童和婴儿都计入车辆座位容量。" },
      { h: "车辆分配", p: "我们根据乘客和行李自动选择合适车辆。通常：1–3 位客人私人轿车；4–10 位客人私人 Hiace／面包车；11 位以上多辆车。品牌和型号可能不同，可能提供同级或更大车辆。" },
      { h: "行李", p: "标准分配假设为普通航空行李。如果行李数量异常多，请告知我们。" },
      { h: "超大行李", p: "高尔夫球杆、风筝冲浪装备、冲浪板、自行车、潜水箱等超大物品必须在预订时申报，可能需要更大或额外的车辆。" },
      { h: "婴儿和儿童", p: "儿童和婴儿计为乘客。婴儿座椅、儿童座椅和增高垫须提前申请，视供应情况而定。" },
      { h: "婴儿车", p: "可折叠婴儿车可接受，但须申报，因为会占用行李空间。" },
      { h: "轮椅", p: "在行李空间充足时可接受可折叠手动轮椅。电动轮椅、代步车以及需要无障碍车辆的客人须提前确认。" },
      { h: "最大载客量", p: "我们绝不超过车辆的法定或设定乘客容量。" },
      { h: "两辆或多辆车", p: "当团队超过一辆车座位、行李超过安全存放容量或超大装备无法安全放置时，会派出额外车辆。所显示价格已包含所有分配车辆。" },
      { h: "航班信息", p: "机场接机时我们会收集您的航班号，以便团队根据最新到达信息核对接机时间。" },
      { h: "接机", p: "司机会按赫尔格达机场现行流程在约定地点持 Daily Red Sea 姓名牌迎接您。" },
      { h: "变更", p: "如乘客人数、行李或装备有变化，请尽快联系我们，这可能改变所需车辆和价格。" },
    ],
  },
};

export default function AirportTransferPolicy({ locale = "en" }: { locale?: Locale }) {
  const content = CONTENT[locale] ?? CONTENT.en;
  return (
    <section aria-labelledby="airport-transfer-policy-title" className="border-t border-line bg-white px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="font-semibold uppercase tracking-[0.24em] text-ocean">{content.intro}</p>
        <h2 id="airport-transfer-policy-title" className="mt-3 text-3xl font-bold text-ink sm:text-4xl">{content.title}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {content.clauses.map((clause) => (
            <div key={clause.h} className="rounded-2xl border border-line bg-surface-muted p-5">
              <h3 className="font-bold text-ink">{clause.h}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{clause.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
