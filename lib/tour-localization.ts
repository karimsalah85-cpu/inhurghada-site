import type { Tour } from "@/data/tours";
import type { Locale } from "@/lib/i18n";
import { localizeSnorkelingBoatTrip } from "@/data/snorkeling-boat-trips";
import { applyTourMediaSafety } from "@/lib/tour-media-safety";

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
  "padi-open-water-course": {
    title: "دورة PADI للغوص في المياه المفتوحة لمدة 3 أيام", location: "الغردقة، مصر", duration: "3 أيام", category: "غوص",
    description: "تعلّم أساسيات الغوص من خلال الدروس النظرية والتدريب العملي والغطسات التدريبية تحت إشراف مدرب PADI في البحر الأحمر. تُمنح الشهادة بعد استكمال جميع المتطلبات بنجاح.",
    highlights: ["دورة PADI دولية لمدة ثلاثة أيام", "غطستان تدريبيتان يومياً", "دروس نظرية وتدريب عملي", "مدرب معتمد من PADI", "تدريب في البحر الأحمر"],
    included: ["الدورة لمدة 3 أيام وغطستان يومياً", "مدرب PADI معتمد", "معدات الغوص القياسية", "حزام الأثقال واسطوانات 12 لتراً", "الغداء والمشروبات يومياً", "الاستلام والتوصيل ضمن منطقة الفندق المؤكدة"],
    notIncluded: ["الضريبة البحرية: 5 يورو يومياً للشخص", "كتاب PADI النظري والشهادة والتسجيل: 100 يورو للشخص", "الإكراميات", "الصور", "الطيران والتأشيرة والإقامة", "الفحص الطبي إذا لزم"],
    notes: ["إلغاء مجاني حتى 24 ساعة قبل بداية الدورة.", "تبدأ الدورة الساعة 08:00 في اليوم الأول، ويُؤكد الاستلام عبر واتساب.", "يلزم ملء استبيان طبي والقدرة المناسبة على السباحة.", "يحتاج من هم دون 18 عاماً إلى موافقة ولي أمر موقعة.", "لا تسافر بالطائرة قبل انتهاء فترة منع الطيران التي يحددها مركز الغوص."],
    packageName: "دورة PADI للمياه المفتوحة لمدة 3 أيام", packageDescription: "تدريب نظري وعملي لمدة ثلاثة أيام مع غطستين يومياً والمعدات والغداء والمشروبات والتوصيل.", packageLabel: "متدرب", ageBands: { adults: "المتدربون (10 سنوات فأكثر)", children: "", infants: "" }, availableTimes: ["08:00"],
    notSuitableFor: ["الأطفال دون 10 سنوات", "الحوامل", "مرضى القلب أو الظهر", "من لا يستوفي المتطلبات الطبية ومتطلبات السباحة"], whatToBring: ["جواز سفر أو بطاقة هوية", "منشفة", "ملابس سباحة", "نظارة شمسية"], seoTitle: "دورة PADI للمياه المفتوحة لمدة 3 أيام في الغردقة", metaDescription: "احجز دورة PADI للمياه المفتوحة في الغردقة لمدة ثلاثة أيام مع غطستين يومياً والمعدات والغداء والمشروبات والتوصيل."
  },
  "ssi-open-water-course": {
    title: "دورة SSI للغوص في المياه المفتوحة لمدة 3 أيام", location: "الغردقة، مصر", duration: "3 أيام", category: "غوص",
    description: "تعلّم المعارف والمهارات اللازمة لتصبح غواص SSI للمياه المفتوحة من خلال الدراسة الرقمية والتدريب في المياه والغطسات التدريبية في البحر الأحمر.",
    highlights: ["برنامج SSI لمدة ثلاثة أيام", "تعلم رقمي وتدريب عملي", "غطستان تدريبيتان يومياً", "محترف غوص معتمد من SSI", "تدريب في البحر الأحمر"],
    included: ["تدريب SSI لمدة 3 أيام", "محترف غوص معتمد من SSI", "التعلم الرقمي وتسجيل الشهادة", "معدات الغوص القياسية", "الغداء والمشروبات يومياً", "الاستلام والتوصيل ضمن المنطقة المؤكدة"],
    notIncluded: ["الضريبة البحرية: 5 يورو يومياً للشخص", "الإكراميات", "الصور", "الطيران والتأشيرة والإقامة", "الفحص الطبي إذا لزم"],
    notes: ["إلغاء مجاني حتى 24 ساعة قبل البداية.", "تبدأ الدورة الساعة 08:00 ويُؤكد الاستلام عبر واتساب.", "الحد الأدنى للعمر 10 سنوات، ويحتاج من هم دون 18 عاماً إلى موافقة ولي الأمر.", "تُمنح الشهادة بعد اجتياز متطلبات SSI النظرية والعملية.", "تطبق حدود العمق والإشراف الخاصة بالناشئين.", "لا تسافر بالطائرة قبل انتهاء فترة منع الطيران المطلوبة."],
    packageName: "دورة SSI للمياه المفتوحة لمدة 3 أيام", packageDescription: "تعلم رقمي وتدريب عملي لمدة ثلاثة أيام مع غطستين يومياً والمعدات والغداء والمشروبات والتوصيل.", packageLabel: "متدرب", ageBands: { adults: "المتدربون (10 سنوات فأكثر)", children: "", infants: "" }, availableTimes: ["08:00"],
    notSuitableFor: ["الأطفال دون 10 سنوات", "الحوامل", "مرضى القلب أو الظهر", "من لا يستوفي المتطلبات الطبية ومتطلبات السباحة"], whatToBring: ["جواز سفر أو بطاقة هوية", "منشفة", "ملابس سباحة", "نظارة شمسية"], seoTitle: "دورة SSI للمياه المفتوحة لمدة 3 أيام في الغردقة", metaDescription: "احجز دورة SSI للمياه المفتوحة في الغردقة مع التعلم الرقمي وغطستين يومياً والمعدات والغداء والتوصيل."
  },
  "dolphin-house-snorkeling": {
    title: "رحلة دولفين هاوس والسنوركلينج من الغردقة", description: "رحلة يخت لمدة سبع ساعات إلى منطقة دولفين هاوس مع محطتين للسنوركلينج وغداء ومشروبات وتوصيل الفندق.",
    highlights: ["مشاهدة الدلافين البرية دون ضمان", "محطتان للسنوركلينج", "غداء ومشروبات على اليخت", "طاقم محترف ومعدات سلامة"], included: ["توصيل فنادق الغردقة", "رحلة يخت", "زيارة دولفين هاوس", "معدات السنوركلينج", "الغداء والمشروبات"],
    notes: ["مشاهدة الدلافين أو السباحة قربها غير مضمونة.", "قد يتغير المسار حسب الطقس وحالة البحر.", "يؤكد وقت الاستلام عبر واتساب."], packageName: "رحلة دولفين هاوس والسنوركلينج", ageBands: { adults: "البالغون (11 سنة فأكثر)", children: "الأطفال (4–10 سنوات)", infants: "الرضع (0–3 سنوات)" },
  },
  "hula-hula-island-snorkeling": {
    title: "رحلة جزيرة هولا هولا والسنوركلينج", description: "يوم كامل على يخت من الغردقة يشمل ساعة على جزيرة هولا هولا ومحطتين للسنوركلينج وغداء ومشروبات.",
    highlights: ["ساعة على جزيرة هولا هولا", "محطتان للسنوركلينج", "غداء ومشروبات", "توصيل فنادق الغردقة"], included: ["توصيل الفندق", "رحلة يخت", "دخول الجزيرة", "معدات ومرشد سنوركلينج", "الغداء والمشروبات"],
    notes: ["يؤكد وقت الاستلام عبر واتساب.", "الرحلة مناسبة للمبتدئين.", "قد تتغير مواقع الشعاب حسب حالة البحر."], packageName: "رحلة جزيرة هولا هولا", ageBands: { adults: "البالغون (11 سنة فأكثر)", children: "الأطفال (4–10 سنوات)", infants: "الرضع (0–3 سنوات)" },
  },
  "magawish-speedboat": {
    title: "قارب سريع خاص إلى جزيرة مجاويش", description: "رحلة قارب سريع خاصة لمدة أربع ساعات لمجموعتك مع توصيل الغردقة وسنوركلينج ووقت حر في جزيرة مجاويش.",
    highlights: ["قارب سريع خاص", "جزيرة مجاويش", "سنوركلينج", "توصيل الفندق"], included: ["توصيل فنادق الغردقة", "القارب والقبطان والوقود", "معدات السنوركلينج", "معدات السلامة"],
    notes: ["رسم دخول الجزيرة 10 دولارات للشخص ويدفع منفصلاً.", "أحضر جواز السفر أو صورة منه.", "قد يتغير المسار حسب حالة البحر."], packageName: "قارب مجاويش الخاص", ageBands: { adults: "ركاب مجموعتك الخاصة", children: "", infants: "" },
  },
  "horse-riding-sea-desert": {
    title: "ركوب الخيل في صحراء وبحر الغردقة مع سباحة اختيارية", location: "الغردقة، مصر", duration: "2–4 ساعات", category: "نشاط خارجي",
    description: "استكشف صحراء الغردقة وساحل البحر الأحمر على ظهر حصان مدرّب برفقة مرشد محترف، مع إمكانية دخول المياه الضحلة عندما تسمح الظروف.",
    highlights: ["ركوب الخيل في الصحراء والساحل", "سباحة اختيارية مع الخيل", "مناسب للمبتدئين وذوي الخبرة", "مرشد محترف", "توصيل من فنادق الغردقة"],
    included: ["جولة ركوب خيل بإرشاد", "حصان مدرّب", "خوذة أمان", "مياه", "الاستلام والتوصيل داخل الغردقة"], notIncluded: ["الإكراميات", "المصاريف الشخصية", "التصوير الاحترافي", "توصيل المناطق خارج الغردقة"],
    notes: ["إلغاء مجاني حتى 24 ساعة قبل النشاط.", "السباحة مع الخيل اختيارية وتعتمد على الطقس وحالة البحر وتقييم الإسطبل.", "يجب اتباع تعليمات المرشد وارتداء الخوذة.", "يؤكد الإسطبل ملاءمة العمر والوزن قبل الرحلة."],
    packageName: "ركوب خيل في صحراء وبحر الغردقة", packageDescription: "جولة لمدة ساعتين في الصحراء والساحل مع التوصيل ومعدات السلامة وسباحة اختيارية.", packageLabel: "راكب", ageBands: { adults: "الركاب (5 سنوات فأكثر)", children: "", infants: "" }, availableTimes: ["موعد صباحي يؤكد عبر واتساب", "موعد الغروب يؤكد عبر واتساب"],
    notSuitableFor: ["الأطفال دون 5 سنوات", "الحوامل", "من لديهم مشكلات خطيرة في الظهر أو الحركة", "مستخدمو الكراسي المتحركة", "من يزيد وزنهم على 110 كجم دون موافقة الإسطبل"], whatToBring: ["بنطال طويل", "حذاء مغلق", "واقي شمس", "نظارة شمسية", "ملابس سباحة ومنشفة عند اختيار السباحة"]
  },
  "sahl-hasheesh-horse-riding": {
    title: "ركوب الخيل في صحراء وبحر سهل حشيش مع سباحة اختيارية", location: "سهل حشيش، مصر", duration: "نحو ساعتين", category: "نشاط خارجي",
    description: "اركض على الرمال واستمتع بركوب الخيل بمحاذاة البحر الأحمر في سهل حشيش، مع دخول اختياري للمياه الضحلة عندما يكون ذلك آمناً.",
    highlights: ["مسارات الصحراء والساحل", "دخول اختياري للمياه", "خيول مدرّبة", "مرشد محلي خبير", "مناسب لمستويات مختلفة"],
    included: ["ركوب خيل في الصحراء والبحر", "حصان مدرّب", "مرشد محلي", "خوذة"], notIncluded: ["الإكراميات", "المصاريف الشخصية", "التصوير", "التوصيل ما لم يُذكر في الخيار"],
    notes: ["إلغاء مجاني حتى 24 ساعة قبل النشاط.", "يحدد المرشد وتقييم الإسطبل إمكانية السباحة.", "يجب تأكيد حدود العمر والوزن مع الإسطبل.", "لا تُنسخ تقييمات منصات أخرى إلى الموقع."],
    packageName: "ركوب خيل في صحراء وبحر سهل حشيش", packageDescription: "نحو ساعتين من ركوب الخيل في الصحراء والساحل مع جزء اختياري في المياه الضحلة.", packageLabel: "راكب", ageBands: { adults: "الركاب (العمر يؤكده الإسطبل)", children: "", infants: "" }, availableTimes: ["موعد صباحي يؤكد عبر واتساب", "موعد الغروب يؤكد عبر واتساب"],
    notSuitableFor: ["الحوامل", "من لديهم مشكلات خطيرة في الظهر أو الرقبة أو الحركة", "من هم خارج حدود العمر أو الوزن التي يؤكدها الإسطبل"], whatToBring: ["بنطال طويل", "حذاء مغلق", "واقي شمس", "نظارة شمسية", "ملابس سباحة ومنشفة عند اختيار السباحة"]
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
  "padi-open-water-course": {
    title: "3-tägiger PADI Open Water Diver Kurs", location: "Hurghada, Ägypten", duration: "3 Tage", category: "Tauchen",
    description: "Lerne in Theorieeinheiten und betreuten Ausbildungstauchgängen im Roten Meer die grundlegenden Tauchfertigkeiten. Die PADI-Zertifizierung erfolgt nach erfolgreichem Abschluss aller Wissens- und Wasseranforderungen.",
    highlights: ["International anerkannter PADI-Kurs", "Zwei betreute Tauchgänge pro Tag", "Theorie und praktische Freiwasserfertigkeiten", "PADI-zertifizierter Tauchlehrer", "Ausbildung im Roten Meer"],
    included: ["Dreitägiger Kurs mit zwei Tauchgängen täglich", "PADI-Tauchlehrer", "Standard-Tauchausrüstung", "Bleigurt und 12-Liter-Flaschen", "Mittagessen und Getränke an jedem Kurstag", "Transfer in der bestätigten Hotelzone"],
    notIncluded: ["Marinegebühr: 5 € pro Person und Tag", "PADI-Lehrmaterial, Zertifizierung und Registrierung: 100 € pro Person", "Trinkgeld", "Fotos", "Flug, Visum und Unterkunft", "Ärztliche Untersuchung falls erforderlich"],
    notes: ["Kostenlose Stornierung bis 24 Stunden vor Kursbeginn.", "Beginn am ersten Tag um 08:00 Uhr; Abholung per WhatsApp.", "Medizinischer Fragebogen und ausreichende Schwimmfähigkeit sind erforderlich.", "Unter 18-Jährige benötigen eine unterschriebene Zustimmung.", "Beachte nach dem letzten Tauchgang die vorgeschriebene Flugverbotszeit."],
    packageName: "3-tägiger PADI Open Water Kurs", packageDescription: "Drei Tage Theorie und Praxis mit zwei Tauchgängen täglich, Ausrüstung, Mittagessen, Getränken und Transfer.", packageLabel: "Teilnehmer", ageBands: { adults: "Teilnehmer (ab 10 Jahren)", children: "", infants: "" }, availableTimes: ["08:00"],
    notSuitableFor: ["Kinder unter 10 Jahren", "Schwangere", "Personen mit schweren Rücken- oder Herzproblemen", "Personen, die medizinische oder Schwimmanforderungen nicht erfüllen"], whatToBring: ["Reisepass oder Ausweis", "Handtuch", "Badebekleidung", "Sonnenbrille"], seoTitle: "3-tägiger PADI Open Water Kurs in Hurghada", metaDescription: "Buche einen dreitägigen PADI Open Water Kurs in Hurghada mit zwei Tauchgängen täglich, Ausrüstung, Mittagessen, Getränken und Transfer."
  },
  "ssi-open-water-course": {
    title: "3-tägiger SSI Open Water Diver Kurs", location: "Hurghada, Ägypten", duration: "3 Tage", category: "Tauchen",
    description: "Erlerne mit digitaler Theorie, Übungen im begrenzten Freiwasser und betreuten Ausbildungstauchgängen die Kenntnisse und Fertigkeiten für den SSI Open Water Diver.",
    highlights: ["Dreitägiges SSI-Programm", "Digitales Lernen und praktische Ausbildung", "Zwei betreute Tauchgänge pro Tag", "SSI-zertifizierter Tauchprofi", "Ausbildung im Roten Meer"],
    included: ["Dreitägige SSI-Ausbildung", "SSI-zertifizierter Tauchprofi", "Digitales Lernen und Zertifizierungsregistrierung", "Standard-Tauchausrüstung", "Mittagessen und Getränke", "Transfer in der bestätigten Hotelzone"],
    notIncluded: ["Marinegebühr: 5 € pro Person und Tag", "Trinkgeld", "Fotos", "Flug, Visum und Unterkunft", "Ärztliche Untersuchung falls erforderlich"],
    notes: ["Kostenlose Stornierung bis 24 Stunden vor Beginn.", "Beginn um 08:00 Uhr; Abholung per WhatsApp.", "Mindestalter 10 Jahre; Minderjährige benötigen eine unterschriebene Zustimmung.", "Die Zertifizierung setzt das erfolgreiche Erfüllen aller SSI-Anforderungen voraus.", "Für Junior-Teilnehmer gelten Tiefen- und Aufsichtsgrenzen.", "Beachte nach dem letzten Tauchgang die Flugverbotszeit."],
    packageName: "3-tägiger SSI Open Water Diver Kurs", packageDescription: "Drei Tage digitales Lernen und Praxistraining mit zwei Tauchgängen täglich, Ausrüstung, Verpflegung und Transfer.", packageLabel: "Teilnehmer", ageBands: { adults: "Teilnehmer (ab 10 Jahren)", children: "", infants: "" }, availableTimes: ["08:00"],
    notSuitableFor: ["Kinder unter 10 Jahren", "Schwangere", "Personen mit schweren Rücken- oder Herzproblemen", "Personen, die medizinische oder Schwimmanforderungen nicht erfüllen"], whatToBring: ["Reisepass oder Ausweis", "Handtuch", "Badebekleidung", "Sonnenbrille"], seoTitle: "3-tägiger SSI Open Water Diver Kurs in Hurghada", metaDescription: "Buche einen dreitägigen SSI Open Water Diver Kurs in Hurghada mit digitalem Lernen, zwei Tauchgängen täglich, Ausrüstung und Transfer."
  },
  "dolphin-house-snorkeling": {
    title: "Dolphin-House-Schnorcheltour ab Hurghada", description: "Siebenstündige Yachttour zum Dolphin House mit zwei Schnorchelstopps, Mittagessen, Getränken und Hoteltransfer.",
    highlights: ["Wilde Delfine mit etwas Glück", "Zwei Schnorchelstopps", "Mittagessen und Getränke", "Professionelle Crew"], included: ["Hoteltransfer in Hurghada", "Yachtfahrt", "Dolphin House", "Schnorchelausrüstung", "Mittagessen und Getränke"],
    notes: ["Delfinsichtungen und Schwimmen sind nicht garantiert.", "Route kann sich mit Wetter und Seegang ändern.", "Abholung wird per WhatsApp bestätigt."], packageName: "Dolphin-House-Schnorcheltour", ageBands: { adults: "Erwachsene (ab 11 Jahren)", children: "Kinder (4–10 Jahre)", infants: "Kleinkinder (0–3 Jahre)" },
  },
  "hula-hula-island-snorkeling": {
    title: "Hula-Hula-Insel Bootstour und Schnorcheln", description: "Ganztägige Yachttour mit einer Stunde auf Hula Hula Island, zwei Schnorchelstopps, Mittagessen und Getränken.",
    highlights: ["Eine Stunde auf Hula Hula Island", "Zwei Schnorchelstopps", "Mittagessen und Getränke", "Hoteltransfer"], included: ["Hoteltransfer", "Yachtfahrt", "Inselzugang", "Schnorchelausrüstung und Guide", "Mittagessen und Getränke"],
    notes: ["Abholung wird per WhatsApp bestätigt.", "Für Anfänger geeignet.", "Riffplätze können sich je nach Seegang ändern."], packageName: "Hula-Hula-Insel Bootstour", ageBands: { adults: "Erwachsene (ab 11 Jahren)", children: "Kinder (4–10 Jahre)", infants: "Kleinkinder (0–3 Jahre)" },
  },
  "magawish-speedboat": {
    title: "Privates Schnellboot zur Magawish-Insel", description: "Vierstündiges privates Schnellboot für deine Gruppe mit Hurghada-Transfer, Schnorchelstopp und Freizeit auf Magawish Island.",
    highlights: ["Exklusives privates Schnellboot", "Magawish Island", "Schnorchelstopp", "Hoteltransfer"], included: ["Hurghada-Hoteltransfer", "Boot, Kapitän und Treibstoff", "Schnorchelausrüstung", "Sicherheitsausrüstung"],
    notes: ["Inseleintritt 10 US-Dollar pro Person, separat zu zahlen.", "Reisepass oder Kopie mitbringen.", "Route kann sich je nach Seegang ändern."], packageName: "Privates Magawish-Schnellboot", ageBands: { adults: "Passagiere deiner privaten Gruppe", children: "", infants: "" },
  },
  "horse-riding-sea-desert": {
    title: "Reiten in Hurghadas Wüste und am Meer mit optionalem Schwimmen", location: "Hurghada, Ägypten", duration: "2–4 Stunden", category: "Outdoor-Aktivität",
    description: "Erkunde Wüstenwege und die Küste des Roten Meeres auf einem gut ausgebildeten Pferd. Bei sicheren Bedingungen ist ein optionaler Abschnitt im flachen Wasser möglich.",
    highlights: ["Reiten in Wüste und an der Küste", "Optionales Schwimmen mit Pferden", "Für Anfänger und Erfahrene", "Professioneller Guide", "Transfer innerhalb Hurghadas"],
    included: ["Geführtes Reiterlebnis", "Gut ausgebildetes Pferd", "Sicherheitshelm", "Wasser", "Hoteltransfer innerhalb Hurghadas"], notIncluded: ["Trinkgeld", "Persönliche Ausgaben", "Professionelle Fotos", "Transfer außerhalb Hurghadas"],
    notes: ["Kostenlose Stornierung bis 24 Stunden vorher.", "Der Wasserabschnitt hängt von Wetter, Meer und Stallfreigabe ab.", "Helm und Anweisungen des Guides sind verpflichtend.", "Alter und Gewicht werden vom Stall bestätigt."],
    packageName: "Wüsten- und Meer-Ausritt in Hurghada", packageDescription: "Zweistündiger geführter Ausritt mit Transfer, Sicherheitsausrüstung und optionalem Reiten im flachen Wasser.", packageLabel: "Reiter", ageBands: { adults: "Reiter (ab 5 Jahren)", children: "", infants: "" }, availableTimes: ["Morgentermin per WhatsApp", "Sonnenuntergangstermin per WhatsApp"],
    notSuitableFor: ["Kinder unter 5 Jahren", "Schwangere", "Personen mit schweren Rücken- oder Mobilitätsproblemen", "Rollstuhlfahrer", "Personen über 110 kg ohne ausdrückliche Stallfreigabe"], whatToBring: ["Lange Hose", "Geschlossene Schuhe", "Sonnenschutz", "Sonnenbrille", "Badebekleidung und Handtuch bei Wasseroption"]
  },
  "sahl-hasheesh-horse-riding": {
    title: "Wüsten- und Meer-Ausritt in Sahl Hasheesh mit optionalem Schwimmen", location: "Sahl Hasheesh, Ägypten", duration: "Etwa 2 Stunden", category: "Outdoor-Aktivität",
    description: "Reite durch die Wüste und entlang der Küste von Sahl Hasheesh. Bei sicheren Bedingungen kann ein optionaler Abschnitt im flachen Wasser stattfinden.",
    highlights: ["Wüsten- und Küstenwege", "Optionaler Wasserabschnitt", "Trainierte Pferde", "Erfahrener lokaler Guide", "Für verschiedene Erfahrungsstufen"],
    included: ["Wüsten- und Meer-Ausritt", "Trainiertes Pferd", "Lokaler Guide", "Helm"], notIncluded: ["Trinkgeld", "Persönliche Ausgaben", "Fotoservice", "Transfer, sofern nicht in der Option angegeben"],
    notes: ["Kostenlose Stornierung bis 24 Stunden vorher.", "Wasserabschnitt nur nach Freigabe durch Guide und Stall.", "Alters- und Gewichtsgrenzen müssen bestätigt werden.", "Bewertungen anderer Plattformen werden nicht übernommen."],
    packageName: "Wüsten- und Meer-Ausritt in Sahl Hasheesh", packageDescription: "Etwa zwei Stunden geführtes Reiten in Wüste und Küste mit optionalem flachen Wasserabschnitt.", packageLabel: "Reiter", ageBands: { adults: "Reiter (Alter durch Stall bestätigt)", children: "", infants: "" }, availableTimes: ["Morgentermin per WhatsApp", "Sonnenuntergangstermin per WhatsApp"],
    notSuitableFor: ["Schwangere", "Personen mit schweren Rücken-, Nacken- oder Mobilitätsproblemen", "Gäste außerhalb der bestätigten Alters- oder Gewichtsgrenzen"], whatToBring: ["Lange Hose", "Geschlossene Schuhe", "Sonnenschutz", "Sonnenbrille", "Badebekleidung und Handtuch bei Wasseroption"]
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
  "padi-open-water-course": {
    title: "Трёхдневный курс PADI Open Water Diver", location: "Хургада, Египет", duration: "3 дня", category: "Дайвинг",
    description: "Освойте базовые навыки дайвинга на теоретических занятиях и учебных погружениях в Красном море под руководством инструктора PADI. Сертификат выдаётся после успешного выполнения всех требований.",
    highlights: ["Международный курс PADI", "Два учебных погружения в день", "Теория и практика в открытой воде", "Инструктор PADI", "Обучение в Красном море"],
    included: ["Трёхдневный курс и два погружения ежедневно", "Инструктор PADI", "Стандартное снаряжение", "Грузовой пояс и 12-литровые баллоны", "Обед и напитки", "Трансфер в подтверждённой зоне отеля"],
    notIncluded: ["Морской сбор: 5 € с человека в день", "Учебник, сертификация и регистрация PADI: 100 € с человека", "Чаевые", "Фотографии", "Перелёт, виза и проживание", "Медосмотр при необходимости"],
    notes: ["Бесплатная отмена не позднее чем за 24 часа.", "Начало в 08:00 в первый день; трансфер подтверждается в WhatsApp.", "Необходимы медицинская анкета и достаточные навыки плавания.", "Участникам младше 18 лет требуется подписанное согласие.", "После последнего погружения соблюдайте установленный запрет на перелёты."],
    packageName: "Трёхдневный курс PADI Open Water", packageDescription: "Три дня теории и практики, два погружения ежедневно, снаряжение, питание и трансфер.", packageLabel: "Участник", ageBands: { adults: "Участники (от 10 лет)", children: "", infants: "" }, availableTimes: ["08:00"],
    notSuitableFor: ["Дети младше 10 лет", "Беременные", "Люди с серьёзными заболеваниями сердца или спины", "Гости, не отвечающие медицинским требованиям и требованиям к плаванию"], whatToBring: ["Паспорт или удостоверение личности", "Полотенце", "Купальник", "Солнцезащитные очки"]
  },
  "ssi-open-water-course": {
    title: "Трёхдневный курс SSI Open Water Diver", location: "Хургада, Египет", duration: "3 дня", category: "Дайвинг",
    description: "Изучите теорию в цифровом формате и освойте навыки в воде во время учебных погружений в Красном море. Сертификат SSI выдаётся после выполнения всех требований.",
    highlights: ["Трёхдневная программа SSI", "Цифровая теория и практика", "Два учебных погружения в день", "Специалист SSI", "Обучение в Красном море"],
    included: ["Трёхдневное обучение SSI", "Сертифицированный специалист SSI", "Цифровое обучение и регистрация сертификата", "Стандартное снаряжение", "Обед и напитки", "Трансфер в подтверждённой зоне"],
    notIncluded: ["Морской сбор: 5 € с человека в день", "Чаевые", "Фотографии", "Перелёт, виза и проживание", "Медосмотр при необходимости"],
    notes: ["Бесплатная отмена не позднее чем за 24 часа.", "Начало в 08:00; трансфер подтверждается в WhatsApp.", "Минимальный возраст 10 лет; несовершеннолетним требуется согласие родителя.", "Сертификация зависит от успешного выполнения требований SSI.", "Для юниоров действуют ограничения глубины и надзора.", "После погружений соблюдайте запрет на перелёты."],
    packageName: "Трёхдневный курс SSI Open Water Diver", packageDescription: "Три дня цифровой теории и практики, два погружения ежедневно, снаряжение, питание и трансфер.", packageLabel: "Участник", ageBands: { adults: "Участники (от 10 лет)", children: "", infants: "" }, availableTimes: ["08:00"],
    notSuitableFor: ["Дети младше 10 лет", "Беременные", "Люди с серьёзными заболеваниями сердца или спины", "Гости, не отвечающие медицинским требованиям и требованиям к плаванию"], whatToBring: ["Паспорт или удостоверение личности", "Полотенце", "Купальник", "Солнцезащитные очки"]
  },
  "dolphin-house-snorkeling": {
    title: "Морская прогулка в Дом дельфинов из Хургады", description: "Семичасовая прогулка на яхте в район Dolphin House с двумя остановками для сноркелинга, обедом, напитками и трансфером.",
    highlights: ["Наблюдение за дикими дельфинами", "Два сноркелинг-стопа", "Обед и напитки", "Профессиональная команда"], included: ["Трансфер из отеля", "Яхта", "Dolphin House", "Снаряжение", "Обед и напитки"],
    notes: ["Встреча с дельфинами и плавание не гарантируются.", "Маршрут зависит от погоды и моря.", "Время трансфера подтвердим в WhatsApp."], packageName: "Прогулка в Дом дельфинов", ageBands: { adults: "Взрослые (от 11 лет)", children: "Дети (4–10 лет)", infants: "Малыши (0–3 года)" },
  },
  "hula-hula-island-snorkeling": {
    title: "Остров Hula Hula: яхта и сноркелинг", description: "Полный день на яхте: час на острове Hula Hula, два сноркелинг-стопа, обед, напитки и трансфер из Хургады.",
    highlights: ["Час на острове Hula Hula", "Два сноркелинг-стопа", "Обед и напитки", "Трансфер из отеля"], included: ["Трансфер", "Яхта", "Вход на остров", "Снаряжение и гид", "Обед и напитки"],
    notes: ["Время трансфера подтвердим в WhatsApp.", "Подходит новичкам.", "Места у рифов зависят от состояния моря."], packageName: "Прогулка на остров Hula Hula", ageBands: { adults: "Взрослые (от 11 лет)", children: "Дети (4–10 лет)", infants: "Малыши (0–3 года)" },
  },
  "magawish-speedboat": {
    title: "Частный скоростной катер на остров Магавиш", description: "Четырёхчасовой частный катер для вашей группы с трансфером, сноркелингом и свободным временем на острове Магавиш.",
    highlights: ["Частный катер", "Остров Магавиш", "Сноркелинг", "Трансфер из отеля"], included: ["Трансфер по Хургаде", "Катер, капитан и топливо", "Снаряжение", "Спасательное оборудование"],
    notes: ["Вход на остров — 10 долларов с человека, оплачивается отдельно.", "Возьмите паспорт или копию.", "Маршрут зависит от моря."], packageName: "Частный катер Магавиш", ageBands: { adults: "Пассажиры вашей частной группы", children: "", infants: "" },
  },
  "horse-riding-sea-desert": {
    title: "Конная прогулка по пустыне и у моря в Хургаде с купанием", location: "Хургада, Египет", duration: "2–4 часа", category: "Активный отдых",
    description: "Прокатитесь на обученной лошади по пустынным тропам и побережью Красного моря. При безопасных условиях возможен дополнительный участок на мелководье.",
    highlights: ["Пустыня и побережье", "Дополнительное купание с лошадьми", "Для новичков и опытных", "Профессиональный гид", "Трансфер по Хургаде"],
    included: ["Прогулка с гидом", "Обученная лошадь", "Шлем", "Вода", "Трансфер в пределах Хургады"], notIncluded: ["Чаевые", "Личные расходы", "Профессиональные фотографии", "Трансфер за пределами Хургады"],
    notes: ["Бесплатная отмена не позднее чем за 24 часа.", "Заезд в воду зависит от погоды, моря и решения конюшни.", "Шлем и выполнение инструкций обязательны.", "Возраст и вес подтверждаются конюшней."],
    packageName: "Конная прогулка по пустыне и у моря", packageDescription: "Двухчасовая прогулка с трансфером, экипировкой и дополнительным заездом на мелководье.", packageLabel: "Всадник", ageBands: { adults: "Всадники (от 5 лет)", children: "", infants: "" }, availableTimes: ["Утреннее время подтвердим в WhatsApp", "Время на закате подтвердим в WhatsApp"],
    notSuitableFor: ["Дети младше 5 лет", "Беременные", "Люди с серьёзными проблемами спины или подвижности", "Пользователи инвалидных колясок", "Всадники тяжелее 110 кг без разрешения конюшни"], whatToBring: ["Длинные брюки", "Закрытая обувь", "Солнцезащитный крем", "Очки", "Купальник и полотенце для морской опции"]
  },
  "sahl-hasheesh-horse-riding": {
    title: "Конная прогулка по пустыне и морю в Сахл-Хашише с купанием", location: "Сахл-Хашиш, Египет", duration: "Около 2 часов", category: "Активный отдых",
    description: "Прокатитесь по пустыне и побережью Сахл-Хашиша. При безопасных условиях можно пройти дополнительный участок по мелководью Красного моря.",
    highlights: ["Пустынные и прибрежные маршруты", "Дополнительный участок в воде", "Обученные лошади", "Опытный местный гид", "Для разного уровня подготовки"],
    included: ["Прогулка по пустыне и у моря", "Обученная лошадь", "Местный гид", "Шлем"], notIncluded: ["Чаевые", "Личные расходы", "Фотосъёмка", "Трансфер, если он не указан в варианте"],
    notes: ["Бесплатная отмена не позднее чем за 24 часа.", "Заезд в воду возможен только по решению гида и конюшни.", "Необходимо подтвердить ограничения возраста и веса.", "Отзывы с других платформ не копируются."],
    packageName: "Конная прогулка в Сахл-Хашише", packageDescription: "Около двух часов по пустыне и побережью с дополнительным участком на мелководье.", packageLabel: "Всадник", ageBands: { adults: "Всадники (возраст подтверждает конюшня)", children: "", infants: "" }, availableTimes: ["Утреннее время подтвердим в WhatsApp", "Время на закате подтвердим в WhatsApp"],
    notSuitableFor: ["Беременные", "Люди с серьёзными проблемами спины, шеи или подвижности", "Гости за пределами подтверждённых ограничений возраста или веса"], whatToBring: ["Длинные брюки", "Закрытая обувь", "Солнцезащитный крем", "Очки", "Купальник и полотенце для морской опции"]
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
  "padi-open-water-course": {
    title: "赫尔格达三日 PADI 开放水域潜水课程", location: "埃及赫尔格达", duration: "3 天", category: "潜水",
    description: "通过理论课程和红海监督训练潜水学习核心潜水技能。完成全部知识和水中技能要求后方可获得 PADI 认证。",
    highlights: ["国际认可的 PADI 三日课程", "每天两次监督潜水", "理论与开放水域技能", "PADI 认证教练", "红海训练环境"],
    included: ["三日课程及每天两次潜水", "PADI 认证教练", "标准潜水装备", "配重带和 12 升气瓶", "每日午餐和饮料", "确认酒店区域内接送"],
    notIncluded: ["海洋税：每人每天 5 欧元", "PADI 教材、认证和注册：每人 100 欧元", "小费", "照片", "机票、签证和住宿", "必要时的体检"],
    notes: ["课程开始前 24 小时可免费取消。", "第一天 08:00 开始，接送时间通过 WhatsApp 确认。", "须填写健康问卷并具备足够游泳能力。", "18 岁以下须提交监护人签字同意书。", "最后一次潜水后须遵守潜水中心规定的禁飞时间。"],
    packageName: "三日 PADI 开放水域课程", packageDescription: "三天理论与实践训练，每天两次潜水，含装备、午餐、饮料和接送。", packageLabel: "学员", ageBands: { adults: "学员（10 岁及以上）", children: "", infants: "" }, availableTimes: ["08:00"],
    notSuitableFor: ["10 岁以下儿童", "孕妇", "有严重心脏或背部问题者", "无法满足健康或游泳要求者"], whatToBring: ["护照或身份证", "毛巾", "泳衣", "太阳镜"]
  },
  "ssi-open-water-course": {
    title: "赫尔格达三日 SSI 开放水域潜水员课程", location: "埃及赫尔格达", duration: "3 天", category: "潜水",
    description: "通过数字理论学习、平静水域练习和红海监督训练潜水，掌握成为 SSI 开放水域潜水员所需的知识和技能。",
    highlights: ["三日 SSI 开放水域课程", "数字学习与水中训练", "每天两次监督潜水", "SSI 认证潜水专业人士", "红海训练环境"],
    included: ["三日 SSI 训练", "SSI 认证潜水专业人士", "数字教材及认证注册", "标准潜水装备", "每日午餐和饮料", "确认区域内接送"],
    notIncluded: ["海洋税：每人每天 5 欧元", "小费", "照片", "机票、签证和住宿", "必要时的体检"],
    notes: ["课程开始前 24 小时可免费取消。", "课程 08:00 开始，接送时间通过 WhatsApp 确认。", "最低年龄 10 岁；未成年人须有监护人签字同意。", "完成全部 SSI 知识和水中技能要求后方可认证。", "青少年学员适用深度和监督限制。", "潜水后须遵守规定的禁飞时间。"],
    packageName: "三日 SSI 开放水域潜水员课程", packageDescription: "三天数字学习和实操训练，每天两次潜水，含装备、午餐、饮料和接送。", packageLabel: "学员", ageBands: { adults: "学员（10 岁及以上）", children: "", infants: "" }, availableTimes: ["08:00"],
    notSuitableFor: ["10 岁以下儿童", "孕妇", "有严重心脏或背部问题者", "无法满足健康或游泳要求者"], whatToBring: ["护照或身份证", "毛巾", "泳衣", "太阳镜"]
  },
  "dolphin-house-snorkeling": {
    title: "赫尔格达海豚屋浮潜游船", description: "七小时游艇之旅，前往海豚屋并进行两次珊瑚礁浮潜，含午餐、饮料和酒店接送。",
    highlights: ["寻找野生海豚", "两次浮潜", "船上午餐和饮料", "专业船员"], included: ["赫尔格达酒店接送", "游艇巡航", "海豚屋", "浮潜装备", "午餐和饮料"],
    notes: ["野生海豚出现和伴游均不保证。", "路线可能因天气和海况调整。", "接送时间通过 WhatsApp 确认。"], packageName: "海豚屋浮潜游船", ageBands: { adults: "成人（11 岁及以上）", children: "儿童（4–10 岁）", infants: "幼儿（0–3 岁）" },
  },
  "hula-hula-island-snorkeling": {
    title: "Hula Hula 岛游船与浮潜", description: "全天游艇行程，含 Hula Hula 岛一小时、两次浮潜、午餐、饮料和赫尔格达酒店接送。",
    highlights: ["Hula Hula 岛一小时", "两次浮潜", "午餐和饮料", "酒店接送"], included: ["酒店接送", "游艇巡航", "登岛", "浮潜装备和向导", "午餐和饮料"],
    notes: ["接送时间通过 WhatsApp 确认。", "适合初学者。", "珊瑚礁地点可能随海况调整。"], packageName: "Hula Hula 岛游船", ageBands: { adults: "成人（11 岁及以上）", children: "儿童（4–10 岁）", infants: "幼儿（0–3 岁）" },
  },
  "magawish-speedboat": {
    title: "马加维什岛私人快艇", description: "为您的团队提供约四小时私人快艇，含赫尔格达接送、珊瑚礁浮潜和马加维什岛自由活动。",
    highlights: ["专属私人快艇", "马加维什岛", "珊瑚礁浮潜", "酒店接送"], included: ["赫尔格达酒店接送", "快艇、船长和燃油", "浮潜装备", "安全装备"],
    notes: ["岛屿门票每人 10 美元，另行支付。", "请携带护照或复印件。", "路线可能因海况调整。"], packageName: "马加维什私人快艇", ageBands: { adults: "私人团队乘客", children: "", infants: "" },
  },
  "horse-riding-sea-desert": {
    title: "赫尔格达沙漠与海岸骑马（可选浅水骑行）", location: "埃及赫尔格达", duration: "2–4 小时", category: "户外活动",
    description: "在专业向导带领下骑乘训练有素的马匹探索赫尔格达沙漠与红海海岸。安全条件允许时可选择进入浅水区。",
    highlights: ["沙漠与海岸骑马", "可选与马浅水活动", "适合初学者和有经验骑手", "专业向导", "赫尔格达市内接送"],
    included: ["向导骑马体验", "训练有素的马匹", "安全头盔", "饮用水", "赫尔格达市内酒店接送"], notIncluded: ["小费", "个人消费", "专业摄影", "赫尔格达以外接送"],
    notes: ["活动开始前 24 小时可免费取消。", "是否进入水中取决于天气、海况和马场评估。", "必须佩戴头盔并遵循向导指示。", "年龄和体重适宜性由马场确认。"],
    packageName: "赫尔格达沙漠与海岸骑马", packageDescription: "两小时向导骑马，含市内接送和安全装备，条件允许时可选浅水骑行。", packageLabel: "骑手", ageBands: { adults: "骑手（5 岁及以上）", children: "", infants: "" }, availableTimes: ["上午时间通过 WhatsApp 确认", "日落时间通过 WhatsApp 确认"],
    notSuitableFor: ["5 岁以下儿童", "孕妇", "有严重背部或行动问题者", "轮椅使用者", "体重超过 110 公斤且未获马场批准者"], whatToBring: ["长裤", "包头鞋", "防晒霜", "太阳镜", "选择海水项目时携带泳衣和毛巾"]
  },
  "sahl-hasheesh-horse-riding": {
    title: "萨尔哈希什沙漠与海岸骑马（可选浅水骑行）", location: "埃及萨尔哈希什", duration: "约 2 小时", category: "户外活动",
    description: "骑马穿越萨尔哈希什沙漠并沿红海海岸前行。安全条件允许时，可增加浅水骑行环节。",
    highlights: ["沙漠与海岸路线", "可选浅水环节", "训练有素的马匹", "经验丰富的当地向导", "适合不同水平"],
    included: ["沙漠和海岸骑马", "训练有素的马匹", "当地向导", "头盔"], notIncluded: ["小费", "个人消费", "摄影服务", "选项未注明的接送"],
    notes: ["活动开始前 24 小时可免费取消。", "是否进入浅水区由向导和马场决定。", "须向马场确认年龄和体重限制。", "本站不会复制其他平台的评价。"],
    packageName: "萨尔哈希什沙漠与海岸骑马", packageDescription: "约两小时沙漠和海岸向导骑马，安全时可增加浅水环节。", packageLabel: "骑手", ageBands: { adults: "骑手（年龄由马场确认）", children: "", infants: "" }, availableTimes: ["上午时间通过 WhatsApp 确认", "日落时间通过 WhatsApp 确认"],
    notSuitableFor: ["孕妇", "有严重背部、颈部或行动问题者", "不符合马场确认的年龄或体重限制者"], whatToBring: ["长裤", "包头鞋", "防晒霜", "太阳镜", "选择海水项目时携带泳衣和毛巾"]
  },
};

export function localizeTourChinese(tour: Tour): Tour {
  return { ...tour, ...chineseTourOverrides[tour.slug] };
}

const polishTourOverrides: Record<string, Partial<Tour>> = {
  "orange-bay": {
    title: "Rejs na Orange Bay ze snorkelingiem", location: "Hurghada, Egipt", duration: "8,5 godziny",
    description: "Całodniowy rejs na Orange Bay z odbiorem z hotelu w Hurghadzie, snorkelingiem, czasem na wyspie, lunchem, napojami i atrakcjami na wodzie.",
    highlights: ["Relaks na wyspie Orange Bay", "Rejs po Morzu Czerwonym", "Pływanie w turkusowej wodzie", "Snorkeling wśród raf i ryb", "Dwa postoje na snorkeling", "Czas na plaży"],
    included: ["Odbiór i powrót do hotelu w Hurghadzie", "Rejs łodzią", "Przewodnik", "Sprzęt do snorkelingu", "Postój na Orange Bay", "Lunch w formie bufetu", "Napoje bezalkoholowe i przekąski", "Kamizelki ratunkowe", "Podatek i opłata morska"],
    notIncluded: ["Napoje na wyspie", "Dopłata za odbiór z okolic kurortów", "Wydatki osobiste"],
    notes: ["Start o 7:30. Dokładną godzinę odbioru potwierdzimy przez WhatsApp.", "Rezerwacji należy dokonać co najmniej dzień przed wycieczką.", "Bezpłatne anulowanie jest możliwe do dnia poprzedzającego wyjazd."],
    packageName: "Rejs na Orange Bay ze snorkelingiem", packageDescription: "Całodniowy rejs na Orange Bay z plażą, snorkelingiem, lunchem i transferem hotelowym.", packageLabel: "Osoba dorosła", ageBands: { adults: "Dorośli (12–99 lat)", children: "Dzieci (2–11 lat)", infants: "Niemowlęta (do 1 roku)" }, availableTimes: ["07:30"],
  },
  safari: {
    title: "Pustynne safari", location: "Pustynia Hurghady", duration: "5 godzin",
    description: "Przeżyj pustynną przygodę na quadach, podczas przejażdżki na wielbłądzie i wizyty w wiosce Beduinów.",
    highlights: ["Przejażdżka quadem", "Jazda na wielbłądzie", "Herbata beduińska", "Zachód słońca na pustyni"],
    included: ["Odbiór z hotelu", "Przejażdżka quadem", "Wizyta w wiosce Beduinów", "Herbata"],
    notes: ["Dokładną godzinę odbioru potwierdzimy przez WhatsApp.", "Załóż zakryte buty i zabierz okulary przeciwsłoneczne."],
    packageName: "Pustynne safari", packageDescription: "Jazda quadem, wielbłąd, wioska Beduinów i herbata.", packageLabel: "Za osobę", availableTimes: ["Popołudnie — godzina odbioru przez WhatsApp"],
  },
  "professional-underwater-photographer": {
    title: "Profesjonalny fotograf podwodny", location: "Hurghada, Egipt", duration: "Cały dzień",
    description: "Zachowaj wspomnienia z Morza Czerwonego dzięki profesjonalnemu fotografowi podwodnemu, który będzie towarzyszyć Ci podczas nurkowania, snorkelingu lub rejsu.",
    highlights: ["Dedykowany profesjonalny fotograf", "Zdjęcia pod wodą i na powierzchni", "Idealne do nurkowania i snorkelingu", "Profesjonalnie obrobione wspomnienia"],
    included: ["Fotograf na cały dzień", "Sprzęt do fotografii podwodnej", "Wybrane obrobione zdjęcia cyfrowe", "Koordynacja z wybraną atrakcją"],
    notIncluded: ["Opłata za rejs, nurkowanie lub snorkeling", "Transfer hotelowy, jeśli nie został ustalony", "Albumy drukowane i dodatkowa obróbka"],
    notes: ["Zarezerwuj wcześniej, aby potwierdzić dostępność fotografa.", "Podaj aktywność i godzinę wyjazdu przy rezerwacji.", "Cena dotyczy jednego fotografa za cały dzień."],
    packageName: "Całodniowa fotografia podwodna", packageDescription: "Profesjonalny fotograf dokumentujący Twoją przygodę nad Morzem Czerwonym.", packageLabel: "Za dzień", priceUnit: "za dzień", availableTimes: ["Godzina rozpoczęcia przez WhatsApp"],
  },
  "luxor-private-day-trip": {
    title: "Prywatna wycieczka do Luksoru z Hurghady", location: "Luksor, Egipt", duration: "Około 1 dnia",
    description: "Odkryj Luksor podczas prywatnej wycieczki z klimatyzowanym samochodem i egiptologiem. Zobacz Dolinę Królów, świątynię Hatszepsut, Kolosy Memnona i świątynię Karnak; odbiór z hotelu i lunch są w cenie.",
    highlights: ["Prywatny samochód i przewodnik", "Trzy grobowce w Dolinie Królów", "Świątynia Hatszepsut", "Kolosy Memnona", "Kompleks świątyń Karnak", "Lunch i główne bilety w cenie"],
    included: ["Prywatny odbiór i powrót z Hurghady", "Klimatyzowany samochód", "Wstęp do Doliny Królów z trzema standardowymi grobowcami", "Świątynia Hatszepsut, Kolosy Memnona i Karnak", "Bilety wstępu", "Anglojęzyczny egiptolog", "Lunch z opcją wegetariańską", "Woda mineralna i pozwolenia"],
    notIncluded: ["Grobowiec Tutanchamona — około 30 USD", "Przewodnik w innym języku — dopłata", "Napoje do lunchu", "Opcjonalny rejs feluką", "Napiwki i wydatki osobiste"],
    notes: ["Do pozwolenia na podróż potrzebny jest ważny dokument lub paszport.", "Cena 120 USD to cena wyjściowa dla osoby dorosłej; zapytaj o ofertę rodzinną lub grupową.", "Odbiór planowany jest około 05:00 i potwierdzany przez WhatsApp.", "Grobowiec Tutanchamona wymaga osobnego biletu."],
    packageName: "Prywatna wycieczka do Luksoru", packageDescription: "Prywatny transport, egiptolog, główne bilety, trzy grobowce w Dolinie Królów i lunch.", packageLabel: "Cena wyjściowa dla osoby dorosłej", availableTimes: ["05:00"],
  },
  "mahmya-island": {
    title: "Rejs na wyspę Mahmya", location: "Hurghada, Egipt", duration: "Cały dzień",
    description: "Odpocznij na białym piasku wyspy Mahmya w Parku Narodowym Giftun. Pływaj w krystalicznej wodzie, spróbuj snorkelingu i ciesz się wyjątkowym dniem nad Morzem Czerwonym.",
    highlights: ["Wysokiej jakości atrakcja na wyspie", "Biała piaszczysta plaża", "Krystalicznie czysta woda", "Snorkeling", "Lunch", "Transfer z hotelu"],
    included: ["Odbiór i powrót do hotelu", "Rejs łodzią", "Wstęp na wyspę", "Lunch", "Napoje bezalkoholowe"], notIncluded: ["Wydatki osobiste", "Zdjęcia i filmy"],
    notes: ["Godzinę odbioru potwierdzimy przez WhatsApp.", "Zabierz strój kąpielowy, krem z filtrem i ręcznik."], packageName: "Wycieczka na wyspę Mahmya", packageDescription: "Wyjątkowy dzień na wyspie z transferem, rejsem i lunchem.", packageLabel: "Za osobę",
  },
  "full-day-snorkeling": {
    title: "Całodniowy snorkeling", location: "Hurghada, Egipt", duration: "8 godzin",
    description: "Odkrywaj rafy koralowe Morza Czerwonego podczas całodniowej wyprawy snorkelingowej z Hurghady. Kapitan wybiera odpowiednie miejsca zgodnie z pogodą i stanem morza.",
    highlights: ["Dwa postoje na snorkeling", "Lokalne rafy Morza Czerwonego", "Lunch w formie bufetu", "Napoje bezalkoholowe", "Odbiór z hotelu", "Profesjonalny przewodnik"],
    included: ["Odbiór z hotelu", "Rejs łodzią", "Sprzęt do snorkelingu", "Lunch", "Napoje bezalkoholowe"], notIncluded: ["Postój na wyspie", "Wydatki osobiste"],
    notes: ["Ta wycieczka nie obejmuje pobytu na wyspie.", "Miejsca zależą od pogody i stanu morza."], packageName: "Całodniowy snorkeling na rafach", packageDescription: "Spokojny dzień na Morzu Czerwonym z dwoma postojami na snorkeling i lunchem.", packageLabel: "Za osobę", ageBands: { adults: "Dorośli", children: "Dzieci", infants: "Niemowlęta" }, availableTimes: ["08:00"],
  },
  "full-day-diving": {
    title: "Całodniowe nurkowanie", location: "Hurghada, Egipt", duration: "8 godzin",
    description: "Odkryj podwodny świat Morza Czerwonego podczas dwóch nurkowań z przewodnikiem. Miejsca nurkowe wybiera kapitan zgodnie z pogodą i stanem morza.",
    highlights: ["Dwa nurkowania z przewodnikiem", "Profesjonalny instruktor", "Lunch na pokładzie", "Napoje bezalkoholowe", "Transfer z hotelu", "Sprzęt dostępny za dopłatą"],
    included: ["Transfer z hotelu", "Rejs łodzią", "Profesjonalny instruktor", "Lunch", "Napoje bezalkoholowe"], notIncluded: ["Wypożyczenie sprzętu — 30 USD", "Wydatki osobiste"],
    notes: ["Każdy uczestnik musi mieć ważną licencję nurkową i zabrać jej potwierdzenie.", "Sprzęt nie jest zawarty w cenie podstawowej.", "Miejsca nurkowe zależą od pogody i stanu morza."], packageName: "Dwa nurkowania w Morzu Czerwonym", packageDescription: "Całodniowy rejs z dwoma nurkowaniami z przewodnikiem; wymagana ważna licencja.", packageLabel: "Za osobę", availableTimes: ["08:00"],
  },
  "quad-safari-morning": {
    title: "Poranne safari na quadach", location: "Pustynia Hurghady", duration: "5 godzin",
    description: "Rozpocznij dzień od jazdy quadem przez Pustynię Wschodnią, podziwiaj górskie widoki i odwiedź tradycyjny obóz Beduinów.",
    highlights: ["Jazda quadem", "Pustynna przygoda", "Obóz Beduinów", "Herbata", "Górskie widoki"], included: ["Odbiór z hotelu", "Jazda quadem", "Instruktaż bezpieczeństwa", "Herbata beduińska"], notIncluded: ["Chusta i gogle, jeśli potrzebne", "Wydatki osobiste"],
    notes: ["Minimalny wiek uczestnika to 9 lat.", "Kierowcy muszą stosować się do instruktażu bezpieczeństwa.", "Zabierz okulary przeciwsłoneczne i zakryte buty."], packageName: "Poranne safari na quadach", packageDescription: "Poranna jazda po pustyni z wizytą w obozie Beduinów. Minimalny wiek: 9 lat.", packageLabel: "Za osobę", availableTimes: ["08:00"],
  },
  "quad-safari-sunset": {
    title: "Safari na quadach o zachodzie słońca", location: "Pustynia Hurghady", duration: "5 godzin",
    description: "Przeżyj zachód słońca na pustyni Hurghady podczas jazdy quadem wśród gór, a następnie odwiedź tradycyjny obóz Beduinów.",
    highlights: ["Jazda o zachodzie słońca", "Quad", "Obóz Beduinów", "Herbata", "Panorama pustyni"], included: ["Odbiór z hotelu", "Jazda quadem", "Instruktaż bezpieczeństwa", "Herbata beduińska"], notIncluded: ["Wydatki osobiste"],
    notes: ["Minimalny wiek uczestnika to 9 lat.", "Godzina odbioru zależy od zachodu słońca i jest potwierdzana przez WhatsApp.", "Zabierz zakryte buty."], packageName: "Safari na quadach o zachodzie słońca", packageDescription: "Jazda po pustyni o zachodzie słońca z wizytą u Beduinów. Minimalny wiek: 9 lat.", packageLabel: "Za osobę", availableTimes: ["Popołudnie — godzina odbioru przez WhatsApp"],
  },
  "hurghada-airport-transfer": {
    title: "Prywatny transfer z lotniska w Hurghadzie", location: "Międzynarodowe lotnisko w Hurghadzie", duration: "Elastycznie",
    description: "Prywatny transfer lotniskowy w jedną stronę za stałą cenę 20 USD w Hurghadzie. Do Makadi Bay, Soma Bay, El Gouna i Sahl Hasheesh obowiązuje dopłata 7 USD.",
    highlights: ["Stała cena za przejazd", "Odbiór na lotnisku", "Monitorowanie lotu", "Prywatny samochód z klimatyzacją", "Samochód dopasowany do grupy"], included: ["Prywatny samochód", "Kierowca", "Paliwo i parking"], notIncluded: ["Dodatkowe postoje", "Przejazd powrotny"],
    notes: ["1–2 pasażerów: mały samochód i maksymalnie 2 bagaże.", "Powyżej 2 pasażerów: większy samochód i maksymalnie 2 bagaże na osobę.", "Przy rezerwacji podaj numer lotu i nazwę hotelu."], packageName: "Lotniskowy transfer w jedną stronę", packageDescription: "20 USD w Hurghadzie; dopłata 7 USD za strefy kurortów.", packageLabel: "Stała cena za przejazd", availableTimes: ["Godzina potwierdzana na podstawie lotu"],
  },
  "senzo-transfer": {
    title: "Prywatny transfer do i z Senzo Mall", location: "Hurghada, Egipt", duration: "Elastycznie",
    description: "Prywatny transfer w jedną stronę do Senzo Mall za stałą cenę 10 USD w Hurghadzie. Do stref kurortów obowiązuje dopłata 7 USD.",
    highlights: ["Stała cena", "Prywatny samochód", "Odbiór z hotelu", "Elastyczna godzina", "Samochód z klimatyzacją"], included: ["Prywatny transfer", "Kierowca", "Paliwo i parking"], notIncluded: ["Przejazd powrotny", "Bagaże podróżne", "Zakupy i posiłki"],
    notes: ["Maksymalnie 4 pasażerów.", "W tym transferze nie można przewozić bagażu podróżnego.", "Przejazd w każdą stronę należy zarezerwować osobno."], packageName: "Transfer do Senzo Mall w jedną stronę", packageDescription: "10 USD w Hurghadzie; dopłata 7 USD za strefy kurortów.", packageLabel: "Stała cena za przejazd", availableTimes: ["Wybraną godzinę potwierdzimy przez WhatsApp"],
  },
  "dolphin-house-snorkeling": {
    title: "Rejs do Dolphin House ze snorkelingiem", location: "Hurghada, Egipt", duration: "7 godzin",
    description: "Siedmiogodzinny rejs jachtem do Dolphin House z dwoma postojami na snorkeling, lunchem, napojami i odbiorem z hotelu.",
    highlights: ["Poszukiwanie dzikich delfinów", "Dwa postoje na snorkeling", "Lunch i napoje", "Profesjonalna załoga"], included: ["Odbiór z hotelu w Hurghadzie", "Rejs jachtem", "Dolphin House", "Sprzęt do snorkelingu", "Lunch i napoje"],
    notes: ["Obserwacja delfinów i pływanie z nimi nie są gwarantowane.", "Trasa może zmienić się z powodu pogody i stanu morza.", "Godzinę odbioru potwierdzimy przez WhatsApp."], packageName: "Rejs do Dolphin House", ageBands: { adults: "Dorośli (11+)", children: "Dzieci (4–10 lat)", infants: "Niemowlęta (0–3 lata)" },
  },
  "hula-hula-island-snorkeling": {
    title: "Rejs na wyspę Hula Hula i snorkeling", location: "Hurghada, Egipt", duration: "Cały dzień",
    description: "Całodniowy rejs jachtem z godziną na wyspie Hula Hula, dwoma postojami na snorkeling, lunchem, napojami i transferem z hotelu.",
    highlights: ["Godzina na wyspie Hula Hula", "Dwa postoje na snorkeling", "Lunch i napoje", "Odbiór z hotelu"], included: ["Transfer z hotelu", "Rejs jachtem", "Wstęp na wyspę", "Sprzęt i przewodnik do snorkelingu", "Lunch i napoje"],
    notes: ["Godzinę odbioru potwierdzimy przez WhatsApp.", "Atrakcja jest odpowiednia dla początkujących.", "Miejsca przy rafie zależą od stanu morza."], packageName: "Rejs na wyspę Hula Hula", ageBands: { adults: "Dorośli (11+)", children: "Dzieci (4–10 lat)", infants: "Niemowlęta (0–3 lata)" },
  },
  "royal-seascope-submarine": { title: "Royal Seascope — półłódź podwodna", location: "Marina w Hurghadzie", duration: "Około 3 godziny", description: "Zobacz rafy Morza Czerwonego z wygodnej półłodzi podwodnej — bez konieczności nurkowania.", highlights: ["Widok na rafy pod wodą", "Atrakcja dla rodzin", "Wygodny rejs", "Odbiór z hotelu"], notes: ["Godzinę odbioru potwierdzimy przez WhatsApp."], packageName: "Royal Seascope", packageDescription: "Rodzinna morska atrakcja z widokiem na podwodny świat.", packageLabel: "Za osobę" },
  "beginner-scuba-diving": { title: "Nurkowanie dla początkujących", location: "Hurghada, Egipt", duration: "Cały dzień", description: "Spróbuj nurkowania w Morzu Czerwonym pod opieką profesjonalnego instruktora — doświadczenie nie jest wymagane.", highlights: ["Nurkowanie dla początkujących", "Profesjonalny instruktor", "Sprzęt dostępny", "Odbiór z hotelu"], notes: ["Instruktor oceni warunki i dobierze odpowiedni poziom.", "Dokładne szczegóły potwierdzimy przez WhatsApp."], packageName: "Nurkowanie próbne", packageDescription: "Pierwsze nurkowanie z instruktorem na rafach Hurghady.", packageLabel: "Za osobę" },
  "padi-open-water-course": { title: "Trzydniowy kurs PADI Open Water", location: "Hurghada, Egipt", duration: "3 dni", description: "Naucz się podstaw nurkowania podczas teorii i treningów w Morzu Czerwonym pod opieką instruktora PADI.", highlights: ["Międzynarodowy kurs PADI", "Dwa nurkowania dziennie", "Teoria i praktyka", "Instruktor PADI", "Szkolenie w Morzu Czerwonym"], included: ["Trzydniowy kurs", "Instruktor PADI", "Standardowy sprzęt", "Lunch i napoje", "Transfer w potwierdzonej strefie hotelowej"], notIncluded: ["Opłata morska", "Materiały i certyfikacja PADI", "Napiwki", "Lot i zakwaterowanie"], notes: ["Wymagana ankieta medyczna i umiejętność pływania.", "Osoby poniżej 18 lat potrzebują zgody opiekuna.", "Po nurkowaniu należy zachować wymagany czas przed lotem."], packageName: "Trzydniowy kurs PADI Open Water", packageDescription: "Teoria i praktyka z dwoma nurkowaniami dziennie, sprzętem, lunchem i transferem.", packageLabel: "Uczestnik", ageBands: { adults: "Uczestnicy (od 10 lat)", children: "", infants: "" }, availableTimes: ["08:00"] },
  "ssi-open-water-course": { title: "Trzydniowy kurs SSI Open Water Diver", location: "Hurghada, Egipt", duration: "3 dni", description: "Poznaj teorię i praktykę potrzebną do uzyskania certyfikatu SSI Open Water Diver podczas szkolenia w Morzu Czerwonym.", highlights: ["Trzydniowy program SSI", "Nauka cyfrowa i praktyka", "Dwa nurkowania dziennie", "Certyfikowany specjalista SSI", "Szkolenie w Morzu Czerwonym"], included: ["Trzydniowe szkolenie SSI", "Cyfrowa nauka", "Standardowy sprzęt", "Lunch i napoje", "Transfer w potwierdzonej strefie"], notIncluded: ["Opłata morska", "Napiwki", "Zdjęcia", "Lot i zakwaterowanie"], notes: ["Minimalny wiek to 10 lat.", "Osoby niepełnoletnie potrzebują zgody opiekuna.", "Po nurkowaniu należy zachować wymagany czas przed lotem."], packageName: "Trzydniowy kurs SSI Open Water Diver", packageDescription: "Cyfrowa teoria i praktyka z dwoma nurkowaniami dziennie, sprzętem, posiłkami i transferem.", packageLabel: "Uczestnik", ageBands: { adults: "Uczestnicy (od 10 lat)", children: "", infants: "" }, availableTimes: ["08:00"] },
  "horse-riding-sea-desert": { title: "Jazda konna po pustyni i nad morzem w Hurghadzie", location: "Hurghada, Egipt", duration: "2–4 godziny", description: "Odkrywaj pustynię i wybrzeże Morza Czerwonego na wyszkolonym koniu z profesjonalnym przewodnikiem. Przy bezpiecznych warunkach możliwa jest opcjonalna jazda po płytkiej wodzie.", highlights: ["Jazda po pustyni i wybrzeżu", "Opcjonalny odcinek w wodzie", "Dla początkujących i doświadczonych", "Profesjonalny przewodnik", "Transfer w Hurghadzie"], included: ["Jazda z przewodnikiem", "Wyszkolony koń", "Kask", "Woda", "Transfer w Hurghadzie"], notIncluded: ["Napiwki", "Wydatki osobiste", "Profesjonalne zdjęcia", "Transfer poza Hurghadą"], notes: ["Możliwe bezpłatne anulowanie do 24 godzin przed aktywnością.", "Odcinek w wodzie zależy od pogody, morza i decyzji stajni.", "Wiek i limit wagi potwierdza stajnia."], packageName: "Jazda konna po pustyni i nad morzem", packageDescription: "Dwugodzinna jazda z transferem, kaskiem i opcjonalnym odcinkiem w płytkiej wodzie.", packageLabel: "Jeździec", ageBands: { adults: "Jeźdźcy (od 5 lat)", children: "", infants: "" }, availableTimes: ["Rano — przez WhatsApp", "Zachód słońca — przez WhatsApp"] },
  "sahl-hasheesh-horse-riding": { title: "Jazda konna po pustyni i nad morzem w Sahl Hasheesh", location: "Sahl Hasheesh, Egipt", duration: "Około 2 godzin", description: "Przejedź konno przez pustynię i wzdłuż wybrzeża Sahl Hasheesh. Przy bezpiecznych warunkach możliwy jest opcjonalny odcinek po płytkiej wodzie.", highlights: ["Trasy pustynne i nadmorskie", "Opcjonalny odcinek w wodzie", "Wyszkolone konie", "Doświadczony lokalny przewodnik", "Dla różnych poziomów"], included: ["Jazda konna po pustyni i nad morzem", "Wyszkolony koń", "Lokalny przewodnik", "Kask"], notIncluded: ["Napiwki", "Wydatki osobiste", "Fotografia", "Transfer, jeśli nie został wybrany"], notes: ["Możliwe bezpłatne anulowanie do 24 godzin przed aktywnością.", "Odcinek w wodzie zależy od przewodnika i stajni.", "Wiek i limit wagi należy potwierdzić ze stajnią."], packageName: "Jazda konna w Sahl Hasheesh", packageDescription: "Około dwóch godzin jazdy po pustyni i wybrzeżu z opcjonalnym odcinkiem w płytkiej wodzie.", packageLabel: "Jeździec", availableTimes: ["Rano — przez WhatsApp", "Zachód słońca — przez WhatsApp"] },
};

export function localizeTourPolish(tour: Tour): Tour {
  return { ...tour, ...polishTourOverrides[tour.slug] };
}

const magawishSpeedboatTranslations: Partial<Record<Locale, Partial<Tour>>> = {
  de: { title: "Private Speedboot-Tour zu Orange Bay und Magawish", description: "Entdecke Orange Bay und Magawish mit einem privaten Speedboot, einem Schnorchelstopp und frei wählbaren Extras für deine Gruppe.", highlights: ["Privates Speedboot für deine Gruppe", "Orange Bay und Magawish", "Schnorchelstopp mit Ausrüstung", "Acht Bootsgrößen", "Optionale Verpflegung und Marina-Transfer"], included: ["Gewähltes Privatboot", "Skipper/Guide", "Treibstoff", "Schnorchelausrüstung", "Schwimmwesten und Sicherheitsausrüstung"], notIncluded: ["Inseleintritte — werden bei der Buchung hinzugefügt", "Essen und Getränke, sofern nicht gewählt", "Hoteltransfer, sofern nicht gewählt", "Persönliche Ausgaben"], packageName: "Privates Speedboot Orange Bay & Magawish", packageDescription: "Wähle Boot, Inseleintritte, optionale Verpflegung und Marina-Transfer.", packageLabel: "Privatboot ab", seoTitle: "Orange Bay & Magawish Speedboot ab Hurghada", metaDescription: "Private Speedboot-Tour ab Hurghada zu Orange Bay und Magawish mit wählbarem Boot, Schnorcheln und optionaler Verpflegung." },
  ru: { title: "Частный катер на Orange Bay и Магавиш", description: "Посетите Orange Bay и Магавиш на частном скоростном катере со сноркелингом и дополнительными услугами для вашей группы.", highlights: ["Частный катер", "Orange Bay и Магавиш", "Сноркелинг со снаряжением", "Восемь вариантов катера", "Дополнительное питание и трансфер"], included: ["Выбранный катер", "Капитан-гид", "Топливо", "Снаряжение", "Спасательное оборудование"], notIncluded: ["Вход на острова — добавляется при бронировании", "Питание, если не выбрано", "Трансфер из отеля, если не выбран", "Личные расходы"], packageName: "Частный катер Orange Bay и Магавиш", packageDescription: "Выберите катер, входные билеты, питание и трансфер до марины.", packageLabel: "Катер от", seoTitle: "Orange Bay и Магавиш на катере из Хургады", metaDescription: "Частная поездка на катере из Хургады к Orange Bay и Магавишу со сноркелингом и дополнительным питанием." },
  ar: { title: "قارب سريع خاص إلى أورانج باي ومجاويش", description: "اكتشف أورانج باي ومجاويش بقارب سريع خاص مع محطة سنوركلينج وإضافات اختيارية لمجموعتك.", highlights: ["قارب خاص للمجموعة", "أورانج باي ومجاويش", "سنوركلينج مع المعدات", "ثمانية خيارات للقارب", "طعام وتوصيل اختياريان"], included: ["القارب المختار", "القبطان والمرشد", "الوقود", "معدات السنوركلينج", "معدات السلامة"], notIncluded: ["دخول الجزيرتين — يضاف عند الحجز", "الطعام والمشروبات ما لم تُختر", "توصيل الفندق ما لم يُختر", "المصاريف الشخصية"], packageName: "قارب أورانج باي ومجاويش الخاص", packageDescription: "اختر القارب ورسوم دخول الجزر والطعام والتوصيل إلى المارينا.", packageLabel: "القارب الخاص من", seoTitle: "قارب أورانج باي ومجاويش من الغردقة", metaDescription: "رحلة قارب سريع خاصة من الغردقة إلى أورانج باي ومجاويش مع سنوركلينج وإضافات اختيارية." },
  pl: { title: "Prywatna motorówka na Orange Bay i Magawish", description: "Odwiedź Orange Bay i Magawish prywatną motorówką, zatrzymaj się na snorkeling i dobierz dodatki dla swojej grupy.", highlights: ["Prywatna motorówka", "Orange Bay i Magawish", "Snorkeling ze sprzętem", "Osiem wariantów łodzi", "Opcjonalne posiłki i transfer"], included: ["Wybrana motorówka", "Kapitan-przewodnik", "Paliwo", "Sprzęt do snorkelingu", "Kamizelki i wyposażenie bezpieczeństwa"], notIncluded: ["Wstęp na wyspy — doliczany przy rezerwacji", "Jedzenie i napoje, jeśli nie wybrano", "Transfer hotelowy, jeśli nie wybrano", "Wydatki osobiste"], packageName: "Prywatna motorówka Orange Bay i Magawish", packageDescription: "Wybierz łódź, bilety na wyspy, catering i transfer do mariny.", packageLabel: "Motorówka od", seoTitle: "Orange Bay i Magawish motorówką z Hurghady", metaDescription: "Prywatna motorówka z Hurghady na Orange Bay i Magawish ze snorkelingiem i opcjonalnym cateringiem." },
  zh: { title: "橙湾与马加维什岛私人快艇", description: "乘私人快艇游览橙湾和马加维什岛，体验珊瑚礁浮潜，并可为团队选择餐饮和接送服务。", highlights: ["团队专属快艇", "橙湾和马加维什岛", "含装备的浮潜", "八种快艇选择", "可选餐饮和码头接送"], included: ["所选私人快艇", "船长兼向导", "燃油", "浮潜装备", "救生衣和安全设备"], notIncluded: ["海岛门票 — 预订时添加", "未选择的餐饮", "未选择的酒店接送", "个人消费"], packageName: "橙湾与马加维什私人快艇", packageDescription: "选择快艇、海岛门票、餐饮和码头接送。", packageLabel: "私人快艇起价", seoTitle: "赫尔格达橙湾与马加维什私人快艇", metaDescription: "从赫尔格达乘私人快艇前往橙湾和马加维什岛，含浮潜并可选择餐饮和接送。" },
};

export function localizeTour(tour: Tour, locale: Locale): Tour {
  const base = locale === "de" ? localizeTourGerman(tour)
    : locale === "ru" ? localizeTourRussian(tour)
    : locale === "ar" ? localizeTourArabic(tour)
    : locale === "zh" ? localizeTourChinese(tour)
    : locale === "pl" ? localizeTourPolish(tour)
    : tour;
  const withMagawish = tour.slug === "magawish-speedboat" ? { ...base, ...magawishSpeedboatTranslations[locale] } : base;
  return applyTourMediaSafety(localizeSnorkelingBoatTrip(withMagawish, locale), locale);
}
