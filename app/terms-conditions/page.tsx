import Link from "next/link";
import type { Metadata } from "next";
import { localePath, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Terms and conditions for Daily Red Sea bookings and transfers.",
  path: "/terms-conditions",
});

type TermsLocale = Extract<Locale, "en" | "de" | "ru" | "ar" | "zh" | "pl">;
type Section = { title: string; id?: string; paragraphs: string[] };

const copy: Record<TermsLocale, { legal: string; title: string; intro: string; back: string; sections: Section[] }> = {
  en: {
    legal: "Legal",
    title: "Terms & Conditions",
    intro: "By booking a tour, transfer, or activity with Daily Red Sea, you agree to the terms below. These terms apply alongside any specific conditions shown on an individual tour page.",
    back: "Back to home",
    sections: [
      { title: "Bookings & confirmation", paragraphs: ["A request submitted through our website or WhatsApp is not confirmed until you receive confirmation from our team, including your final price, pickup details, and payment method. Please check your confirmation carefully and let us know immediately if any details are incorrect."] },
      { title: "Pricing & payment", paragraphs: ["Prices are shown per person or per booking, in your selected currency, and include the inclusions listed on the tour page. Unless stated otherwise, payment is accepted in cash on arrival; some tours may require online prepayment or a deposit, which will be clearly indicated before you confirm. We do not add hidden fees on top of the listed price."] },
      { title: "Pickup & participation", paragraphs: ["Pickup times are estimates confirmed the day before (or on the morning of) your activity via WhatsApp, and may shift due to traffic, weather, or hotel location. Some activities have age, health, swimming ability, or fitness requirements listed on the tour page—please read these before booking and let us know of any relevant medical conditions in advance."] },
      { title: "Changes to bookings", paragraphs: ["If you need to change your date, group size, or pickup details, contact us on WhatsApp as early as possible. Changes are subject to availability and may not always be possible close to the activity date."] },
      { title: "Cancellations & Refunds", id: "cancellations", paragraphs: [
        "Free cancellation window: Unless a different window is stated on the specific tour page, cancellations made at least 24 hours before the scheduled pickup time are eligible for a full refund (or no charge, for cash-on-arrival bookings).",
        "Late cancellations: Cancellations made within 24 hours of pickup, or no-shows, are not eligible for a refund, since local suppliers reserve your place and incur costs.",
        "Tour-specific terms: Some activities (for example, private tours, boats with limited capacity, or third-party operated experiences) may have a longer notice period or be non-refundable—this will always be shown on the tour page before you book.",
        "Cancellations by us: If we or our local supplier need to cancel or reschedule an activity (weather, safety, insufficient group size, or operational reasons), you'll be offered a full refund or the option to rebook another date or activity.",
        "How to cancel: Message us on WhatsApp with your booking reference as soon as possible. We'll confirm your refund eligibility and, where applicable, process it to your original payment method within a stated number of business days (for example, 5–7 days)—for cash-on-arrival bookings, no charge is made.",
      ] },
      { title: "Liability", paragraphs: [
        "Daily Red Sea operates as a booking and coordination platform, connecting travelers with local Hurghada-based operators, crews, guides, and drivers who deliver the activity itself.",
        "Tours, boat trips, safaris, and transfers are carried out by independent local suppliers in accordance with their own safety standards and applicable Egyptian regulations.",
        "Participation in water-based activities (snorkeling, diving, boat trips) and land-based activities (quad biking, desert safaris) carries inherent risk. Guests participate at their own risk and are expected to follow their guide's or crew's safety briefing and instructions at all times.",
        "Daily Red Sea is not liable for injury, loss, illness, or damage arising from a guest's failure to follow safety instructions, pre-existing medical conditions not disclosed at booking, or acts outside our reasonable control (including weather, natural events, third-party acts, or force majeure).",
        "Itineraries, routes, and timings may be adjusted by the local operator for safety or operational reasons; we'll aim to notify you of significant changes as early as possible.",
        "Nothing in these terms excludes liability that cannot legally be excluded under applicable law.",
      ] },
    ],
  },
  de: {
    legal: "Rechtliches",
    title: "Allgemeine Geschäftsbedingungen",
    intro: "Mit der Buchung eines Ausflugs, Transfers oder einer Aktivität bei Daily Red Sea stimmst du den folgenden Bedingungen zu. Diese gelten zusätzlich zu den besonderen Bedingungen auf der jeweiligen Ausflugsseite.",
    back: "Zur Startseite",
    sections: [
      { title: "Buchung & Bestätigung", paragraphs: ["Eine Anfrage über unsere Website oder WhatsApp ist erst bestätigt, wenn du von unserem Team eine Bestätigung mit dem endgültigen Preis, den Abholdetails und der Zahlungsmethode erhalten hast. Bitte prüfe die Bestätigung sorgfältig und teile uns Fehler sofort mit."] },
      { title: "Preise & Zahlung", paragraphs: ["Die Preise gelten pro Person oder pro Buchung in der von dir gewählten Währung und enthalten die auf der Ausflugsseite aufgeführten Leistungen. Sofern nicht anders angegeben, erfolgt die Zahlung bei Ankunft in bar. Für einzelne Ausflüge kann eine Online-Vorauszahlung oder Anzahlung erforderlich sein; darauf weisen wir vor der Bestätigung deutlich hin. Zum angegebenen Preis kommen keine versteckten Gebühren hinzu."] },
      { title: "Abholung & Teilnahme", paragraphs: ["Abholzeiten sind Richtwerte und werden am Vortag oder am Morgen der Aktivität per WhatsApp bestätigt. Sie können sich aufgrund von Verkehr, Wetter oder Hotellage ändern. Für manche Aktivitäten gelten Alters-, Gesundheits-, Schwimm- oder Fitnessanforderungen. Bitte lies diese vor der Buchung und informiere uns vorab über relevante gesundheitliche Einschränkungen."] },
      { title: "Änderungen an Buchungen", paragraphs: ["Wenn du Datum, Gruppengröße oder Abholdetails ändern möchtest, kontaktiere uns so früh wie möglich per WhatsApp. Änderungen sind von der Verfügbarkeit abhängig und kurz vor dem Aktivitätstag möglicherweise nicht mehr möglich."] },
      { title: "Stornierungen & Rückerstattungen", id: "cancellations", paragraphs: [
        "Kostenlose Stornierungsfrist: Sofern auf der jeweiligen Ausflugsseite keine andere Frist angegeben ist, berechtigen Stornierungen mindestens 24 Stunden vor der geplanten Abholzeit zu einer vollständigen Rückerstattung. Bei Barzahlung vor Ort entstehen keine Kosten.",
        "Verspätete Stornierungen: Bei Stornierungen innerhalb von 24 Stunden vor der Abholung oder bei Nichterscheinen besteht kein Anspruch auf Rückerstattung, da lokale Anbieter deinen Platz reservieren und Kosten entstehen.",
        "Ausflugsspezifische Bedingungen: Für bestimmte Aktivitäten, zum Beispiel private Touren, Boote mit begrenzter Kapazität oder Leistungen externer Anbieter, kann eine längere Frist gelten oder eine Rückerstattung ausgeschlossen sein. Dies wird vor der Buchung auf der Ausflugsseite angezeigt.",
        "Stornierungen durch uns: Müssen wir oder ein lokaler Anbieter eine Aktivität wegen Wetter, Sicherheit, zu geringer Gruppengröße oder betrieblicher Gründe absagen oder verschieben, erhältst du eine vollständige Rückerstattung oder kannst einen anderen Termin beziehungsweise eine andere Aktivität wählen.",
        "So stornierst du: Sende uns so früh wie möglich deine Buchungsnummer per WhatsApp. Wir bestätigen die Erstattungsberechtigung und veranlassen eine mögliche Rückzahlung innerhalb der genannten Bearbeitungszeit, zum Beispiel 5–7 Werktage, über die ursprüngliche Zahlungsmethode. Bei Barzahlung vor Ort wird nichts berechnet.",
      ] },
      { title: "Haftung", paragraphs: [
        "Daily Red Sea ist eine Buchungs- und Koordinationsplattform, die Reisende mit lokalen Anbietern, Crews, Reiseleitern und Fahrern in Hurghada verbindet, welche die jeweilige Leistung durchführen.",
        "Ausflüge, Bootsfahrten, Safaris und Transfers werden von unabhängigen lokalen Anbietern nach deren Sicherheitsstandards und den geltenden ägyptischen Vorschriften durchgeführt.",
        "Wasseraktivitäten wie Schnorcheln, Tauchen und Bootsfahrten sowie Landaktivitäten wie Quadfahren und Wüstensafaris sind mit unvermeidbaren Risiken verbunden. Gäste nehmen auf eigenes Risiko teil und müssen jederzeit die Sicherheitsunterweisung und Anweisungen des Reiseleiters oder der Crew befolgen.",
        "Daily Red Sea haftet nicht für Verletzungen, Verluste, Erkrankungen oder Schäden, die durch Missachtung von Sicherheitsanweisungen, bei der Buchung nicht angegebene Vorerkrankungen oder Ereignisse außerhalb unseres zumutbaren Einflusses entstehen, einschließlich Wetter, Naturereignissen, Handlungen Dritter oder höherer Gewalt.",
        "Routen, Ablauf und Zeiten können vom lokalen Anbieter aus Sicherheits- oder Betriebsgründen angepasst werden. Über wesentliche Änderungen informieren wir dich so früh wie möglich.",
        "Diese Bedingungen schließen keine Haftung aus, die nach geltendem Recht nicht ausgeschlossen werden darf.",
      ] },
    ],
  },
  ru: {
    legal: "Правовая информация",
    title: "Условия бронирования",
    intro: "Бронируя экскурсию, трансфер или другое мероприятие у Daily Red Sea, вы соглашаетесь с приведёнными ниже условиями. Они действуют вместе со специальными условиями, указанными на странице конкретной экскурсии.",
    back: "На главную",
    sections: [
      { title: "Бронирование и подтверждение", paragraphs: ["Заявка, отправленная через сайт или WhatsApp, считается подтверждённой только после сообщения от нашей команды с окончательной стоимостью, деталями трансфера и способом оплаты. Пожалуйста, внимательно проверьте подтверждение и сразу сообщите нам, если какие-либо данные указаны неверно."] },
      { title: "Цены и оплата", paragraphs: ["Цены указаны за человека или за бронирование в выбранной валюте и включают услуги, перечисленные на странице экскурсии. Если не указано иное, оплата производится наличными по прибытии. Для некоторых экскурсий может потребоваться онлайн-предоплата или депозит; об этом будет ясно сообщено до подтверждения. Мы не добавляем скрытых сборов к указанной цене."] },
      { title: "Трансфер и участие", paragraphs: ["Время трансфера является ориентировочным и подтверждается через WhatsApp накануне или утром в день мероприятия. Оно может измениться из-за дорожной ситуации, погоды или расположения отеля. Для некоторых мероприятий действуют требования по возрасту, здоровью, умению плавать или физической подготовке. Ознакомьтесь с ними до бронирования и заранее сообщите нам о важных медицинских особенностях."] },
      { title: "Изменение бронирования", paragraphs: ["Если необходимо изменить дату, размер группы или детали трансфера, свяжитесь с нами через WhatsApp как можно раньше. Изменения зависят от наличия мест и могут быть невозможны незадолго до даты мероприятия."] },
      { title: "Отмена и возврат средств", id: "cancellations", paragraphs: [
        "Бесплатная отмена: Если на странице экскурсии не указан другой срок, при отмене не позднее чем за 24 часа до запланированного времени трансфера вы имеете право на полный возврат. При оплате наличными по прибытии плата не взимается.",
        "Поздняя отмена: При отмене менее чем за 24 часа до трансфера или при неявке возврат не предоставляется, поскольку местные поставщики резервируют место и несут расходы.",
        "Специальные условия экскурсии: Для некоторых мероприятий, например частных туров, лодок с ограниченной вместимостью или услуг сторонних операторов, может действовать более длительный срок отмены либо бронирование может быть невозвратным. Это всегда указывается на странице экскурсии до бронирования.",
        "Отмена с нашей стороны: Если мы или местный поставщик вынуждены отменить или перенести мероприятие из-за погоды, безопасности, недостаточного количества участников или операционных причин, вам предложат полный возврат либо перенос на другую дату или мероприятие.",
        "Как отменить: Как можно раньше отправьте нам номер бронирования через WhatsApp. Мы подтвердим право на возврат и, если он положен, вернём средства исходным способом оплаты в течение указанного количества рабочих дней, например 5–7 дней. При оплате наличными по прибытии плата не взимается.",
      ] },
      { title: "Ответственность", paragraphs: [
        "Daily Red Sea работает как платформа бронирования и координации, связывая путешественников с местными операторами, экипажами, гидами и водителями в Хургаде, которые непосредственно оказывают услуги.",
        "Экскурсии, морские прогулки, сафари и трансферы выполняются независимыми местными поставщиками в соответствии с их правилами безопасности и применимыми нормами Египта.",
        "Водные мероприятия, включая снорклинг, дайвинг и морские прогулки, а также наземные мероприятия, включая поездки на квадроциклах и сафари, связаны с естественным риском. Гости участвуют на свой риск и обязаны всегда соблюдать инструктаж и указания гида или экипажа.",
        "Daily Red Sea не несёт ответственности за травмы, утрату имущества, заболевания или ущерб, возникшие из-за несоблюдения инструкций, не сообщённых при бронировании заболеваний либо обстоятельств вне нашего разумного контроля, включая погоду, природные явления, действия третьих лиц и форс-мажор.",
        "Маршрут, программа и время могут быть изменены местным оператором по соображениям безопасности или по операционным причинам. Мы постараемся сообщить о существенных изменениях как можно раньше.",
        "Ничто в настоящих условиях не исключает ответственность, которую нельзя исключить по применимому законодательству.",
      ] },
    ],
  },
  ar: {
    legal: "معلومات قانونية",
    title: "الشروط والأحكام",
    intro: "عند حجز رحلة أو توصيل أو نشاط مع Daily Red Sea فإنك توافق على الشروط التالية، إلى جانب أي شروط خاصة تظهر في صفحة النشاط.",
    back: "العودة إلى الرئيسية",
    sections: [
      { title: "الحجز والتأكيد", paragraphs: ["لا يصبح الطلب المرسل عبر الموقع أو واتساب مؤكداً إلا بعد استلام تأكيد من فريقنا يتضمن السعر النهائي وتفاصيل الاستلام وطريقة الدفع. راجع التأكيد وأبلغنا فوراً عن أي خطأ."] },
      { title: "الأسعار والدفع", paragraphs: ["تُعرض الأسعار للشخص أو للحجز بالعملة المختارة وتشمل الخدمات المذكورة في صفحة الرحلة. ما لم يُذكر غير ذلك، يكون الدفع نقداً عند الوصول. قد تتطلب بعض الرحلات دفعة مقدمة، وسيظهر ذلك بوضوح قبل التأكيد. لا نضيف رسوماً مخفية."] },
      { title: "الاستلام والمشاركة", paragraphs: ["مواعيد الاستلام تقديرية ويتم تأكيدها عبر واتساب في اليوم السابق أو صباح النشاط، وقد تتغير بسبب المرور أو الطقس أو موقع الفندق. اقرأ متطلبات العمر والصحة والسباحة واللياقة وأبلغنا مسبقاً بأي حالة طبية مهمة."] },
      { title: "تعديل الحجز", paragraphs: ["لتغيير التاريخ أو عدد المشاركين أو تفاصيل الاستلام، تواصل معنا عبر واتساب في أقرب وقت. تعتمد التغييرات على التوفر وقد لا تكون ممكنة قبل موعد النشاط بفترة قصيرة."] },
      { title: "الإلغاء واسترداد المبالغ", id: "cancellations", paragraphs: [
        "الإلغاء المجاني: ما لم تُذكر مدة مختلفة في صفحة الرحلة، يحق لك استرداد كامل عند الإلغاء قبل موعد الاستلام بـ24 ساعة على الأقل. لا تُحصّل أي رسوم للحجوزات المدفوعة نقداً عند الوصول.",
        "الإلغاء المتأخر: لا يحق استرداد المبلغ عند الإلغاء خلال 24 ساعة من موعد الاستلام أو عدم الحضور، لأن المورد المحلي يحجز مكانك ويتحمل تكاليف.",
        "شروط خاصة: قد تتطلب الرحلات الخاصة أو القوارب محدودة السعة إشعاراً أطول أو تكون غير قابلة للاسترداد، وسيظهر ذلك قبل الحجز.",
        "الإلغاء من طرفنا: إذا اضطررنا نحن أو المورد المحلي للإلغاء أو إعادة الجدولة بسبب الطقس أو السلامة أو أسباب تشغيلية، سنعرض استرداداً كاملاً أو موعداً أو نشاطاً بديلاً.",
        "طريقة الإلغاء: أرسل رقم الحجز عبر واتساب في أسرع وقت. سنؤكد استحقاق الاسترداد ونعيده إلى طريقة الدفع الأصلية خلال المدة الموضحة، عادةً من 5 إلى 7 أيام عمل.",
      ] },
      { title: "المسؤولية", paragraphs: [
        "تعمل Daily Red Sea كمنصة للحجز والتنسيق تربط المسافرين بالمشغلين والأطقم والمرشدين والسائقين المحليين الذين يقدمون النشاط.",
        "تُنفذ الرحلات البحرية والسفاري والتوصيلات بواسطة موردين محليين مستقلين وفق معايير السلامة الخاصة بهم والقوانين المصرية المعمول بها.",
        "تنطوي أنشطة الغوص والسنوركلينج والقوارب والكواد والسفاري على مخاطر طبيعية. يشارك الضيوف على مسؤوليتهم ويلتزمون بتعليمات السلامة.",
        "لا تتحمل Daily Red Sea مسؤولية الضرر الناتج عن عدم اتباع التعليمات أو حالة طبية لم يتم الإفصاح عنها أو ظروف خارجة عن سيطرتنا مثل الطقس والقوة القاهرة.",
        "قد يغيّر المشغل المحلي المسار أو البرنامج أو المواعيد لأسباب تتعلق بالسلامة أو التشغيل، وسنبلغك بالتغييرات المهمة في أقرب وقت.",
      ] },
    ],
  },
  zh: {
    legal: "法律信息",
    title: "条款与条件",
    intro: "预订 Daily Red Sea 的旅游、接送或活动，即表示您同意以下条款。这些条款与各项目页面所列的特别条件一同适用。",
    back: "返回首页",
    sections: [
      { title: "预订与确认", paragraphs: ["通过网站或 WhatsApp 提交的请求，只有在您收到团队发出的确认（包括最终价格、接送详情和付款方式）后才算确认。请仔细核对确认信息，如有错误请立即告知我们。"] },
      { title: "价格与付款", paragraphs: ["价格按人或按次预订显示，使用您选择的货币，并包含项目页面列出的服务。除非另有说明，抵达时以现金付款。部分项目可能需要在线预付款或订金，我们会在您确认前明确说明。所列价格不包含任何隐藏费用。"] },
      { title: "接送与参加要求", paragraphs: ["接送时间为预计时间，并会在活动前一天或当天早上通过 WhatsApp 确认；时间可能因交通、天气或酒店位置而变化。部分活动有年龄、健康、游泳能力或体能要求，请在预订前阅读并提前告知我们相关健康状况。"] },
      { title: "更改预订", paragraphs: ["如需更改日期、人数或接送详情，请尽早通过 WhatsApp 联系我们。更改取决于名额，临近活动日期时可能无法安排。"] },
      { title: "取消与退款", id: "cancellations", paragraphs: [
        "免费取消期限：除非具体项目页面另有规定，在计划接送时间至少 24 小时前取消，可获得全额退款；抵达后现金付款的预订不会收费。",
        "逾期取消：在接送前 24 小时内取消或未到场，因本地供应商已保留名额并产生成本，不予退款。",
        "项目特别条款：私人行程、容量有限的游船或第三方运营项目可能需要更长的提前通知时间，或不可退款；相关规定会在预订前显示于项目页面。",
        "由我们取消：如我们或本地供应商因天气、安全、人数不足或运营原因取消或改期，您可选择全额退款，或改订其他日期或活动。",
        "取消方式：请尽快通过 WhatsApp 发送预订编号。我们会确认退款资格，并在所述工作日内（例如 5–7 个工作日）按原付款方式处理；抵达后现金付款的预订不会收费。",
      ] },
      { title: "责任", paragraphs: [
        "Daily Red Sea 是预订和协调平台，将游客与在赫尔格达实际提供服务的本地运营商、船员、导游和司机连接起来。",
        "旅游、游船、沙漠探险和接送由独立本地供应商按照其安全标准和适用的埃及法规执行。",
        "浮潜、潜水、游船、四轮摩托和沙漠探险等活动存在固有风险。参加者自行承担风险，并须始终遵守导游或工作人员的安全说明。",
        "如因未遵守安全说明、预订时未披露的既往病史，或超出我们合理控制范围的事件（包括天气、自然事件、第三方行为或不可抗力）造成伤害、损失、疾病或损害，Daily Red Sea 不承担责任。",
        "本地运营商可因安全或运营原因调整路线、行程和时间；我们会尽早通知重大变更。",
        "本条款不排除适用法律规定不得排除的责任。",
      ] },
    ],
  },
  pl: {
    legal: "Informacje prawne",
    title: "Regulamin",
    intro: "Dokonując rezerwacji wycieczki, transferu lub innej aktywności u Daily Red Sea, akceptujesz poniższe warunki. Obowiązują one łącznie z wszelkimi szczegółowymi warunkami podanymi na stronie danej wycieczki.",
    back: "Powrót do strony głównej",
    sections: [
      { title: "Rezerwacje i potwierdzenie", paragraphs: ["Zgłoszenie przesłane przez naszą stronę internetową lub WhatsApp nie jest potwierdzone, dopóki nie otrzymasz potwierdzenia od naszego zespołu, zawierającego ostateczną cenę, szczegóły odbioru oraz sposób płatności. Prosimy o dokładne sprawdzenie potwierdzenia i natychmiastowe zgłoszenie nam wszelkich nieprawidłowości."] },
      { title: "Ceny i płatność", paragraphs: ["Ceny podane są za osobę lub za rezerwację, w wybranej przez Ciebie walucie, i obejmują świadczenia wymienione na stronie danej wycieczki. O ile nie zaznaczono inaczej, płatność przyjmowana jest w gotówce po przyjeździe; niektóre wycieczki mogą wymagać przedpłaty online lub zadatku, o czym zostaniesz wyraźnie poinformowany przed potwierdzeniem rezerwacji. Nie doliczamy żadnych ukrytych opłat do podanej ceny."] },
      { title: "Odbiór i uczestnictwo", paragraphs: ["Godziny odbioru są orientacyjne i zostają potwierdzone dzień wcześniej (lub rano w dniu aktywności) przez WhatsApp; mogą ulec zmianie z powodu ruchu drogowego, pogody lub lokalizacji hotelu. Niektóre aktywności mają wymagania dotyczące wieku, stanu zdrowia, umiejętności pływania lub sprawności fizycznej, podane na stronie wycieczki — prosimy zapoznać się z nimi przed rezerwacją i poinformować nas z wyprzedzeniem o istotnych schorzeniach."] },
      { title: "Zmiany w rezerwacji", paragraphs: ["Jeśli musisz zmienić datę, liczebność grupy lub szczegóły odbioru, skontaktuj się z nami przez WhatsApp jak najwcześniej. Zmiany zależą od dostępności i mogą nie być możliwe tuż przed datą aktywności."] },
      { title: "Anulacje i zwroty", id: "cancellations", paragraphs: [
        "Bezpłatne anulowanie: O ile na stronie danej wycieczki nie podano innego terminu, anulacje dokonane co najmniej 24 godziny przed zaplanowaną godziną odbioru uprawniają do pełnego zwrotu (lub nie wiążą się z żadną opłatą w przypadku rezerwacji z płatnością gotówką po przyjeździe).",
        "Późne anulacje: Anulacje dokonane w ciągu 24 godzin przed odbiorem oraz niestawienie się nie uprawniają do zwrotu, ponieważ lokalni dostawcy rezerwują dla Ciebie miejsce i ponoszą związane z tym koszty.",
        "Warunki właściwe dla danej wycieczki: Niektóre aktywności (na przykład wycieczki prywatne, łodzie o ograniczonej liczbie miejsc lub usługi realizowane przez podmioty zewnętrzne) mogą wymagać dłuższego okresu wypowiedzenia lub być bezzwrotne — informacja ta zawsze będzie podana na stronie wycieczki przed dokonaniem rezerwacji.",
        "Anulacje z naszej strony: Jeśli my lub nasz lokalny dostawca musimy odwołać lub przełożyć aktywność (z powodu pogody, bezpieczeństwa, niewystarczającej liczby uczestników lub przyczyn operacyjnych), zaproponujemy pełny zwrot środków lub możliwość zmiany terminu bądź aktywności.",
        "Jak anulować: Napisz do nas na WhatsApp, podając numer rezerwacji, najszybciej jak to możliwe. Potwierdzimy Twoje uprawnienie do zwrotu i, jeśli ma to zastosowanie, zrealizujemy go na pierwotną metodę płatności w podanej liczbie dni roboczych (na przykład 5–7 dni) — w przypadku rezerwacji z płatnością gotówką po przyjeździe nie pobiera się żadnej opłaty.",
      ] },
      { title: "Odpowiedzialność", paragraphs: [
        "Daily Red Sea działa jako platforma rezerwacji i koordynacji, łącząca podróżnych z lokalnymi operatorami, załogami, przewodnikami i kierowcami z Hurghady, którzy faktycznie realizują daną aktywność.",
        "Wycieczki, rejsy łodzią, safari i transfery są realizowane przez niezależnych lokalnych dostawców zgodnie z ich własnymi standardami bezpieczeństwa oraz obowiązującymi przepisami egipskimi.",
        "Uczestnictwo w aktywnościach wodnych (nurkowanie ze snorkelem, nurkowanie, rejsy łodzią) oraz lądowych (jazda quadem, safari po pustyni) wiąże się z nieodłącznym ryzykiem. Goście uczestniczą na własne ryzyko i są zobowiązani zawsze przestrzegać instruktażu bezpieczeństwa oraz poleceń przewodnika lub załogi.",
        "Daily Red Sea nie ponosi odpowiedzialności za obrażenia, straty, choroby lub szkody wynikające z nieprzestrzegania przez gościa instrukcji bezpieczeństwa, niezgłoszonych przy rezerwacji istniejących wcześniej schorzeń lub zdarzeń pozostających poza naszą uzasadnioną kontrolą (w tym pogody, zjawisk naturalnych, działań osób trzecich lub siły wyższej).",
        "Trasy, przebieg i godziny mogą zostać zmienione przez lokalnego operatora z przyczyn bezpieczeństwa lub operacyjnych; dołożymy starań, aby jak najwcześniej informować o istotnych zmianach.",
        "Żadne postanowienie niniejszego regulaminu nie wyłącza odpowiedzialności, której zgodnie z obowiązującym prawem nie można wyłączyć.",
      ] },
    ],
  },
};

function Paragraph({ children }: { children: string }) {
  const separator = children.indexOf(":");
  if (separator < 0) return <p className="leading-8">{children}</p>;
  return <p className="leading-8"><strong className="text-slate-900">{children.slice(0, separator + 1)}</strong>{children.slice(separator + 1)}</p>;
}

export default function TermsConditionsPage({ locale = "en" }: { locale?: Locale }) {
  const content = copy[locale];
  return (
    <main className="mx-auto max-w-5xl px-6 py-24 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{content.legal}</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900">{content.title}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">{content.intro}</p>
        <div className="mt-10 space-y-7 text-slate-700">
          {content.sections.map((section) => <section key={section.title} id={section.id} className={section.id ? "scroll-mt-28" : undefined}>
            <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
            <div className="mt-3 space-y-3">{section.paragraphs.map((paragraph) => <Paragraph key={paragraph}>{paragraph}</Paragraph>)}</div>
          </section>)}
        </div>
        <Link href={localePath(locale)} className="mt-10 inline-flex text-sm font-semibold text-cyan-700">← {content.back}</Link>
      </div>
    </main>
  );
}
